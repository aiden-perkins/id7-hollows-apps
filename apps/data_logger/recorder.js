'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_SAVED_BYTES = 256 * 1024 * 1024;
const MAX_LINE_BYTES = 1024 * 1024;
const CHUNK_BYTES = 64 * 1024;
const SYNC_BYTES = 1024 * 1024;

function uniqueName(prefix) {
    return prefix + '-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(8).toString('hex');
}
function directory(dir) {
    fs.mkdirSync(dir, { recursive: true });
    const info = fs.lstatSync(dir);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Unsafe recording directory: ' + dir);
}
function syncDirectory(dir) {
    // Windows does not support opening directories through Node's ordinary fs API.
    if (process.platform === 'win32') return;
    const fd = fs.openSync(dir, 'r');
    try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}

// sessions/*.jsonl are append-only UTF-8 JSON objects, each terminated by LF.
// Every line carries sessionId. The first is {type:'catalog', schemaVersion:1,
// at, catalog}; subsequent records retain the caller's type/at and other fields.
// A clean stop adds type:'session_end'. Missing end markers mean interruption,
// not missing measurements to invent. stats.records counts complete lines written
// by this Recorder instance, including catalog/end records; stats.bytes includes
// all saved sessions and incomplete crash tails. Exports retain complete lines
// verbatim in filename/offset order and wrap crash tails losslessly in explicit
// interrupted-tail records (rawBase64), without modifying the saved sessions.
class Recorder {
    constructor(dataDir, catalogObject, onError) {
        this.sessionsDir = path.join(dataDir, 'sessions');
        this.exportsDir = path.join(dataDir, 'exports');
        this.catalog = catalogObject;
        this.onError = typeof onError === 'function' ? onError : null;
        this.fd = null;
        this.sessionId = null;
        this.timer = null;
        this.unsynced = 0;
        this.sessionCount = 0;
        this.byteCount = 0;
        this.recordCount = 0;
        this.error = '';
        this.ready = false;
        try {
            directory(this.sessionsDir);
            directory(this.exportsDir);
            for (const file of this._snapshot()) {
                this.sessionCount++;
                this.byteCount += file.bytes;
            }
            this.ready = true;
        } catch (e) { this._fail(e); }
    }
    _snapshot() {
        return fs.readdirSync(this.sessionsDir).filter((name) => name.endsWith('.jsonl')).sort().map((name) => {
            const file = path.join(this.sessionsDir, name);
            const info = fs.lstatSync(file);
            if (!info.isFile() || info.isSymbolicLink()) throw new Error('Unsafe saved session: ' + name);
            return { path: file, name, bytes: info.size };
        });
    }
    _release() {
        clearInterval(this.timer);
        this.timer = null;
        const fd = this.fd;
        this.fd = null;
        this.sessionId = null;
        this.unsynced = 0;
        let failure = null;
        if (fd !== null) {
            try { fs.fsyncSync(fd); } catch (e) { failure = e; }
            try { fs.closeSync(fd); } catch (e) { if (!failure) failure = e; }
        }
        return failure;
    }
    _fail(error) {
        const cleanup = this._release();
        const message = error && error.message ? error.message : String(error);
        this.error = message + (cleanup ? '; closing session: ' + cleanup.message : '');
        if (this.onError) {
            // A UI/collection callback must not turn a storage fault into an
            // uncaught exception in a vehicle-data subscription or timer.
            try { this.onError(new Error(this.error)); } catch (_) { /* Storage error remains visible in stats. */ }
        }
        return false;
    }
    _sync() {
        if (this.fd !== null && this.unsynced) {
            fs.fsyncSync(this.fd);
            this.unsynced = 0;
        }
    }
    _encode(record) {
        const text = JSON.stringify(record);
        if (typeof text !== 'string') throw new Error('Record is not JSON serializable');
        const bytes = Buffer.byteLength(text, 'utf8') + 1;
        if (bytes > MAX_LINE_BYTES) throw new Error('Recording record exceeds the 1 MiB limit; saved data preserved');
        if (this.byteCount + bytes > MAX_SAVED_BYTES) {
            throw new Error('Saved sessions reached the 256 MiB limit; recording stopped and saved data preserved');
        }
        return Buffer.from(text + '\n', 'utf8');
    }
    _write(buffer) {
        let offset = 0;
        while (offset < buffer.length) {
            const count = fs.writeSync(this.fd, buffer, offset, buffer.length - offset);
            if (!count) throw new Error('Recording write made no progress');
            offset += count;
            this.byteCount += count;
            this.unsynced += count;
        }
        this.recordCount++;
        if (this.unsynced >= SYNC_BYTES) this._sync();
    }
    start() {
        if (this.fd !== null) return true;
        try {
            if (!this.ready) throw new Error(this.error || 'Recording storage is unavailable');
            this.error = '';
            const id = uniqueName('session');
            const catalog = this._encode({ schemaVersion: 1, type: 'catalog', at: Date.now(), sessionId: id, catalog: this.catalog });
            this.fd = fs.openSync(path.join(this.sessionsDir, id + '.jsonl'), 'wx', 0o600);
            this.sessionId = id;
            this.sessionCount++;
            this._write(catalog);
            this._sync();
            syncDirectory(this.sessionsDir);
            this.timer = setInterval(() => {
                try { this._sync(); } catch (e) { this._fail(e); }
            }, 1000);
            if (this.timer.unref) this.timer.unref();
            return true;
        } catch (e) { return this._fail(e); }
    }
    append(record) {
        if (this.fd === null) return false;
        try {
            if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Recording record must be an object');
            this._write(this._encode(Object.assign({}, record, { sessionId: this.sessionId })));
            return true;
        } catch (e) { return this._fail(e); }
    }
    stop() {
        if (this.fd === null) return true;
        if (!this.append({ type: 'session_end', at: Date.now() })) return false;
        const failure = this._release();
        return failure ? this._fail(failure) : true;
    }
    stats() {
        return { sessions: this.sessionCount, bytes: this.byteCount, records: this.recordCount,
            recording: this.fd !== null, error: this.error };
    }
    close() { return this.stop(); }

    async combine() {
        let output = null;
        let temporary = null;
        try {
            if (!this.ready) throw new Error(this.error || 'Recording storage is unavailable');
            this._sync();
            // Capture lengths before the first await: later appends and sessions
            // are excluded, even when export runs concurrently with collection.
            const files = this._snapshot();
            const name = 'all-sessions.jsonl';
            const destination = path.join(this.exportsDir, name);
            const candidate = path.join(this.exportsDir, uniqueName('all-sessions') + '.tmp');
            output = await fs.promises.open(candidate, 'wx', 0o600);
            temporary = candidate;
            let bytes = 0;
            const writeBuffer = async (buffer) => {
                let written = 0;
                while (written < buffer.length) {
                    const result = await output.write(buffer, written, buffer.length - written);
                    if (!result.bytesWritten) throw new Error('Export write made no progress');
                    written += result.bytesWritten;
                    bytes += result.bytesWritten;
                }
            };
            const chunk = Buffer.alloc(CHUNK_BYTES);
            // A single fixed-size line buffer bounds memory even for malformed
            // saved files without newlines; never accumulate a complete session.
            const line = Buffer.alloc(MAX_LINE_BYTES);
            for (const file of files) {
                const input = await fs.promises.open(file.path, 'r');
                try {
                    let offset = 0;
                    let length = 0; 
                    while (offset < file.bytes) {
                        const result = await input.read(chunk, 0, Math.min(chunk.length, file.bytes - offset), offset);
                        if (!result.bytesRead) throw new Error('Saved session was truncated: ' + file.name);
                        offset += result.bytesRead;
                        let begin = 0;
                        while (begin < result.bytesRead) {
                            let end = chunk.indexOf(10, begin);
                            if (end < 0 || end >= result.bytesRead) end = result.bytesRead;
                            const count = end - begin;
                            if (length + count + 1 > MAX_LINE_BYTES) throw new Error('Oversized saved record in ' + file.name);
                            chunk.copy(line, length, begin, end);
                            length += count;
                            if (end < result.bytesRead) {
                                const raw = line.subarray(0, length);
                                const text = raw.toString('utf8');
                                let parsed;
                                try {
                                    if (!Buffer.from(text, 'utf8').equals(raw)) throw new Error('Invalid UTF-8');
                                    parsed = JSON.parse(text);
                                    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object');
                                } catch (e) { throw new Error('Invalid saved JSONL in ' + file.name + ': ' + e.message); }
                                line[length++] = 10;
                                await writeBuffer(line.subarray(0, length));
                                length = 0;
                            }
                            begin = end + 1;
                        }
                    }
                    if (length || !file.bytes) {
                        const interruption = {
                            schemaVersion: 1,
                            type: length ? 'interrupted-tail' : 'interrupted-session',
                            sourceFile: file.name,
                            byteOffset: file.bytes - length,
                            rawBase64: line.subarray(0, length).toString('base64'),
                            note: length ? 'Unterminated bytes preserved verbatim; session may have lost power during a write.' :
                                'Session file is empty; recording may have been interrupted before the catalog was written.'
                        };
                        await writeBuffer(Buffer.from(JSON.stringify(interruption) + '\n', 'utf8'));
                    }
                } finally { await input.close(); }
            }
            await output.sync();
            await output.close();
            output = null;
            // Atomic replacement never truncates an existing download's inode.
            // On platforms that cannot replace an open file, rename fails and
            // leaves the previous successful export untouched.
            await fs.promises.rename(temporary, destination);
            temporary = null;
            syncDirectory(this.exportsDir);
            return { path: destination, name, bytes };
        } catch (e) {
            if (output) {
                try { await output.close(); } catch (_) { /* Preserve original error. */ }
            }
            if (temporary) {
                try { await fs.promises.unlink(temporary); } catch (cleanup) {
                    if (cleanup.code !== 'ENOENT') e = new Error(e.message + '; removing incomplete export: ' + cleanup.message);
                }
            }
            this._fail(e);
            throw new Error(this.error);
        }
    }
}

module.exports = { Recorder };

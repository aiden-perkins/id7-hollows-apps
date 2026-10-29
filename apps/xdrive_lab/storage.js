'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const JOURNAL = 'xdrive-lab-raw.jsonl';
const RECORDER = 'xdrive-lab-recorder.json';
const FILE_LIMIT = 4 * 1024 * 1024;
const FILE_COUNT = 4;
const QUEUE_LIMIT = 1024 * 1024;
const QUEUE_RECORDS = 4096;
const SCHEMA = 1;
const EXPORT_COUNT = 2;
const EXPORT_BYTES = 48 * 1024 * 1024;
function text(error) { return error && error.message ? error.message : String(error); }
function copy(value) { return JSON.parse(JSON.stringify(value)); }
function emptyCounts() {
    return { accepted: 0, written: 0, writtenBytes: 0, dropped: 0, droppedBytes: 0,
        errorCount: 0, rotations: 0, evictedRecords: 0, evictedBytes: 0,
        uncertainRecords: 0, interruptedSessions: 0, batches: 0, lastFlushAt: null };
}

class Store {
    constructor(dataDir) {
        this.dir = dataDir; this.errors = {}; this.blocked = {}; this.closed = false;
        this.queue = []; this.queueBytes = 0; this.files = {}; this.counts = emptyCounts();
        this.validated = {}; this.flushing = false; this.exportSequence = 0;
        this.exports = [];
        try {
            try { fs.mkdirSync(dataDir); } catch (e) { if (e.code !== 'EEXIST') throw e; }
            if (!fs.statSync(dataDir).isDirectory()) throw new Error('Evidence path is not a directory');
        } catch (e) { this.fault('directory', 'Cannot open evidence directory: ' + text(e)); }
        const previous = this.load(RECORDER, null);
        if (previous !== null) {
            if (!previous || previous.schemaVersion !== SCHEMA || !previous.counts || typeof previous.cleanShutdown !== 'boolean' ||
                Object.keys(emptyCounts()).some((key) => key !== 'lastFlushAt' &&
                    (typeof previous.counts[key] !== 'number' || !isFinite(previous.counts[key]) || previous.counts[key] < 0))) {
                this.fault(RECORDER, 'Invalid recorder metadata; original evidence preserved');
            } else {
                this.counts = Object.assign(emptyCounts(), previous.counts);
                if (!previous.cleanShutdown) {
                    this.counts.interruptedSessions += 1;
                    if (typeof previous.queued === 'number' && previous.queued > 0) this.counts.uncertainRecords += previous.queued;
                    this.fault('interruption', 'Previous recorder did not close cleanly; unsaved or partly committed raw samples have unknown loss. Original evidence preserved; native writes blocked.');
                }
            }
        }
        this.journalNames().forEach((name) => this.inspectJournal(name));
        if (previous === null && Object.keys(this.files).length && !this.blocked[RECORDER]) {
            this.fault(RECORDER, 'Raw journals exist without recorder metadata; earlier retention/loss counts are unknown. Original evidence preserved.');
        }
        this.startedAt = Date.now();
        try { this.exports = this.exportNames(); }
        catch (e) { this.fault('exports', 'Cannot enumerate retained exports: ' + text(e)); }
        if (!Object.keys(this.errors).length) {
            try { this.saveRecorder(false); } catch (e) { /* fault is retained by save */ }
        }
        this.timer = setInterval(() => {
            if (!this.closed && this.queue.length) {
                try { this.flushSync(); } catch (e) { /* callers observe sticky recorder errors */ }
            }
        }, 250);
        if (this.timer.unref) this.timer.unref();
    }
    journalNames() {
        const result = [JOURNAL];
        for (let i = 1; i < FILE_COUNT; i += 1) result.push(JOURNAL + '.' + i);
        return result;
    }
    file(name) {
        if (typeof name !== 'string' || !name || path.basename(name) !== name || name === '.' || name === '..') throw new Error('Invalid evidence filename');
        return path.join(this.dir, name);
    }
    fault(name, detail) {
        this.errors[name] = detail; this.blocked[name] = true;
        this.counts.errorCount += 1;
    }
    load(name, fallback) {
        try {
            const file = this.file(name);
            if (fs.existsSync(file + '.tmp')) this.fault(name, 'Interrupted save for ' + name + '; original and temporary evidence preserved');
            const result = JSON.parse(fs.readFileSync(file, 'utf8'));
            this.validated[name] = true;
            return result;
        } catch (e) {
            if (e.code !== 'ENOENT') this.fault(name, 'Cannot read ' + name + ': ' + text(e) + '; original evidence preserved');
            return fallback;
        }
    }
    inspectJournal(name) {
        try {
            const file = this.file(name), bytes = fs.statSync(file).size;
            if (bytes > FILE_LIMIT) throw new Error('Journal exceeds retention file size');
            const raw = fs.readFileSync(file, 'utf8');
            if (raw && raw[raw.length - 1] !== '\n') throw new Error('Interrupted JSONL record');
            let records = 0;
            if (raw) raw.slice(0, -1).split('\n').forEach((line) => { JSON.parse(line); records += 1; });
            this.files[name] = { bytes, records };
        } catch (e) {
            if (e.code !== 'ENOENT') this.fault(name, 'Cannot read ' + name + ': ' + text(e) + '; original journal preserved');
        }
    }
    exportNames() { return fs.readdirSync(this.dir).filter((name) => /^xdrive-lab-export-.*\.json(?:\.tmp)?$/.test(name)); }
    syncDirectory() {
        // Node cannot open Windows directories; all critical files themselves are still fsynced.
        if (process.platform === 'win32') return;
        let fd;
        try { fd = fs.openSync(this.dir, 'r'); fs.fsyncSync(fd); }
        finally { if (fd !== undefined) fs.closeSync(fd); }
    }
    save(name, value, compact) {
        if (this.closed) throw new Error('Evidence storage is closed');
        if (this.blocked.directory || this.blocked[name]) throw new Error(this.errors.directory || this.errors[name]);
        let fd;
        try {
            const file = this.file(name), temporary = file + '.tmp';
            if (fs.existsSync(temporary)) throw new Error('Interrupted temporary evidence exists; refusing overwrite');
            if (!this.validated[name] && fs.existsSync(file)) {
                JSON.parse(fs.readFileSync(file, 'utf8'));
                this.validated[name] = true;
            }
            const json = JSON.stringify(value, null, compact ? undefined : 2);
            if (json === undefined) throw new Error('Evidence is not JSON serializable');
            const limit = name.indexOf('xdrive-lab-export-') === 0 ? EXPORT_BYTES :
                name === RECORDER ? 256 * 1024 : name === 'xdrive-lab-state.json' ? 8 * 1024 * 1024 : 1024 * 1024;
            if (Buffer.byteLength(json, 'utf8') > limit) {
                const error = new Error('Evidence file exceeds its bounded size; download/archive existing evidence before collecting more: ' + name);
                if (name.indexOf('xdrive-lab-export-') === 0) error.code = 'EXPORT_LIMIT';
                throw error;
            }
            fd = fs.openSync(temporary, 'wx');
            fs.writeFileSync(fd, json + '\n', 'utf8'); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
            fs.renameSync(temporary, file); this.syncDirectory(); this.validated[name] = true;
            return { name, path: file };
        } catch (e) {
            if (e.code === 'EXPORT_LIMIT') throw e;
            this.fault(name, 'Cannot save ' + name + ': ' + text(e) + '; original/temporary evidence preserved');
            throw new Error(this.errors[name]);
        } finally { if (fd !== undefined) { try { fs.closeSync(fd); } catch (e) { this.fault(name, 'Cannot close evidence file: ' + text(e)); } } }
    }
    saveRecorder(cleanShutdown) {
        return this.save(RECORDER, { schemaVersion: SCHEMA, at: Date.now(), startedAt: this.startedAt,
            cleanShutdown, counts: this.counts, files: this.files, errors: this.errors,
            queued: this.queue.length, queuedBytes: this.queueBytes });
    }
    append(event, critical) {
        let line, bytes = 0, enqueued = false;
        this.counts.accepted += 1;
        try {
            if (this.closed) throw new Error('Evidence storage is closed');
            const json = JSON.stringify(event);
            if (json === undefined) throw new Error('Event is not JSON serializable');
            line = json + '\n'; bytes = Buffer.byteLength(line, 'utf8');
            if (Object.keys(this.errors).length) throw new Error('Recorder has sticky errors: ' + Object.keys(this.errors).map((key) => this.errors[key]).join(' | '));
            if (bytes > FILE_LIMIT) throw new Error('Raw record exceeds bounded journal file size');
            if (bytes > QUEUE_LIMIT || this.queueBytes + bytes > QUEUE_LIMIT || this.queue.length >= QUEUE_RECORDS) this.flushSync();
            // Oversize records bypass the queue budget, but are synchronously committed before returning.
            this.queue.push({ line, bytes }); this.queueBytes += bytes; enqueued = true;
            if (critical || bytes > QUEUE_LIMIT) this.flushSync();
            return true;
        } catch (e) {
            // A queued record is accounted for by flushSync, never counted a second time here.
            if (!enqueued) { this.counts.dropped += 1; this.counts.droppedBytes += bytes; }
            if (!this.errors[JOURNAL]) this.fault(JOURNAL, 'Cannot record raw sample: ' + text(e));
            throw e;
        }
    }
    rotate() {
        const oldest = JOURNAL + '.' + (FILE_COUNT - 1), old = this.files[oldest];
        if (old) {
            fs.unlinkSync(this.file(oldest));
            this.counts.evictedRecords += old.records; this.counts.evictedBytes += old.bytes;
            delete this.files[oldest];
        }
        for (let i = FILE_COUNT - 2; i >= 0; i -= 1) {
            const name = i ? JOURNAL + '.' + i : JOURNAL;
            if (!this.files[name]) continue;
            const next = JOURNAL + '.' + (i + 1);
            fs.renameSync(this.file(name), this.file(next)); this.files[next] = this.files[name]; delete this.files[name];
        }
        this.counts.rotations += 1; this.syncDirectory();
    }
    writeBatch(batch) {
        const bytes = batch.reduce((sum, item) => sum + item.bytes, 0);
        const old = this.files[JOURNAL] || { bytes: 0, records: 0 };
        if (old.bytes + bytes > FILE_LIMIT) this.rotate();
        let fd;
        try {
            fd = fs.openSync(this.file(JOURNAL), 'a');
            const buffer = Buffer.from(batch.map((item) => item.line).join(''), 'utf8');
            let offset = 0;
            while (offset < buffer.length) {
                const written = fs.writeSync(fd, buffer, offset, buffer.length - offset, null);
                if (!written) throw new Error('Journal write made no progress');
                offset += written;
            }
            fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
            const current = this.files[JOURNAL] || { bytes: 0, records: 0 };
            this.files[JOURNAL] = { bytes: current.bytes + bytes, records: current.records + batch.length };
            this.counts.written += batch.length; this.counts.writtenBytes += bytes; this.counts.batches += 1;
            this.counts.lastFlushAt = Date.now();
            this.syncDirectory();
        } finally { if (fd !== undefined) fs.closeSync(fd); }
    }
    flushSync() {
        if (this.flushing) throw new Error('Recorder flush is already in progress');
        if (this.closed) { if (this.queue.length) throw new Error('Evidence storage is closed'); return this.stats(); }
        if (!this.queue.length) return this.stats();
        if (Object.keys(this.errors).length) {
            const error = new Error('Raw recording is blocked: ' + Object.keys(this.errors).map((key) => this.errors[key]).join(' | '));
            this.counts.dropped += this.queue.length; this.counts.droppedBytes += this.queueBytes;
            this.queue = []; this.queueBytes = 0; error.rawBatchAccounted = true; throw error;
        }
        this.flushing = true;
        try {
            // Commit the pending count first, so interrupted batches are explicitly identifiable on restart.
            this.saveRecorder(false);
            while (this.queue.length) {
                let length = 0, bytes = 0;
                while (length < this.queue.length && bytes + this.queue[length].bytes <= FILE_LIMIT &&
                    (length === 0 || bytes < 256 * 1024)) {
                    bytes += this.queue[length].bytes; length += 1;
                }
                const batch = this.queue.slice(0, length);
                this.writeBatch(batch);
                this.queue.splice(0, length); this.queueBytes -= bytes;
            }
            this.saveRecorder(false);
            return this.stats();
        } catch (e) {
            this.counts.uncertainRecords += this.queue.length;
            this.counts.dropped += this.queue.length; this.counts.droppedBytes += this.queueBytes;
            this.queue = []; this.queueBytes = 0;
            this.fault(JOURNAL, 'Cannot durably flush raw journal: ' + text(e) + '; possibly partial evidence preserved');
            e.rawBatchAccounted = true; throw e;
        } finally { this.flushing = false; }
    }
    async flush() { return this.flushSync(); }
    stats() {
        const files = copy(this.files);
        return { schemaVersion: SCHEMA, limits: { files: FILE_COUNT, fileBytes: FILE_LIMIT, queueBytes: QUEUE_LIMIT, queueRecords: QUEUE_RECORDS,
            exports: EXPORT_COUNT, exportBytes: EXPORT_BYTES, stateBytes: 8 * 1024 * 1024, snapshotBytes: 1024 * 1024 },
            counts: copy(this.counts), queued: this.queue.length, queuedBytes: this.queueBytes,
            retainedRecords: Object.keys(files).reduce((sum, name) => sum + files[name].records, 0),
            retainedBytes: Object.keys(files).reduce((sum, name) => sum + files[name].bytes, 0), exports: this.exports.slice(),
            files, errors: copy(this.errors), blocked: copy(this.blocked), closed: this.closed };
    }
    async exportBundle(payload) {
        if (this.closed) throw new Error('Evidence storage is closed');
        this.exports = this.exportNames();
        if (this.exports.length >= EXPORT_COUNT) {
            const error = new Error('Two evidence exports are already retained. Download and archive them, then explicitly remove those export copies from app data before exporting again; recording continues.');
            error.code = 'EXPORT_LIMIT'; throw error;
        }
        let flushError = null;
        try { await this.flush(); } catch (e) { flushError = text(e); }
        const journals = [];
        this.journalNames().reverse().forEach((name) => {
            try {
                const buffer = fs.readFileSync(this.file(name)), raw = buffer.toString('utf8');
                const entry = { name, bytes: buffer.length, sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
                    complete: !raw || raw[raw.length - 1] === '\n', rawJsonl: raw, recordCount: 0 };
                const lines = raw.split('\n');
                if (lines[lines.length - 1] === '') lines.pop();
                lines.forEach((line, index) => {
                    try { JSON.parse(line); entry.recordCount += 1; }
                    catch (e) { entry.complete = false; if (!entry.parseErrors) entry.parseErrors = []; entry.parseErrors.push({ line: index + 1, error: text(e) }); }
                });
                journals.push(entry);
            } catch (e) { if (e.code !== 'ENOENT') journals.push({ name, complete: false, readError: text(e) }); }
        });
        const evidenceFiles = [];
        [RECORDER, 'xdrive-lab-state.json', 'xdrive-lab-baseline.json', 'xdrive-lab-snapshot.json'].forEach((base) => {
            [base, base + '.tmp'].forEach((name) => {
                try {
                    const buffer = fs.readFileSync(this.file(name)), raw = buffer.toString('utf8');
                    const entry = { name, bytes: buffer.length, sha256: crypto.createHash('sha256').update(buffer).digest('hex'), rawJson: raw };
                    try { JSON.parse(raw); entry.parseStatus = 'valid-json'; }
                    catch (e) { entry.parseError = text(e); }
                    evidenceFiles.push(entry);
                } catch (e) { if (e.code !== 'ENOENT') evidenceFiles.push({ name, readError: text(e) }); }
            });
        });
        const bundle = { schemaVersion: SCHEMA, kind: 'xdrive-lab-evidence', exportedAt: Date.now(),
            payload, recorder: this.stats(), flushError, journals, evidenceFiles,
            attribution: 'Raw local observations and operator statements; not proof of physical torque distribution.' };
        const name = 'xdrive-lab-export-' + Date.now() + '-' + process.pid + '-' + (++this.exportSequence) + '.json';
        const result = this.save(name, bundle, true);
        this.exports.push(name);
        return result;
    }
    close() {
        if (this.closed) return;
        clearInterval(this.timer);
        let failure;
        try { this.flushSync(); } catch (e) { failure = e; }
        try { if (!this.blocked[RECORDER] && !this.blocked.directory) this.saveRecorder(!Object.keys(this.errors).length); }
        catch (e) { failure = failure || e; }
        this.closed = true;
        if (failure) throw failure;
    }
}
module.exports = { Store };

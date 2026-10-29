'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RECORD_LIMIT = 12000;
const BYTE_LIMIT = 4 * 1024 * 1024;
const LATEST_FILE = 'touchscreen-latest.json';

function cloneJson(value) {
    const json = JSON.stringify(value);
    if (json === undefined) throw new Error('Evidence is not JSON serializable');
    return JSON.parse(json);
}

function sessionId() {
    const bytes = crypto.randomBytes(16);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = bytes.toString('hex');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
}

class Capture {
    constructor(dataDir) {
        this.dir = dataDir;
        this.active = null;
        this.error = '';
        this.lastFile = '';
        this.lastSummary = null;
        this.events = [];
        try { this.ensureDirectory(); }
        catch (e) { this.error = 'Cannot open capture directory: ' + e.message; }
    }

    ensureDirectory() {
        try { fs.mkdirSync(this.dir); }
        catch (e) { if (e.code !== 'EEXIST') throw e; }
        if (!fs.statSync(this.dir).isDirectory()) throw new Error('Capture path is not a directory');
    }

    begin(metadata) {
        try {
            if (this.active) throw new Error('A touchscreen session is already active');
            const savedMetadata = cloneJson(metadata);
            const id = sessionId();
            this.active = {
                id: id,
                startedAt: Date.now(),
                metadata: savedMetadata,
                received: 0,
                retained: 0,
                dropped: 0,
                bytes: 0
            };
            this.events = [];
            this.error = '';
            return this.active;
        } catch (e) {
            this.error = 'Cannot start touchscreen session: ' + e.message;
            throw e;
        }
    }

    record(kind, data) {
        if (!this.active) return false;
        const session = this.active;
        session.received++;
        if (session.retained >= RECORD_LIMIT) {
            session.dropped++;
            this.error = '';
            return false;
        }
        try {
            const json = JSON.stringify({ at: Date.now(), kind: kind, data: data });
            const bytes = Buffer.byteLength(json, 'utf8');
            if (session.bytes + bytes > BYTE_LIMIT) {
                session.dropped++;
                this.error = '';
                return false;
            }
            // Detach raw JSON evidence from objects the native callback may reuse.
            const event = JSON.parse(json);
            this.events.push(event);
            session.retained++;
            session.bytes += bytes;
            this.error = '';
            return true;
        } catch (e) {
            session.dropped++;
            this.error = 'Cannot record touchscreen event: ' + e.message;
            throw e;
        }
    }

    save(name, value) {
        let fd;
        try {
            this.ensureDirectory();
            const file = path.join(this.dir, name);
            const temporary = file + '.tmp';
            const json = JSON.stringify(value);
            if (json === undefined) throw new Error('Evidence is not JSON serializable');
            // Preserve an interrupted save rather than silently overwriting its evidence.
            fd = fs.openSync(temporary, 'wx');
            fs.writeFileSync(fd, json + '\n', 'utf8');
            fs.fsyncSync(fd);
            fs.closeSync(fd);
            fd = undefined;
            fs.renameSync(temporary, file);
            // Node cannot open directory handles on Windows; the file is still fsynced.
            if (process.platform !== 'win32') {
                fd = fs.openSync(this.dir, 'r');
                fs.fsyncSync(fd);
                fs.closeSync(fd);
                fd = undefined;
            }
            this.error = '';
        } catch (e) {
            this.error = 'Cannot save ' + name + ': ' + e.message + '; in-memory evidence retained; any temporary file left intact';
            throw new Error(this.error);
        } finally {
            if (fd !== undefined) {
                try { fs.closeSync(fd); }
                catch (e) { this.error += '; cannot close evidence file: ' + e.message; }
            }
        }
    }

    finish(summary, reason) {
        try {
            if (!this.active) throw new Error('No touchscreen session is active');
            const savedSummary = cloneJson(summary);
            const savedReason = cloneJson(reason);
            const session = this.active;
            const name = 'touchscreen-session-' + session.id + '.json';
            this.save(name, {
                schema: 1,
                id: session.id,
                startedAt: session.startedAt,
                endedAt: Date.now(),
                reason: savedReason,
                metadata: session.metadata,
                received: session.received,
                retained: session.retained,
                dropped: session.dropped,
                // Sum of compact, UTF-8 serialized event objects; excludes the envelope.
                bytes: session.bytes,
                summary: savedSummary,
                events: this.events
            });
            this.lastFile = name;
            this.lastSummary = savedSummary;
            this.active = null;
            this.events = [];
            this.error = '';
            return name;
        } catch (e) {
            this.error = 'Cannot finish touchscreen session: ' + e.message + '; active evidence preserved';
            throw e;
        }
    }

    snapshot(summary) {
        try {
            const savedSummary = cloneJson(summary);
            this.save(LATEST_FILE, {
                schema: 1,
                capturedAt: Date.now(),
                active: this.active,
                summary: savedSummary,
                lastFile: this.lastFile
            });
            this.lastSummary = savedSummary;
            this.error = '';
            return LATEST_FILE;
        } catch (e) {
            this.error = 'Cannot save touchscreen snapshot: ' + e.message;
            throw e;
        }
    }

    close(summary, reason) {
        return this.active ? this.finish(summary, reason) : this.snapshot(summary);
    }
}

module.exports = { Capture };

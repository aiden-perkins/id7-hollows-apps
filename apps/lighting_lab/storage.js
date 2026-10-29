'use strict';
const fs = require('fs');
const path = require('path');

const LOG_NAME = 'lighting-lab-events.jsonl';
const LOG_LIMIT = 512 * 1024;

class Store {
    constructor(dir) {
        this.dir = dir; this.errors = {}; this.blocked = {}; this.closed = false;
        try { fs.mkdirSync(dir); }
        catch (e) { if (e.code !== 'EEXIST') this.errors.directory = 'Cannot open evidence directory: ' + e.message; }
        [LOG_NAME, LOG_NAME + '.1'].forEach((name) => {
            try {
                const file = this.file(name), size = fs.statSync(file).size;
                if (size > LOG_LIMIT) throw new Error('Existing journal exceeds its bounded size');
                const text = fs.readFileSync(file, 'utf8');
                if (text && text[text.length - 1] !== '\n') throw new Error('Interrupted JSONL record');
                if (text) text.slice(0, -1).split('\n').forEach((line) => { JSON.parse(line); });
            } catch (e) {
                if (e.code !== 'ENOENT') {
                    this.errors[name] = 'Cannot read ' + name + ': ' + e.message + '; original evidence preserved';
                    this.blocked[name] = true;
                }
            }
        });
    }
    file(name) {
        if (typeof name !== 'string' || !name || path.basename(name) !== name) throw new Error('Invalid evidence filename');
        return path.join(this.dir, name);
    }
    load(name, fallback) {
        try {
            const file = this.file(name);
            if (fs.existsSync(file + '.tmp')) {
                this.errors[name] = 'Interrupted save for ' + name + '; original and temporary evidence preserved';
                this.blocked[name] = true;
            }
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
        catch (e) {
            if (e.code !== 'ENOENT') {
                this.errors[name] = 'Cannot read ' + name + ': ' + e.message + '; original evidence preserved';
                this.blocked[name] = true;
            }
            return fallback;
        }
    }
    syncDirectory() {
        // Windows cannot open directory handles through Node. Each evidence file is still fsynced.
        if (process.platform === 'win32') return;
        let fd;
        try { fd = fs.openSync(this.dir, 'r'); fs.fsyncSync(fd); }
        finally { if (fd !== undefined) fs.closeSync(fd); }
    }
    save(name, value) {
        if (this.closed) throw new Error('Evidence storage is closed');
        if (this.blocked[name]) throw new Error(this.errors[name]);
        let fd;
        try {
            const file = this.file(name), temporary = file + '.tmp';
            const json = JSON.stringify(value, null, 2);
            if (json === undefined) throw new Error('Evidence is not JSON serializable');
            // A leftover temporary file may contain evidence from an interrupted save; never overwrite it.
            fd = fs.openSync(temporary, 'wx');
            fs.writeFileSync(fd, json + '\n', 'utf8'); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
            fs.renameSync(temporary, file); this.syncDirectory();
            delete this.errors[name];
            return true;
        } catch (e) {
            this.errors[name] = 'Cannot save ' + name + ': ' + e.message + '; evidence preserved';
            if (e.code === 'EEXIST') this.blocked[name] = true;
            throw new Error(this.errors[name]);
        } finally { if (fd !== undefined) fs.closeSync(fd); }
    }
    append(event) {
        if (this.closed) throw new Error('Evidence storage is closed');
        if (this.blocked[LOG_NAME] || this.blocked[LOG_NAME + '.1']) throw new Error(this.errors[LOG_NAME] || this.errors[LOG_NAME + '.1']);
        let fd;
        try {
            const json = JSON.stringify(event);
            if (json === undefined) throw new Error('Event is not JSON serializable');
            const line = json + '\n', bytes = Buffer.byteLength(line, 'utf8'), file = this.file(LOG_NAME);
            if (bytes > LOG_LIMIT) throw new Error('One evidence event exceeds the bounded journal size');
            let size = 0;
            try { size = fs.statSync(file).size; } catch (e) { if (e.code !== 'ENOENT') throw e; }
            if (size + bytes > LOG_LIMIT) {
                try { fs.unlinkSync(file + '.1'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
                fs.renameSync(file, file + '.1'); this.syncDirectory();
            }
            fd = fs.openSync(file, 'a'); fs.writeFileSync(fd, line, 'utf8'); fs.fsyncSync(fd);
            fs.closeSync(fd); fd = undefined; this.syncDirectory();
            delete this.errors[LOG_NAME];
            return true;
        } catch (e) {
            this.errors[LOG_NAME] = 'Cannot durably journal: ' + e.message;
            this.blocked[LOG_NAME] = true;
            throw new Error(this.errors[LOG_NAME]);
        } finally { if (fd !== undefined) fs.closeSync(fd); }
    }
    close() { this.closed = true; }
}
module.exports = { Store };

'use strict';
const fs = require('fs');
const path = require('path');

class Store {
    constructor(dir) { this.dir = dir; this.error = ''; }
    load(name, fallback) {
        try { return JSON.parse(fs.readFileSync(path.join(this.dir, name), 'utf8')); } catch (e) {
            if (e.code !== 'ENOENT') this.error = 'Read failed: ' + e.message;
            return fallback;
        }
    }
    save(name, value) {
        try {
            const file = path.join(this.dir, name);
            fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 2) + '\n');
            fs.renameSync(file + '.tmp', file);
            this.error = ''; return true;
        } catch (e) { this.error = 'Save failed: ' + e.message; return false; }
    }
}
class EventLog {
    constructor(dir) {
        this.file = path.join(dir, 'mgu_lab-events.jsonl');
        this.enabled = false; this.error = ''; this.buffer = [];
        this.timer = setInterval(() => this.flush(), 1000);
        if (this.timer.unref) this.timer.unref();
    }
    setEnabled(on) { if (!on) this.flush(); this.enabled = !!on; }
    add(ev) {
        if (!this.enabled) return;
        if (this.buffer.length >= 256) this.flush();
        this.buffer.push(JSON.stringify(ev));
    }
    flush() {
        if (!this.buffer.length) return;
        try {
            let size = 0;
            try { size = fs.statSync(this.file).size; } catch (e) { if (e.code !== 'ENOENT') throw e; }
            if (size > 512 * 1024) {
                try { fs.unlinkSync(this.file + '.1'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
                fs.renameSync(this.file, this.file + '.1');
            }
            fs.appendFileSync(this.file, this.buffer.join('\n') + '\n');
            this.error = '';
        } catch (e) { this.error = e.message; this.enabled = false; }
        this.buffer.length = 0;
    }
    close() { clearInterval(this.timer); this.flush(); }
}
module.exports = { Store, EventLog };

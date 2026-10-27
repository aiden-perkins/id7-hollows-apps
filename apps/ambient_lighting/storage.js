'use strict';
const fs = require('fs');
const path = require('path');

class Store {
    constructor(dir) { this.dir = dir; this.errors = {}; this.blocked = {}; }
    load(name, fallback, valid) {
        try {
            const value = JSON.parse(fs.readFileSync(path.join(this.dir, name), 'utf8'));
            if (!value || value.schemaVersion !== 1 || !valid(value)) throw new Error('Unsupported schema or invalid saved data');
            return value;
        } catch (e) {
            if (e.code !== 'ENOENT') {
                this.errors[name] = 'Cannot read ' + name + ': ' + e.message;
                this.blocked[name] = true;
            }
            return fallback;
        }
    }
    save(name, value) {
        if (this.blocked[name]) throw new Error(this.errors[name] + '; original file preserved');
        try {
            const file = path.join(this.dir, name);
            fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 2) + '\n');
            fs.renameSync(file + '.tmp', file);
            delete this.errors[name];
        } catch (e) {
            this.errors[name] = 'Cannot save ' + name + ': ' + e.message;
            throw new Error(this.errors[name]);
        }
    }
}
module.exports = { Store };

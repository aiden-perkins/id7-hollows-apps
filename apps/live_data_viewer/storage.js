'use strict';
const fs = require('fs');
const path = require('path');
class Storage {
    constructor(dir) { this.dir = dir; this.error = ''; this.blocked = false; this.serial = 0; }
    loadSettings() {
        const defaults = { schemaVersion: 1, units: 'US', precision: 3, dateFormat: 'US12',
            order: ['temperatures', 'driving', 'health'], trendSeconds: 180, refreshMs: 1000 };
        try {
            const s = JSON.parse(fs.readFileSync(path.join(this.dir, 'settings.json'), 'utf8'));
            if (!s || s.schemaVersion !== 1 || s.units !== 'US' || s.precision !== 3 || s.dateFormat !== 'US12' ||
                ![60, 180, 600].includes(s.trendSeconds) || ![500, 1000, 2000].includes(s.refreshMs) ||
                !Array.isArray(s.order) || s.order.length !== 3 || new Set(s.order).size !== 3 ||
                !s.order.every((id) => defaults.order.includes(id))) throw new Error('Unsupported schema or invalid preferences');
            return s;
        } catch (e) {
            if (e.code !== 'ENOENT') { this.error = 'Settings preserved: ' + e.message; this.blocked = true; }
            return defaults;
        }
    }
    settings(value) {
        if (this.blocked) throw new Error(this.error);
        const file = path.join(this.dir, 'settings.json');
        try {
            fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 2) + '\n');
            fs.renameSync(file + '.tmp', file); this.error = '';
        } catch (e) { this.error = 'Settings save failed: ' + e.message; throw new Error(this.error); }
    }
    snapshot(value) {
        const directory = path.join(this.dir, 'snapshots');
        if (!fs.existsSync(directory)) fs.mkdirSync(directory);
        const name = 'reading-' + Date.now().toString(36) + '-' + (++this.serial) + '.json';
        fs.writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
        return 'snapshots/' + name;
    }
}
module.exports = { Storage };

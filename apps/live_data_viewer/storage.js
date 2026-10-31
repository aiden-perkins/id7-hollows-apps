'use strict';
const fs = require('fs');
const path = require('path');
class Storage {
    constructor(dir) { this.dir = dir; this.error = ''; this.blocked = false; this.serial = 0; }
    loadSettings() {
        const defaults = { schemaVersion: 1, units: 'US', precision: 3, dateFormat: 'US12',
            order: ['driving', 'dynamics', 'temperatures', 'health'], trendSeconds: 180, refreshMs: 100 };
        try {
            const s = JSON.parse(fs.readFileSync(path.join(this.dir, 'settings.json'), 'utf8'));
            if (!s || s.schemaVersion !== 1 || s.units !== 'US' || s.precision !== 3 || s.dateFormat !== 'US12' ||
                ![60, 180, 600].includes(s.trendSeconds) || ![100, 250, 500, 1000, 2000].includes(s.refreshMs) ||
                !Array.isArray(s.order) || ![3, 4].includes(s.order.length) || new Set(s.order).size !== s.order.length ||
                !s.order.every((id) => defaults.order.includes(id)) ||
                !['driving', 'temperatures', 'health'].every((id) => s.order.includes(id))) throw new Error('Unsupported schema or invalid preferences');
            const order = s.order.slice();
            if (!order.includes('dynamics')) order.splice(order.indexOf('driving') + 1, 0, 'dynamics');
            return Object.assign(defaults, { order, trendSeconds: s.trendSeconds, refreshMs: s.refreshMs });
        } catch (e) {
            if (e.code !== 'ENOENT') { this.error = 'Settings preserved: ' + e.message; this.blocked = true; }
            return defaults;
        }
    }
    settings(value) {
        if (this.blocked) throw new Error(this.error);
        const file = path.join(this.dir, 'settings.json');
        try {
            let saved = {};
            try { saved = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
            fs.writeFileSync(file + '.tmp', JSON.stringify(Object.assign({}, saved, value), null, 2) + '\n');
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

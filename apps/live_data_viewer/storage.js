'use strict';
const fs = require('fs');
const path = require('path');
const pages = ['driving', 'status', 'bm3'];
function currentPage(page) {
    if (page === 'temperatures' || page === 'health') return 'status';
    if (page === 'dynamics') return 'driving';
    return page;
}
class Storage {
    constructor(dir) { this.dir = dir; this.error = ''; this.blocked = false; this.serial = 0; }
    loadSettings() {
        const defaults = { schemaVersion: 1, units: 'US', precision: 3, dateFormat: 'US12',
            order: pages.slice(), trendSeconds: 180, refreshMs: 100,
            boostSource: 'auto', boostSeen: [], bm3Engine: 'unset' };
        try {
            const s = JSON.parse(fs.readFileSync(path.join(this.dir, 'settings.json'), 'utf8'));
            const order = s && Array.isArray(s.order) ? Array.from(new Set(s.order.map(currentPage))) : [];
            if (!s || s.schemaVersion !== 1 || s.units !== 'US' || s.precision !== 3 || s.dateFormat !== 'US12' ||
                ![60, 180, 600].includes(s.trendSeconds) || ![100, 250, 500, 1000, 2000].includes(s.refreshMs) ||
                !order.every((id) => pages.includes(id)) || !order.includes('driving') || !order.includes('status'))
                throw new Error('Unsupported schema or invalid preferences');
            if (!order.includes('bm3')) order.push('bm3');
            return Object.assign(defaults, { order, trendSeconds: s.trendSeconds, refreshMs: s.refreshMs,
                boostSource: ['auto', 'fes', 'dme'].includes(s.boostSource) ? s.boostSource : 'auto',
                bm3Engine: typeof s.bm3Engine === 'string' && /^[A-Za-z0-9-]{1,24}$/.test(s.bm3Engine) ? s.bm3Engine : 'unset',
                boostSeen: Array.isArray(s.boostSeen) ? s.boostSeen.filter((id) => ['boostFes', 'boostDme'].includes(id)) : [] });
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
module.exports = { Storage, currentPage };

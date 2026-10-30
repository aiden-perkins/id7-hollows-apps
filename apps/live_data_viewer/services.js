'use strict';
const D = require('./definitions');
const { DiagnosticServices } = require('./diagnostic');
function deadline(promise, ms, label) {
    let timer;
    return Promise.race([Promise.resolve(promise), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).then((v) => { clearTimeout(timer); return v; }, (e) => { clearTimeout(timer); throw e; });
}
class Services {
    constructor(ctx, model) {
        this.ctx = ctx; this.model = model; this.signals = ctx.signals;
        this.connections = {}; this.closed = false; this.ids = [];
        this.diagnostic = new DiagnosticServices(ctx, model);
        this.timer = setInterval(() => {
            Object.keys(this.connections).forEach((key) => {
                const c = this.connections[key];
                if (c.available && !c.fetching && Date.now() >= c.nextPoll) this.fetch(c);
            });
        }, 25);
        if (this.timer.unref) this.timer.unref();
    }
    alive(c) { return !this.closed && !c.closed && this.connections[c.key] === c; }
    dispose(c) {
        c.closed = true; clearTimeout(c.waitTimer);
        if (c.proxy && c.proxy.shutdown) Promise.resolve().then(() => c.proxy.shutdown()).catch((e) => this.ctx.log.warn(e));
    }
    activate(ids, force) {
        if (this.closed) return;
        this.ids = ids.slice(); this.model.activate(ids);
        const wanted = {};
        const active = D.definitions.filter((d) => ids.includes(d.id));
        this.diagnostic.activate(active.filter((d) => d.diag));
        active.filter((d) => d.source && !d.diag).forEach((d) => {
            const key = D.sourceKey(d);
            if (!wanted[key]) wanted[key] = { key, iface: D.IF[d.source], instance: d.instance || '1', fields: {} };
            wanted[key].fields[d.field] = { read: !!d.read, staleMs: d.staleMs };
        });
        Object.keys(this.connections).forEach((key) => {
            const c = this.connections[key], next = wanted[key];
            if (force || !next || JSON.stringify(next.fields) !== JSON.stringify(c.def.fields)) {
                this.dispose(c); delete this.connections[key];
            }
        });
        Object.keys(wanted).forEach((key) => { if (!this.connections[key]) this.open(wanted[key]); });
    }
    async open(def) {
        const c = { key: def.key, def, proxy: null, closed: false, available: false,
            reads: {}, notifiedAt: {}, fetching: false, nextPoll: 0, epoch: 0, waitTimer: null };
        this.connections[c.key] = c;
        this.model.transport(c.key, null, 'waiting', 'Connecting to vehicle provider');
        if (!this.signals.hasNative()) {
            this.model.transport(c.key, null, 'unavailable', this.ctx.preview ? 'Preview has no live vehicle feed' : 'SOME/IP native module unavailable');
            return;
        }
        try {
            const opening = this.signals.proxy(def.iface, def.instance);
            opening.then((p) => { if (!this.alive(c)) this.dispose({ proxy: p }); }).catch(() => {});
            c.proxy = await deadline(opening, 5000, 'Connect');
            if (!this.alive(c)) return;
            await deadline(this.signals.onAvailable(c.proxy, (available) => {
                if (!this.alive(c)) return;
                if (available !== c.available) { c.epoch++; c.notifiedAt = {}; }
                c.available = available;
                this.model.transport(c.key, null, available ? 'waiting' : 'unavailable',
                    available ? 'Provider connected; waiting for field data' : 'Vehicle provider unavailable');
                if (available) { clearTimeout(c.waitTimer); this.fetch(c); }
            }), 2000, 'Availability subscription');
            if (!c.available) c.waitTimer = setTimeout(() => {
                if (this.alive(c) && !c.available) this.model.transport(c.key, null, 'unavailable', 'No provider announcement received');
            }, 5000);
            for (const field of Object.keys(def.fields)) {
                if (!this.alive(c)) return;
                try {
                    await deadline(this.signals.on(c.proxy, field, (raw) => {
                        if (this.alive(c) && c.available) {
                            c.notifiedAt[field] = Date.now();
                            this.model.receive(c.key, field, raw, 'notification');
                        }
                    }, this.ctx.log), 2000, field + ' subscription');
                } catch (e) { if (this.alive(c)) this.model.transport(c.key, field, 'error', 'Subscription: ' + e.message); }
            }
        } catch (e) {
            if (!this.alive(c)) return;
            this.model.transport(c.key, null, 'error', e.message); this.dispose(c);
        }
    }
    async read(c, field) {
        if (!this.alive(c) || !c.available || !c.proxy) throw new Error('Provider unavailable');
        if (c.reads[field]) return c.reads[field];
        const epoch = c.epoch;
        c.reads[field] = (async () => {
            try {
                const raw = await deadline(this.signals.get(c.proxy, field, 1200), 1800, 'Read ' + field);
                if (!this.alive(c) || !c.available || c.epoch !== epoch) throw new Error('Connection changed during read');
                this.model.receive(c.key, field, raw, 'getter');
                return raw;
            } catch (e) {
                if (this.alive(c)) this.model.transport(c.key, field, 'error', e.message);
                throw e;
            }
        })();
        try { return await c.reads[field]; } finally { delete c.reads[field]; }
    }
    async fetch(c) {
        if (!this.alive(c) || !c.available || c.fetching) return;
        c.fetching = true;
        let failed = false;
        try {
            for (const field of Object.keys(c.def.fields)) {
                if (!this.alive(c) || !c.available) break;
                const pollMs = /\.TPMS/.test(c.def.iface) ? 5000 : Math.max(100, this.model.settings.refreshMs);
                if (c.def.fields[field].read && (!c.notifiedAt[field] || Date.now() - c.notifiedAt[field] >= pollMs)) {
                    try { await this.read(c, field); } catch (e) { failed = true; }
                }
            }
        } finally {
            c.fetching = false;
            const tpms = /\.TPMS/.test(c.def.iface);
            c.nextPoll = Date.now() + (failed ? 5000 : tpms ? 5000 : this.model.settings.refreshMs);
        }
    }
    async snapshot(d) {
        const c = this.connections[D.sourceKey(d)];
        if (d.source && d.read && c && this.alive(c) && c.available) {
            // Save error/stale quality too if a requested refresh fails.
            try { await this.read(c, d.field); } catch (e) { this.ctx.log.warn('Snapshot refresh: ' + e.message); }
        }
        return this.model.snapshot(d);
    }
    close() {
        this.closed = true; clearInterval(this.timer);
        this.diagnostic.close();
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
        this.connections = {};
    }
}
module.exports = { Services };

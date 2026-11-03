'use strict';
const D = require('./definitions');
const { DiagnosticServices } = require('./diagnostic');
const dynamicsFast = new Set([
    'frontAxle', 'rearAxle', 'brakePressure', 'accelerator', 'kickdown',
    'wheelSpeedFLH', 'wheelSpeedFRH', 'wheelSpeedRLH', 'wheelSpeedRRH',
    'swayFrontMotorActual', 'swayRearMotorActual', 'rearTorqueShare',
    'rpm', 'torque', 'gLat', 'gLong', 'horsepower', 'frontPower', 'rearPower', 'gForce',
]);
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
                if (c.available) this.fetch(c);
            });
        }, 25);
        if (this.timer.unref) this.timer.unref();
    }
    alive(c) { return !this.closed && !c.closed && this.connections[c.key] === c; }
    dispose(c) {
        c.closed = true; clearTimeout(c.waitTimer);
        if (c.proxy && c.proxy.shutdown) Promise.resolve().then(() => c.proxy.shutdown()).catch((e) => this.ctx.log.warn(e));
    }
    activate(ids, force, page) {
        if (this.closed) return;
        const expanded = new Set(ids), include = (id) => {
            const d = D.definitions.find((entry) => entry.id === id);
            if (d && d.dependsOn) d.dependsOn.forEach((input) => {
                if (!expanded.has(input)) { expanded.add(input); include(input); }
            });
        };
        ids.forEach(include);
        this.ids = Array.from(expanded); this.model.activate(this.ids);
        const wanted = {};
        const active = D.definitions.filter((d) => expanded.has(d.id)).map((d) => {
            if (page !== 'dynamics') return d;
            if (dynamicsFast.has(d.id)) return Object.assign({}, d, { pollMs: 100, focusedFast: true });
            if (d.id === 'parkingBrake') return Object.assign({}, d, { pollMs: 1000 });
            if (/\.TPMS/.test(D.IF[d.source]) || d.field === 'statusNewCurrentUnitsStatusExt') {
                return Object.assign({}, d, { pollMs: Math.max(5000, d.pollMs || 0) });
            }
            return d;
        });
        this.diagnostic.activate(active.filter((d) => d.diag));
        active.filter((d) => d.source && !d.diag).forEach((d) => {
            const key = D.sourceKey(d);
            if (!wanted[key]) wanted[key] = { key, iface: D.IF[d.source], instance: d.instance || '1', fields: {} };
            const fields = wanted[key].fields, field = fields[d.field];
            if (!field) {
                fields[d.field] = { read: !!d.read, staleMs: d.staleMs, pollMs: d.pollMs || null,
                    defaultPoll: !d.pollMs, focusedFast: !!d.focusedFast };
            } else {
                field.read = field.read || !!d.read;
                field.staleMs = Math.min(field.staleMs, d.staleMs);
                if (d.pollMs) field.pollMs = Math.min(field.pollMs || Infinity, d.pollMs);
                field.defaultPoll = field.defaultPoll || !d.pollMs;
                field.focusedFast = field.focusedFast || !!d.focusedFast;
            }
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
        const c = { key: def.key, def, fields: Object.keys(def.fields), proxy: null, closed: false, available: false,
            reads: {}, notifiedAt: {}, notificationVersions: {}, nextPoll: {}, subscriptionsReady: false,
            epoch: 0, waitTimer: null };
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
                if (available !== c.available) {
                    c.epoch++; c.notifiedAt = {}; c.notificationVersions = {}; c.nextPoll = {};
                }
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
                            c.notificationVersions[field] = (c.notificationVersions[field] || 0) + 1;
                            this.model.receive(c.key, field, raw, 'notification');
                        }
                    }, this.ctx.log), 2000, field + ' subscription');
                } catch (e) { if (this.alive(c)) this.model.transport(c.key, field, 'error', 'Subscription: ' + e.message); }
            }
            c.subscriptionsReady = true;
            if (this.alive(c) && c.available) this.fetch(c);
        } catch (e) {
            if (!this.alive(c)) return;
            this.model.transport(c.key, null, 'error', e.message); this.dispose(c);
        }
    }
    pollMs(c, field) {
        const def = c.def.fields[field];
        const cadence = Math.min(def.pollMs || Infinity,
            def.defaultPoll ? Math.max(100, this.model.settings.refreshMs) : Infinity);
        return /\.TPMS/.test(c.def.iface) || field === 'statusNewCurrentUnitsStatusExt'
            ? Math.max(5000, cadence) : cadence;
    }
    async read(c, field) {
        if (!this.alive(c) || !c.available || !c.proxy) throw new Error('Provider unavailable');
        if (!c.def.fields[field] || !c.def.fields[field].read) throw new Error('Field has no supported getter');
        if (c.reads[field]) return c.reads[field].promise;
        const epoch = c.epoch, notificationVersion = c.notificationVersions[field] || 0;
        const op = { promise: null, expiresAt: Date.now() + 1800, expired: false };
        c.reads[field] = op;
        const now = Date.now(), period = this.pollMs(c, field), due = c.nextPoll[field] || now;
        // Preserve the fast cadence phase instead of adding a timer-quantum delay
        // each time a queued native call starts. Missed periods do not build a backlog.
        c.nextPoll[field] = due + (Math.floor(Math.max(0, now - due) / period) + 1) * period;
        // The kit may queue native calls. Recheck at dispatch, not just at enqueue,
        // so a paused/changed connection cannot send a delayed getter.
        const guarded = { getValue: (name, timeout) => {
            if (!this.alive(c) || !c.available || c.epoch !== epoch || op.expired || Date.now() >= op.expiresAt) {
                throw new Error('Connection changed or read expired before dispatch');
            }
            if (!c.def.fields[field].focusedFast) c.nextPoll[field] = Date.now() + this.pollMs(c, field);
            return c.proxy.getValue(name, Math.min(timeout, Math.max(1, op.expiresAt - Date.now())));
        } };
        const request = Promise.resolve().then(() => this.signals.get(guarded, field, 1200));
        // A local deadline does not prove the underlying native call settled.
        // Keep this field locked until it does, without holding other fields.
        const settled = request.then((raw) => {
            if (c.reads[field] === op) delete c.reads[field];
            return raw;
        }, (error) => {
            if (c.reads[field] === op) delete c.reads[field];
            throw error;
        });
        op.promise = deadline(settled, 1800, 'Read ' + field).then((raw) => {
            if (!this.alive(c) || !c.available || c.epoch !== epoch) throw new Error('Connection changed during read');
            if ((c.notificationVersions[field] || 0) === notificationVersion) {
                this.model.receive(c.key, field, raw, 'getter');
            }
            return raw;
        }).catch((error) => {
            if (this.alive(c) && c.available && c.epoch === epoch) {
                c.nextPoll[field] = Math.max(c.nextPoll[field] || 0, Date.now() + 5000);
                if ((c.notificationVersions[field] || 0) === notificationVersion) {
                    this.model.transport(c.key, field, 'error', error.message);
                }
            }
            throw error;
        }).then((raw) => { op.expired = true; return raw; }, (error) => { op.expired = true; throw error; });
        return op.promise;
    }
    fetch(c) {
        if (!this.alive(c) || !c.available || !c.subscriptionsReady) return;
        const now = Date.now();
        c.fields.forEach((field) => {
            if (!c.def.fields[field].read || c.reads[field] || now < (c.nextPoll[field] || 0)) return;
            const pollMs = this.pollMs(c, field);
            if (c.notifiedAt[field] !== undefined && now - c.notifiedAt[field] < pollMs) return;
            this.read(c, field).catch(() => {});
        });
    }
    async snapshot(d) {
        const c = this.connections[D.sourceKey(d)];
        if (d.source && d.read && c && this.alive(c) && c.available) {
            // Save error/stale quality too if a requested refresh fails.
            try { await this.read(c, d.field); } catch (e) { this.ctx.log.warn('Snapshot refresh: ' + e.message); }
        }
        return this.model.snapshot(d);
    }
    async setExhaust(mode) {
        if (this.closed) throw new Error('Vehicle services closed');
        return this.diagnostic.setExhaust(mode);
    }
    close() {
        this.closed = true; clearInterval(this.timer);
        this.diagnostic.close();
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
        this.connections = {};
    }
}
module.exports = { Services };

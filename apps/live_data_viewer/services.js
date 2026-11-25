'use strict';
const D = require('./definitions');
const { DiagnosticServices } = require('./diagnostic');
const drivingFast = new Set([
    'frontAxle', 'rearAxle', 'brakePressure', 'accelerator', 'kickdown',
    'swayFrontMotorActual', 'swayRearMotorActual', 'rearTorqueShare',
    'rpm', 'torque', 'gLat', 'gLong', 'horsepower', 'frontPower', 'rearPower', 'gForce',
]);
const statusFast = new Set([
    'statusBoostActualAbsolute', 'statusBoostTargetAbsolute', 'statusFuelHighActualAbsolute',
    'fuelHighTargetAbsolute', 'oilPressureAbsolute',
]);
const notificationFeeds = new WeakMap();
function expand(ids) {
    const expanded = new Set(ids);
    for (const id of expanded) {
        const d = D.definitions.find((entry) => entry.id === id);
        if (d && d.dependsOn) d.dependsOn.forEach((input) => expanded.add(input));
    }
    return expanded;
}
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
                if (c.closed && Date.now() >= c.retryAt) this.open(c.def);
                else if (c.available) this.fetch(c);
            });
        }, 25);
        if (this.timer.unref) this.timer.unref();
    }
    alive(c) { return !this.closed && !c.closed && this.connections[c.key] === c; }
    dispose(c) {
        if (c.closed) return;
        c.closed = true; clearTimeout(c.waitTimer);
        if (c.detach) c.detach();
        if (c.proxy && c.proxy.shutdown) Promise.resolve().then(() => c.proxy.shutdown()).catch((e) => this.ctx.log.warn(e));
    }
    async watchNotifications(c) {
        const { key, iface, instance } = c.def;
        let feeds = notificationFeeds.get(this.signals);
        if (!feeds) {
            feeds = new Map();
            notificationFeeds.set(this.signals, feeds);
        }
        let feed = feeds.get(key);
        if (!feed) {
            const listeners = new Set(), handlers = {};
            D.definitions.filter((d) => !d.diag && D.sourceKey(d) === key).forEach(({ field }) => {
                handlers[field] = (raw) => listeners.forEach((receive) => receive(field, raw));
            });
            // The emulator keeps watch handlers for the session. Reuse the watch across tab and demo changes.
            feed = { listeners, ready: Promise.resolve().then(() => this.signals.watch(iface, instance, handlers, this.ctx.log)) };
            feeds.set(key, feed);
        }
        const receive = (field, raw) => {
            if (this.alive(c) && c.def.fields[field]) this.model.receive(key, field, raw, 'notification');
        };
        feed.listeners.add(receive);
        c.detach = () => feed.listeners.delete(receive);
        try {
            const watch = await deadline(feed.ready, 5000, 'Vehicle notification subscription');
            if (watch.error) throw new Error(watch.error);
        } catch (error) {
            if (this.alive(c)) {
                this.dispose(c);
                this.model.transport(key, null, 'unavailable', error.message);
            }
        }
    }
    activate(ids, force, page, statusIds = []) {
        if (this.closed) return;
        const status = expand(statusIds);
        const expanded = expand(ids);
        status.forEach((id) => expanded.add(id));
        this.ids = Array.from(expanded); this.model.activate(this.ids);
        const wanted = {};
        const active = D.definitions.filter((d) => expanded.has(d.id)).map((d) => {
            if (status.has(d.id)) return Object.assign({}, d, { pollMs: statusFast.has(d.id) ? 500 : 1000, statusPoll: true });
            if (page !== 'driving') return d;
            if (drivingFast.has(d.id)) return Object.assign({}, d, { pollMs: 100, focusedFast: true });
            if (d.id === 'parkingBrake') return Object.assign({}, d, { pollMs: 1000 });
            if (/\.TPMS/.test(D.IF[d.source]) || d.field === 'statusNewCurrentUnitsStatusExt') {
                return Object.assign({}, d, { pollMs: Math.max(5000, d.pollMs || 0) });
            }
            return d;
        });
        this.diagnostic.activate(active.filter((d) => d.diag), page);
        active.filter((d) => d.source && !d.diag).forEach((d) => {
            const key = D.sourceKey(d);
            if (!wanted[key]) wanted[key] = { key, iface: D.IF[d.source], instance: d.instance || '1', fields: {} };
            const fields = wanted[key].fields, field = fields[d.field], pollMs = d.pollMs || 100;
            if (!field) {
                fields[d.field] = { read: !!d.read, pollMs, focusedFast: !!d.focusedFast };
            } else {
                field.read = field.read || !!d.read;
                field.pollMs = Math.min(field.pollMs, pollMs);
                field.focusedFast = field.focusedFast || !!d.focusedFast;
            }
        });
        Object.keys(this.connections).forEach((key) => {
            const c = this.connections[key], next = wanted[key];
            if (force || !next) {
                this.dispose(c); delete this.connections[key];
            } else {
                // CDS and FES also serve Driving. Keep shared fields and in-flight
                // getters alive when adding or removing Driving's other fields.
                Object.keys(c.def.fields).forEach((field) => {
                    const previous = c.def.fields[field], current = next.fields[field];
                    if (current && previous.read === current.read && previous.pollMs === current.pollMs &&
                        previous.focusedFast === current.focusedFast) next.fields[field] = previous;
                    else delete c.nextPoll[field];
                });
                c.def.fields = next.fields;
                if (c.ready) this.subscribe(c);
            }
        });
        Object.keys(wanted).forEach((key) => { if (!this.connections[key]) this.open(wanted[key]); });
    }
    async open(def) {
        const c = { key: def.key, def, proxy: null, closed: false, available: false, ready: false,
            reads: {}, notifiedAt: {}, notificationVersions: {}, nextPoll: {}, subscribed: new Set(),
            epoch: 0, waitTimer: null };
        this.connections[c.key] = c;
        this.model.transport(c.key, null, 'waiting', 'Connecting to vehicle provider');
        if (!this.signals.hasNative()) {
            if (!this.ctx.preview && typeof this.signals.watch === 'function') return this.watchNotifications(c);
            this.model.transport(c.key, null, 'unavailable', this.ctx.preview ? 'Preview has no live vehicle feed' : 'SOME/IP native module unavailable');
            return;
        }
        try {
            const opening = this.signals.proxy(def.iface, def.instance);
            opening.then((p) => { if (!this.alive(c)) this.dispose({ proxy: p }); }).catch(() => {});
            c.proxy = await deadline(opening, 5000, 'Connect');
            if (!this.alive(c)) return;
            await deadline(this.signals.onAvailable(c.proxy, (available) => {
                if (!this.alive(c) || available === c.available) return;
                c.epoch++; c.notifiedAt = {}; c.notificationVersions = {}; c.nextPoll = {};
                c.available = available;
                this.model.transport(c.key, null, available ? 'waiting' : 'unavailable',
                    available ? 'Provider connected; waiting for field data' : 'Vehicle provider unavailable');
                if (available) { clearTimeout(c.waitTimer); this.fetch(c); }
            }), 2000, 'Availability subscription');
            if (!this.alive(c)) return;
            if (!c.available) c.waitTimer = setTimeout(() => {
                if (this.alive(c) && !c.available) this.model.transport(c.key, null, 'unavailable', 'No provider announcement received');
            }, 5000);
            c.ready = true;
            await this.subscribe(c);
        } catch (e) {
            if (!this.alive(c)) return;
            this.model.transport(c.key, null, 'error', e.message);
            c.retryAt = Date.now() + 5000; this.dispose(c);
        }
    }
    async subscribe(c) {
        if (c.subscribing) return;
        c.subscribing = true;
        while (this.alive(c)) {
            const field = Object.keys(c.def.fields).find((name) => !c.subscribed.has(name));
            if (!field) break;
            try {
                await deadline(this.signals.on(c.proxy, field, (raw) => {
                    if (this.alive(c) && c.available && c.def.fields[field]) {
                        c.notifiedAt[field] = Date.now();
                        c.notificationVersions[field] = (c.notificationVersions[field] || 0) + 1;
                        this.model.receive(c.key, field, raw, 'notification');
                    }
                }, this.ctx.log), 2000, field + ' subscription');
            } catch (e) {
                if (this.alive(c)) this.model.transport(c.key, field, 'error', 'Subscription: ' + e.message);
            }
            c.subscribed.add(field);
        }
        c.subscribing = false;
        this.fetch(c);
    }
    pollMs(c, field) {
        const cadence = c.def.fields[field].pollMs;
        return /\.TPMS/.test(c.def.iface) || field === 'statusNewCurrentUnitsStatusExt'
            ? Math.max(5000, cadence) : cadence;
    }
    async read(c, field) {
        if (!this.alive(c) || !c.available || !c.proxy) throw new Error('Provider unavailable');
        const options = c.def.fields[field];
        if (!options || !options.read) throw new Error('Field has no supported getter');
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
        const current = () => this.alive(c) && c.available && c.epoch === epoch && c.def.fields[field] === options;
        const guarded = { getValue: (name, timeout) => {
            if (!current() || op.expired || Date.now() >= op.expiresAt) {
                throw new Error('Connection changed or read expired before dispatch');
            }
            if (!options.focusedFast) c.nextPoll[field] = Date.now() + this.pollMs(c, field);
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
            if (!current()) throw new Error('Connection changed during read');
            if ((c.notificationVersions[field] || 0) === notificationVersion) {
                this.model.receive(c.key, field, raw, 'getter');
            }
            return raw;
        }).catch((error) => {
            if (current()) {
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
        if (!this.alive(c) || !c.available || !c.ready) return;
        const now = Date.now();
        Object.keys(c.def.fields).forEach((field) => {
            if (!c.subscribed.has(field) || !c.def.fields[field].read || c.reads[field] || now < (c.nextPoll[field] || 0)) return;
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

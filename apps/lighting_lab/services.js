'use strict';
const D = require('./domain');

function deadline(promise, ms, label) {
    let timer;
    return Promise.race([Promise.resolve(promise), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out; outcome may be unknown')), ms);
    })]).then((value) => { clearTimeout(timer); return value; }, (error) => { clearTimeout(timer); throw error; });
}
function message(error) { return error && error.message ? error.message : String(error); }

class Services {
    constructor(ctx, lab) {
        this.ctx = ctx; this.lab = lab; this.signals = ctx.signals;
        this.connections = {}; this.closed = false; this.serial = 0; this.starting = null; this.refreshing = null;
        this.timer = setInterval(() => {
            if (this.closed) return;
            Object.keys(this.connections).forEach((key) => {
                const c = this.connections[key];
                if (this.alive(c) && c.available === true && !c.fetching && Date.now() - c.fetchedAt >= (c.def.pollMs || 2000)) {
                    this.fetch(c).catch(() => {});
                }
            });
        }, 500);
        if (this.timer.unref) this.timer.unref();
    }
    alive(c) { return !!c && !this.closed && !c.closed && this.connections[c.def.key] === c; }
    epoch(key) {
        const c = this.connections[key];
        return this.alive(c) ? c.serial + ':' + c.epoch : null;
    }
    available(key) {
        const c = this.connections[key];
        return this.alive(c) && c.proxy && c.available === true;
    }
    state(c, available, detail) {
        if (!this.alive(c)) return;
        if (c.available !== available) c.epoch++;
        c.available = available;
        this.lab.connection(c.def.key, available, detail);
    }
    async start() {
        if (this.closed) throw new Error('Lighting services are closed');
        if (this.starting) return this.starting;
        this.starting = (async () => {
            const failures = [];
            await Promise.all(D.SERVICES.map((def) => this.open(def).catch((e) => failures.push(def.label + ': ' + message(e)))));
            if (failures.length) throw new Error(failures.join(' | '));
        })();
        try { return await this.starting; } finally { this.starting = null; }
    }
    async open(def) {
        const previous = this.connections[def.key];
        if (this.alive(previous)) return previous;
        const c = { def, serial: ++this.serial, epoch: 0, available: null, closed: false,
            proxy: null, fetching: false, fetchedAt: 0, queue: Promise.resolve(), sending: false };
        this.connections[def.key] = c;
        this.state(c, null, 'Connecting; provider availability is unknown');
        if (this.ctx.preview || !this.signals || (this.signals.hasNative && !this.signals.hasNative())) {
            this.state(c, false, this.ctx.preview ? 'Preview: no vehicle connection' : 'SOME/IP module unavailable');
            return c;
        }
        try {
            const opening = Promise.resolve(this.signals.proxy(def.iface, def.instance || '1'));
            opening.then((proxy) => { if (!this.alive(c)) this.shutdown(proxy); }, () => {});
            c.proxy = await deadline(opening, 5000, def.label + ' connection');
            if (!this.alive(c)) throw new Error('Connection closed while opening');
            await deadline(this.signals.onAvailable(c.proxy, (offered) => {
                if (!this.alive(c)) return;
                const available = offered === true ? true : offered === false ? false : null;
                this.state(c, available, available === true ? 'Provider offered' : available === false ? 'Provider unavailable' : 'Provider availability is unknown');
                if (available === true && !c.fetching) this.fetch(c).catch(() => {});
            }), 2000, def.label + ' availability subscription');
            for (const field of (def.fields || []).concat(def.events || [])) {
                if (!this.alive(c)) throw new Error('Connection closed while subscribing');
                try {
                    await deadline(this.signals.on(c.proxy, field, (raw) => {
                        if (this.alive(c) && c.available === true) {
                            this.lab.receive(def.key, field, raw, (def.events || []).indexOf(field) >= 0 ? 'event' : 'notification');
                        }
                    }, this.ctx.log), 2000, def.label + '.' + field + ' subscription');
                    if (this.alive(c)) this.lab.subscriptionReady(def.key, field);
                } catch (e) { this.lab.readError(def.key, field, 'Subscription: ' + message(e)); }
            }
            return c;
        } catch (e) {
            if (this.alive(c)) this.state(c, false, 'Connection error: ' + message(e));
            c.closed = true; c.epoch++; this.shutdown(c.proxy);
            throw new Error(def.label + ': ' + message(e));
        }
    }
    async read(service, field) {
        const c = this.connections[service];
        if (!this.alive(c) || !c.proxy || c.available !== true) throw new Error(service + ': provider is not offered');
        if ((c.def.fields || []).indexOf(field) < 0) throw new Error(service + '.' + field + ': not a catalog getter');
        // Serialize actual getters per provider; a queued request still starts a new getter, never a cached notification.
        const task = c.queue.then(async () => {
            if (!this.alive(c) || c.available !== true) throw new Error(service + ': provider changed before getter');
            const epoch = c.epoch;
            try {
                const raw = await deadline(this.signals.get(c.proxy, field, 1200), 1800, service + '.' + field + ' getter');
                if (!this.alive(c) || c.available !== true || epoch !== c.epoch) throw new Error(service + ': provider changed during getter');
                this.lab.receive(service, field, raw, 'getter');
                return raw;
            } catch (e) {
                if (this.alive(c)) this.lab.readError(service, field, 'Getter: ' + message(e));
                throw new Error(service + '.' + field + ': ' + message(e));
            }
        });
        c.queue = task.catch(() => {});
        return task;
    }
    async fetch(c) {
        if (!this.alive(c) || c.available !== true || c.fetching) return;
        c.fetching = true; c.fetchedAt = Date.now();
        const failures = [];
        try {
            for (const field of c.def.fields || []) {
                if (!this.alive(c) || c.available !== true) break;
                try { await this.read(c.def.key, field); }
                catch (e) { failures.push(message(e)); }
            }
        } finally { c.fetching = false; }
        if (failures.length) throw new Error(failures.join(' | '));
    }
    async refresh() {
        if (this.closed) throw new Error('Lighting services are closed');
        if (this.refreshing) return this.refreshing;
        this.refreshing = (async () => {
            const failures = [];
            for (const def of D.SERVICES) {
                const c = this.connections[def.key];
                if (!this.alive(c) || c.available !== true) continue;
                for (const field of def.fields || []) {
                    if (!this.alive(c) || c.available !== true) break;
                    try { await this.read(def.key, field); } catch (e) { failures.push(message(e)); }
                }
            }
            if (failures.length) throw new Error('Some offered getters failed: ' + failures.join(' | '));
        })();
        try { return await this.refreshing; } finally { this.refreshing = null; }
    }
    async send(request) {
        if (!request || !request.service) throw new Error('Missing lighting command');
        const c = this.connections[request.service];
        if (!this.alive(c) || !c.proxy || c.available !== true) throw new Error(request.service + ': provider is not offered');
        if (c.sending) throw new Error('An earlier command is still unresolved in the transport');
        // Check before enqueue, then recheck inside the SDK's queued nativeTick before touching the real proxy.
        if (!this.lab.dispatchGuard) throw new Error('Stationary dispatch guard is unavailable');
        this.lab.dispatchGuard(request);
        const epoch = c.epoch;
        let operation, invoked = false;
        const invoke = (method, args) => {
            if (invoked || !this.alive(c) || c.available !== true || c.epoch !== epoch) throw new Error('Queued lighting dispatch cancelled: provider changed or request already invoked');
            this.lab.dispatchGuard(request, true);
            invoked = true;
            return c.proxy[method].apply(c.proxy, args);
        };
        const guarded = {
            setValue: (...args) => invoke('setValue', args),
            callMethod: (...args) => invoke('callMethod', args),
        };
        c.sending = true;
        try {
            operation = Promise.resolve(request.method
                ? this.signals.call(guarded, request.method, request.params || {}, 2000)
                : this.signals.set(guarded, request.field, request.value, 2000));
        } catch (e) { c.sending = false; throw new Error('Dispatch failed; outcome uncertain: ' + message(e)); }
        operation.then(() => { c.sending = false; }, () => { c.sending = false; });
        const reply = await deadline(operation, 2800, request.service + ' command');
        if (!this.alive(c) || c.available !== true || epoch !== c.epoch) throw new Error('Provider changed after dispatch; outcome unknown');
        return reply;
    }
    async retry() {
        if (this.closed) throw new Error('Lighting services are closed');
        if (this.starting) throw new Error('Services are still starting; wait for initialization before reconnecting');
        if (this.lab.trial || this.lab.busy) throw new Error('Reconnect is blocked while a trial is unresolved or an action is running');
        this.lab.disarm('Reconnect requested');
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
        this.connections = {};
        return this.start();
    }
    shutdown(proxy) {
        if (!proxy || !proxy.shutdown) return;
        try { Promise.resolve(proxy.shutdown()).catch(() => {}); } catch (e) { /* No vehicle writes during teardown. */ }
    }
    dispose(c) {
        if (!c) return;
        c.epoch++; c.closed = true; this.shutdown(c.proxy);
    }
    close() {
        if (this.closed) return;
        this.closed = true; clearInterval(this.timer);
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
    }
}
module.exports = { Services };

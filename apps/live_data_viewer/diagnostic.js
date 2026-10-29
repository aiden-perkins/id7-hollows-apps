'use strict';
const D = require('./definitions');
const { Diag, NRC, hex } = require('./kit/diag');

const REQUEST_MS = 5000;
function deadline(promise, ms, label) {
    let timer;
    return Promise.race([Promise.resolve(promise), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).then((value) => { clearTimeout(timer); return value; }, (error) => { clearTimeout(timer); throw error; });
}
function byte(value) { return Number.isInteger(value) && value >= 0 && value <= 255; }
function configuration(d) {
    const c = d.diag;
    if (!c || typeof c !== 'object' || !byte(c.target) || c.target === 0xDF || c.target === 0xF2 ||
        c.sid !== 0x22 || !Number.isInteger(c.did) || c.did < 0 || c.did > 65535 ||
        !Number.isSafeInteger(c.at) || c.at < 0 || !Number.isInteger(c.bytes) || c.bytes < 1 || c.bytes > 6 ||
        (c.signed !== undefined && typeof c.signed !== 'boolean') ||
        (c.minBytes !== undefined && (!Number.isSafeInteger(c.minBytes) || c.minBytes < 0)) ||
        (c.validAt !== undefined && (!Number.isSafeInteger(c.validAt) || c.validAt < 0 ||
            !Array.isArray(c.validValues) || !c.validValues.length || !c.validValues.every(byte)))) {
        throw new Error('Invalid physical read-only diagnostic configuration');
    }
    return Object.assign({}, c, { validValues: c.validValues && c.validValues.slice() });
}

class DiagnosticServices {
    constructor(ctx, model) {
        this.ctx = ctx; this.model = model; this.signals = ctx.signals;
        this.closed = false; this.generation = 0; this.signature = ''; this.groups = [];
        this.link = null; this.pending = null; this.timer = null;
    }
    activate(definitions) {
        if (this.closed) return;
        const active = definitions.filter((d) => d.diag);
        const signature = JSON.stringify(active.map((d) => [d.id, D.sourceKey(d), d.field, d.diag]));
        if (signature === this.signature) return;
        this.signature = signature; this.generation++;
        clearTimeout(this.timer); this.timer = null;
        const groups = new Map();
        active.forEach((d) => {
            try {
                const c = configuration(d), key = [c.target, c.sid, c.did].join(':');
                if (!groups.has(key)) groups.set(key, { target: c.target, sid: c.sid,
                    params: [c.did >> 8, c.did & 255], entries: [], nextAt: 0 });
                groups.get(key).entries.push({ d, config: c });
            } catch (error) { this.model.transport(D.sourceKey(d), d.field, 'error', error.message); }
        });
        this.groups = Array.from(groups.values());
        // A previous generation keeps its request slot until the reply/deadline is drained.
        // Its result cannot become a sample for the newly selected definitions.
        if (this.link && this.link.failed) { this._dispose(this.link); this.link = null; }
        this._wake();
    }
    _status(group, state, note) {
        group.entries.forEach(({ d }) => this.model.transport(D.sourceKey(d), d.field, state, note));
    }
    _statusAll(state, note) { this.groups.forEach((group) => this._status(group, state, note)); }
    _live(link) { return !this.closed && this.link === link && !link.closed; }
    _current(op) { return this._live(op.link) && this.pending === op && op.generation === this.generation; }
    _shutdown(proxy) {
        if (proxy && proxy.shutdown) Promise.resolve().then(() => proxy.shutdown())
            .catch((error) => this.ctx.log.warn('Diagnostic shutdown: ' + error));
    }
    _dispose(link) {
        link.closed = true; clearTimeout(link.waitTimer);
        link.diag.removeAllListeners();
        const proxy = link.proxy; link.proxy = null;
        this._shutdown(proxy);
    }
    _open() {
        const link = { closed: false, failed: false, ready: false, proxy: null, waitTimer: null, diag: null };
        this.link = link;
        // Keep the kit's TASU framing/transport implementation. Guards also run inside the
        // native queue, so a request queued before deactivate/close cannot be sent later.
        const signals = {
            proxy: async (iface, instance) => {
                const opening = this.signals.proxy(iface, instance);
                opening.then((proxy) => {
                    if (this._live(link)) link.proxy = proxy;
                    else this._shutdown(proxy);
                }).catch(() => {});
                const proxy = await deadline(opening, 5000, 'Diagnostic connect');
                if (!this._live(link)) throw new Error('Diagnostic link closed');
                return proxy;
            },
            on: (proxy, name, handler, log) => {
                if (!this._live(link)) return Promise.reject(new Error('Diagnostic link closed'));
                return deadline(this.signals.on(proxy, name, (value) => {
                    if (this._live(link)) handler(value);
                }, log), 2000, 'Diagnostic response subscription');
            },
            onAvailable: (proxy, handler) => {
                if (!this._live(link)) return Promise.reject(new Error('Diagnostic link closed'));
                return deadline(this.signals.onAvailable(proxy, (available) => {
                    if (this._live(link)) handler(available);
                }), 2000, 'Diagnostic availability subscription');
            },
            call: (proxy, method, params) => {
                const op = this.pending;
                if (!op || !this._current(op) || op.done) return Promise.reject(new Error('Diagnostic request cancelled'));
                // Diag.send normally retries a busy transport. A measurement adapter sends
                // once only: no delayed retry can outlive this request's fixed deadline.
                if (op.sent) return Promise.reject(new Error('Diagnostic transport busy; request not repeated'));
                op.sent = true;
                const guarded = { callMethod: (name, values, timeout) => {
                    if (!this._current(op) || op.done || Date.now() >= op.expiresAt) throw new Error('Diagnostic request cancelled');
                    return proxy.callMethod(name, values, timeout);
                } };
                return this.signals.call(guarded, method, params, Math.max(1, op.expiresAt - Date.now()));
            },
        };
        link.diag = new Diag(signals, this.ctx.log); link.diag.quiet = true;
        link.diag.on('available', (available) => {
            if (!this._live(link)) return;
            clearTimeout(link.waitTimer);
            if (!available) {
                this.generation++;
                this._statusAll('unavailable', 'Diagnostic provider unavailable');
                if (this.pending) this._finish(this.pending, { state: 'unavailable', note: 'Diagnostic provider disconnected' });
            } else {
                this._statusAll('waiting', 'Diagnostic provider connected; waiting for measurement');
                this._wake();
            }
        });
        this._statusAll('waiting', 'Connecting to read-only diagnostic provider');
        link.diag.init().then(() => {
            if (!this._live(link)) return;
            if (link.diag.error || !link.diag.p) {
                link.failed = true;
                this._statusAll('error', link.diag.error || 'No diagnostic link');
                this._dispose(link); return;
            }
            link.ready = true;
            if (!link.diag.available) link.waitTimer = setTimeout(() => {
                if (this._live(link) && !link.diag.available) this._statusAll('unavailable', 'No diagnostic provider announcement received');
            }, 5000);
            this._wake();
        }).catch((error) => {
            if (!this._live(link)) return;
            link.failed = true; this._statusAll('error', error.message); this._dispose(link);
        });
    }
    _wake() {
        clearTimeout(this.timer); this.timer = null;
        if (this.closed || !this.groups.length) return;
        if (this.ctx.preview || !this.signals.hasNative()) {
            this._statusAll('unavailable', this.ctx.preview ? 'Preview has no live diagnostic feed' : 'SOME/IP native module unavailable');
            return;
        }
        if (!this.link) { this._open(); return; }
        if (!this._live(this.link) || !this.link.ready || !this.link.diag.available || this.pending) return;
        const now = Date.now();
        let due = null, nextAt = Infinity;
        this.groups.forEach((group) => {
            if (group.nextAt <= now && (!due || group.nextAt < due.nextAt)) due = group;
            nextAt = Math.min(nextAt, group.nextAt);
        });
        if (due) this._request(due);
        else {
            this.timer = setTimeout(() => this._wake(), Math.max(1, nextAt - now));
            if (this.timer.unref) this.timer.unref();
        }
    }
    _request(group) {
        const link = this.link, diag = link.diag;
        const op = { link, group, generation: this.generation, expiresAt: Date.now() + REQUEST_MS,
            sent: false, sendSettled: false, accepted: false, answer: null, done: false, timer: null };
        this.pending = op;
        op.onFrame = (frame) => {
            if (op.done || op.answer || frame.ecu !== group.target) return;
            const uds = frame.uds;
            if (!Array.isArray(uds) || !uds.length) return;
            const negative = uds[0] === 0x7F && uds[1] === group.sid;
            const positive = uds[0] === group.sid + 0x40 && group.params.every((value, index) => uds[index + 1] === value);
            if (!negative && !positive) return;
            if (!uds.every(byte) || (negative && uds.length < 3)) {
                op.answer = { error: { state: 'invalid', note: 'Malformed diagnostic response' } };
            } else if (negative) {
                if (uds[2] === 0x78) return; // Pending never extends the hard request deadline.
                op.answer = { error: { state: [0x11, 0x12, 0x31].includes(uds[2]) ? 'unavailable' : 'error',
                    note: 'Diagnostic NRC 0x' + hex(uds[2]) + ': ' + (NRC[uds[2]] || 'request rejected') } };
            } else op.answer = { ecu: frame.ecu, uds: uds.slice() };
            if (op.accepted) this._finish(op, op.answer.error, op.answer);
        };
        op.onError = (error) => this._finish(op, { state: 'error', note: 'Diagnostic transport: ' + error });
        op.onReject = (code) => this._finish(op, { state: 'error', note: 'TASU rejected diagnostic request: 0x' + hex(code) });
        diag.on('frame', op.onFrame); diag.on('tasError', op.onError); diag.on('tasReject', op.onReject);
        op.timer = setTimeout(() => this._finish(op, { state: 'unavailable',
            note: 'No diagnostic response from ECU 0x' + hex(group.target) + ' within ' + REQUEST_MS + ' ms' }), REQUEST_MS);
        Promise.resolve().then(() => diag.send(group.target, group.sid, group.params)).then((verdict) => {
            op.sendSettled = true;
            if (op.done) { this._release(op); return; }
            if (!['NO_ERROR', 'REQUEST_PENDING', '0', '1'].includes(verdict)) {
                this._finish(op, { state: 'error', note: 'Diagnostic transport refused: ' + verdict }); return;
            }
            op.accepted = true;
            if (op.answer) this._finish(op, op.answer.error, op.answer);
        }, (error) => {
            op.sendSettled = true;
            if (op.done) this._release(op);
            else this._finish(op, { state: 'error', note: error.message || String(error) });
        });
    }
    _deliver(group, reply) {
        const base = 1 + group.params.length;
        group.entries.forEach(({ d, config: c }) => {
            const required = base + Math.max(c.at + c.bytes, c.minBytes || 0, c.validAt === undefined ? 0 : c.validAt + 1);
            if (reply.uds.length < required) {
                this.model.transport(D.sourceKey(d), d.field, 'invalid', 'Short diagnostic response: expected at least ' + required + ' bytes');
                return;
            }
            if (c.validAt !== undefined && !c.validValues.includes(reply.uds[base + c.validAt])) {
                this.model.transport(D.sourceKey(d), d.field, 'unavailable', 'Diagnostic validity byte at payload offset ' +
                    c.validAt + ' is 0x' + hex(reply.uds[base + c.validAt]));
                return;
            }
            let value = 0;
            for (let index = 0; index < c.bytes; index++) value = value * 256 + reply.uds[base + c.at + index];
            if (c.signed && reply.uds[base + c.at] >= 0x80) value -= Math.pow(256, c.bytes);
            if (!Number.isSafeInteger(value)) {
                this.model.transport(D.sourceKey(d), d.field, 'invalid', 'Diagnostic integer is not safely representable'); return;
            }
            this.model.receive(D.sourceKey(d), d.field, { value, ecu: reply.ecu, uds: reply.uds.slice() }, 'diagnostic');
        });
    }
    _finish(op, error, reply) {
        if (op.done) return;
        op.done = true; clearTimeout(op.timer);
        const diag = op.link.diag;
        diag.removeListener('frame', op.onFrame); diag.removeListener('tasError', op.onError); diag.removeListener('tasReject', op.onReject);
        if (this._current(op)) {
            if (error) this._status(op.group, error.state, error.note);
            else if (reply) this._deliver(op.group, reply);
        }
        const refresh = this.model.settings.refreshMs;
        op.group.nextAt = Date.now() + (Number.isFinite(refresh) && refresh > 0 ? Math.max(250, refresh) : 1000);
        // Even a response timeout cannot start a second native call before the first settles.
        this._release(op);
    }
    _release(op) {
        if (!op.done || !op.sendSettled || this.pending !== op) return;
        this.pending = null;
        this._wake();
    }
    close() {
        if (this.closed) return;
        this.closed = true; this.generation++;
        clearTimeout(this.timer); this.timer = null; this.groups = [];
        if (this.pending) this._finish(this.pending);
        if (this.link) this._dispose(this.link);
    }
}
module.exports = { DiagnosticServices };

'use strict';
const GALLON_LITRES = 3.785411784;
const FRESH_MS = 3000, REQUEST_MS = 1500, POLL_MS = 1000;
// Exact physical DME0x12 entries in upstream builtin/sgbd_index.json; no family guess.
const PETROL = new Set(['0F2422', '0F2424', '0F2426', '0F2427', '0F2428', '0F2429',
    '0F242A', '0F242C', '0F242E', '0F2460', '0F25A0', '0F25A2', '0F26B4',
    '0F26B8', '0F26BC', '0F26E0', '0F26E4', '0F26E8', '0F2930']);
const IDENTITY = { sid: 0x22, params: [0xF1, 0x50], name: 'identity', bytes: 3 };
const VOLUME = { sid: 0x22, params: [0x56, 0x56], name: 'DME0x12/5656', bytes: 2, factor: 0.00119209 * 3.6 };
const MASS = { sid: 0x22, params: [0x45, 0x21], name: 'DME0x12/4521', bytes: 2, factor: 0.1 / 0.745 };
const OBD = { sid: 0x01, params: [0x5E], name: 'DME0x12/OBD01/5E', bytes: 2, factor: 0.05 };
const mono = () => { const t = process.hrtime(); return t[0] * 1000 + t[1] / 1000000; };
const byte = (n) => Number.isInteger(n) && n >= 0 && n <= 255;
function deadline(promise, ms) {
    let timer;
    return Promise.race([Promise.resolve(promise), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Diagnostic initialization timed out')), ms);
    })]).then((value) => { clearTimeout(timer); return value; }, (error) => { clearTimeout(timer); throw error; });
}
class FuelSource {
    constructor(ctx, changed, Diag) {
        this.ctx = ctx; this.changed = changed; this.Diag = Diag;
        this.running = false; this.closed = false; this.link = null; this.pending = null; this.timer = null;
        this.generation = 0; this.epoch = 0; this.source = null; this.identity = null;
        this.diagnostic = null; this.last = null; this.rate = null; this.acc = 0; this.accMs = 0;
        this.factor = null; this.ratios = []; this.spread = null; this.note = 'Fuel acquisition stopped';
        this.choices = [OBD]; this.pick = 0; this.probeAt = 0; this.lastState = 'unavailable';
    }
    _live(link) { return this.running && !this.closed && this.link === link && !link.closed; }
    _current(op) { return this._live(op.link) && this.pending === op && op.generation === this.generation; }
    _shutdown(proxy) {
        if (proxy && proxy.shutdown) Promise.resolve().then(() => proxy.shutdown()).catch((error) => {
            if (this.ctx.log) this.ctx.log.warn('Fuel diagnostic shutdown: ' + error);
        });
    }
    _dispose(link) {
        if (!link || link.closed) return;
        link.closed = true;
        if (link.diag) link.diag.removeAllListeners();
        this._shutdown(link.proxy); link.proxy = null;
        if (this.link === link) this.link = null;
    }
    _clearCounter(clearCalibration) {
        this.last = null; this.rate = null; this.acc = 0; this.accMs = 0;
        if (clearCalibration) { this.factor = null; this.ratios = []; this.spread = null; }
        this.epoch++;
    }
    resetCounter() {
        this._clearCounter(true);
        this.note = 'Injection counter disconnected or reset; waiting for a new rate window';
        this._emit(mono());
    }
    _resetProvider(note) {
        this.generation++; this.identity = null; this.diagnostic = null; this.source = null;
        this.choices = [OBD]; this.pick = 0; this.probeAt = 0;
        this._clearCounter(true); this.note = note;
    }
    start() {
        if (this.closed || this.running) return;
        this.running = true; this._resetProvider('Connecting to physical DME0x12');
        this._emit(mono()); this._wake(0);
    }
    stop() {
        if (!this.running) return;
        this.running = false; clearTimeout(this.timer); this.timer = null;
        this._resetProvider('Fuel acquisition stopped');
        if (this.pending) this._finish(this.pending, null, 'Fuel acquisition stopped');
        this._dispose(this.link); this._emit(mono());
    }
    close() { this.stop(); this.closed = true; }
    _wake(ms) {
        if (!this.running || this.closed || this.timer) return;
        this.timer = setTimeout(() => { this.timer = null; this._poll(); }, ms);
        if (this.timer.unref) this.timer.unref();
    }
    _open() {
        const link = { closed: false, ready: false, proxy: null, diag: null, identified: false };
        this.link = link;
        const signals = this.ctx.signals;
        const guarded = {
            proxy: async (iface, instance) => {
                const opening = signals.proxy(iface, instance);
                opening.then((proxy) => { if (this._live(link)) link.proxy = proxy; else this._shutdown(proxy); }).catch(() => {});
                const proxy = await deadline(opening, 5000);
                if (!this._live(link)) throw new Error('Fuel diagnostic link closed');
                return proxy;
            },
            on: (proxy, name, handler, log) => {
                if (!this._live(link)) return Promise.reject(new Error('Fuel diagnostic link closed'));
                return deadline(signals.on(proxy, name, (value) => { if (this._live(link)) handler(value); }, log), 2000);
            },
            onAvailable: (proxy, handler) => {
                if (!this._live(link)) return Promise.reject(new Error('Fuel diagnostic link closed'));
                return deadline(signals.onAvailable(proxy, (available) => { if (this._live(link)) handler(available); }), 2000);
            },
            call: (proxy, method, params) => {
                const op = this.pending;
                if (!op || !this._current(op) || op.done || op.sent) return Promise.reject(new Error('Fuel diagnostic request cancelled'));
                op.sent = true;
                // signals.call may queue native work: check again at actual native dispatch.
                const native = { callMethod: (name, values, timeout) => {
                    if (!this._current(op) || op.done || mono() >= op.expires) throw new Error('Fuel diagnostic dispatch expired');
                    return proxy.callMethod(name, values, Math.max(1, Math.min(timeout, op.expires - mono())));
                } };
                return signals.call(native, method, params, Math.max(1, op.expires - mono()));
            },
        };
        try {
            link.diag = new this.Diag(guarded, this.ctx.log); link.diag.quiet = true;
            link.diag.on('available', (available) => {
                if (!this._live(link)) return;
                this._resetProvider(available ? 'Diagnostic provider connected; reading identity' : 'Diagnostic provider disconnected');
                link.identified = false;
                if (this.pending) this._finish(this.pending, null, this.note);
                this._emit(mono()); this._wake(0);
            });
            deadline(link.diag.init(), 10000).then(() => {
                if (!this._live(link)) return;
                if (link.diag.error || !link.diag.p) throw new Error(link.diag.error || 'No diagnostic proxy');
                link.ready = true; this._wake(0);
            }).catch((error) => {
                if (!this._live(link)) return;
                this.note = String(error); this._dispose(link); this._emit(mono()); this._wake(5000);
            });
        } catch (error) {
            this.note = String(error); this._dispose(link); this._emit(mono()); this._wake(5000);
        }
    }
    _poll() {
        if (!this.running || this.closed || this.pending) return;
        if (!this.ctx.signals || this.ctx.preview || !this.ctx.signals.hasNative()) {
            this.note = 'Native fuel diagnostics unavailable'; this._emit(mono()); return;
        }
        if (!this.link) { this._open(); return; }
        const link = this.link;
        if (!link.ready || !link.diag.available) { this._wake(POLL_MS); return; }
        if (!link.identified) { this._request(link, IDENTITY); return; }
        if (this.sample(mono()).source === 'CDS2/injectionVolumeFuelEngine/calibrated') {
            this._wake(POLL_MS); return;
        }
        if (this.pick && mono() >= this.probeAt) { this.pick = 0; this.probeAt = mono() + 30000; }
        this._request(link, this.choices[this.pick]);
    }
    _request(link, choice) {
        const op = { link, choice, generation: this.generation, expires: mono() + REQUEST_MS,
            sent: false, accepted: false, settled: false, done: false, answer: null, timer: null };
        this.pending = op;
        op.frame = (frame) => {
            if (!this._current(op) || op.done || mono() >= op.expires || frame.ecu !== 0x12) return;
            const u = frame.uds;
            if (!Array.isArray(u) || !u.every(byte)) return;
            const negative = u[0] === 0x7F && u[1] === choice.sid;
            const positive = u[0] === choice.sid + 0x40 && choice.params.every((v, i) => u[i + 1] === v);
            if (!negative && !positive) return;
            if (negative && u[2] === 0x78) return; // hard deadline is never extended
            op.answer = { uds: u.slice(), valid: positive && u.length === 1 + choice.params.length + choice.bytes };
            if (op.accepted) this._finish(op, op.answer, 'DME refused or malformed fuel response');
        };
        op.error = (error) => {
            if (!this._current(op) || op.done) return;
            this._finish(op, null, 'Fuel transport error: ' + error);
            if (!op.settled) {
                this._resetProvider('Fuel transport failed; waiting for native send to settle');
                this._dispose(link); this._emit(mono());
            }
        };
        link.diag.on('frame', op.frame); link.diag.on('tasError', op.error); link.diag.on('tasReject', op.error);
        op.timer = setTimeout(() => {
            this._finish(op, null, 'Fuel diagnostic request deadline expired');
            // A hung native send retains the single request slot even across stop/start.
            // Retire its proxy; never open a replacement until send() has actually settled.
            if (!op.settled) {
                this._resetProvider('Fuel native send blocked; waiting for transport to settle');
                this._dispose(link); this._emit(mono());
            }
        }, REQUEST_MS);
        Promise.resolve().then(() => {
            if (!this._current(op) || op.done) throw new Error('Fuel diagnostic request cancelled');
            return link.diag.send(0x12, choice.sid, choice.params, { maxRetries: 0, callTimeoutMs: REQUEST_MS });
        }).then((verdict) => {
            op.settled = true;
            if (op.done) { this._release(op); return; }
            if (!['NO_ERROR', 'REQUEST_PENDING', '0', '1'].includes(verdict)) {
                this._finish(op, null, 'Fuel transport refused: ' + verdict); return;
            }
            op.accepted = true;
            if (op.answer) this._finish(op, op.answer, 'DME refused or malformed fuel response');
        }, (error) => {
            op.settled = true;
            if (op.done) this._release(op);
            else this._finish(op, null, String(error));
        });
    }
    _finish(op, answer, note) {
        if (op.done) return;
        const current = this._current(op);
        op.done = true; clearTimeout(op.timer);
        op.link.diag.removeListener('frame', op.frame);
        op.link.diag.removeListener('tasError', op.error); op.link.diag.removeListener('tasReject', op.error);
        if (current) {
            const now = mono(), choice = op.choice;
            if (choice === IDENTITY) {
                op.link.identified = true;
                if (answer && answer.valid) {
                    this.identity = answer.uds.slice(3).map((v) => v.toString(16).toUpperCase().padStart(2, '0')).join('');
                    this.choices = PETROL.has(this.identity) ? [VOLUME, MASS, OBD] : [OBD];
                }
                this.pick = 0; this.probeAt = now + 30000;
            } else if (answer && answer.valid) {
                const base = 1 + choice.params.length, raw = answer.uds[base] * 256 + answer.uds[base + 1];
                if (this.diagnostic && now - this.diagnostic.receivedMono > FRESH_MS) this.epoch++;
                this.diagnostic = { lph: raw * choice.factor, receivedMono: now, receivedAt: Date.now(),
                    source: choice.name, raw: { ecu: 0x12, sid: choice.sid, params: choice.params.slice(), uds: answer.uds, value: raw } };
                this._learn(now); this.note = 'Fresh physical DME fuel flow';
            } else {
                this.note = note;
                if (this.pick < this.choices.length - 1) this.pick++;
                else { this.pick = 0; this.probeAt = now + 30000; }
            }
            this._emit(now);
        }
        if (op.settled) this._release(op);
    }
    _release(op) {
        if (this.pending !== op) return;
        this.pending = null;
        this._wake(op.choice === IDENTITY ? 100 : POLL_MS);
    }
    feed(rawCounter, monotonicMs, wallMs) {
        if (!this.running || this.closed) return;
        if (!Number.isInteger(rawCounter) || rawCounter < 0 || rawCounter > 65535 ||
            !Number.isFinite(monotonicMs) || !Number.isFinite(wallMs)) { this.resetCounter(); return; }
        if (this.last) {
            const dt = monotonicMs - this.last.t, delta = (rawCounter - this.last.raw + 65536) % 65536;
            // Like upstream Flow, reject large jumps rather than interpreting a reset as fuel.
            if (dt <= 0 || dt > FRESH_MS || delta > 40000 || delta / dt * 1000 > 40000) {
                this._clearCounter(true); this.note = 'Counter gap, reset or impossible delta';
            } else {
                this.acc += delta; this.accMs += dt;
                if (this.accMs >= 1000) {
                    this.rate = { value: this.acc / this.accMs * 1000, t: monotonicMs, wall: wallMs };
                    this.acc = 0; this.accMs = 0;
                }
            }
        }
        this.last = { raw: rawCounter, t: monotonicMs, wall: wallMs };
        this._emit(monotonicMs);
    }
    _learn(now) {
        const d = this.diagnostic, r = this.rate;
        if (!d || !r || !(d.lph > 0.5) || !(r.value > 0) || now < r.t || now - r.t > 1500 ||
            now - d.receivedMono > 1500) return;
        this.ratios = this.ratios.filter((entry) => now - entry.t <= 60000);
        this.ratios.push({ value: d.lph / r.value, t: now });
        if (this.ratios.length > 30) this.ratios.shift();
        if (this.ratios.length < 10) return;
        const sorted = this.ratios.map((entry) => entry.value).sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length / 4)], q3 = sorted[Math.floor(sorted.length * 3 / 4)];
        this.spread = q3 / q1;
        if (this.spread <= 1.3) {
            const factor = sorted[Math.floor(sorted.length / 2)];
            if (this.factor && Math.abs(factor / this.factor - 1) > 0.02) this.epoch++;
            this.factor = factor;
        }
    }
    sample(monotonicMs) {
        const now = Number.isFinite(monotonicMs) ? monotonicMs : mono();
        let selected = null;
        if (this.running && this.factor && this.last && this.rate && now >= this.last.t && now >= this.rate.t &&
            now - this.last.t <= FRESH_MS && now - this.rate.t <= FRESH_MS) {
            selected = { lph: this.rate.value * this.factor, receivedMono: this.rate.t, receivedAt: this.rate.wall,
                source: 'CDS2/injectionVolumeFuelEngine/calibrated',
                raw: { counter: this.last.raw, counterReceivedMono: this.last.t, rate: this.rate.value, rateMono: this.rate.t } };
        } else if (this.running && this.diagnostic && now >= this.diagnostic.receivedMono &&
            now - this.diagnostic.receivedMono <= FRESH_MS) selected = this.diagnostic;
        const source = selected ? selected.source : null;
        const state = selected ? 'live' : 'unavailable';
        if (source !== this.source || state !== this.lastState) { this.epoch++; this.source = source; this.lastState = state; }
        return { state, value: selected ? selected.lph / GALLON_LITRES : null, source, epoch: this.epoch,
            receivedMono: selected ? selected.receivedMono : null, receivedAt: selected ? selected.receivedAt : null,
            ageMs: selected ? now - selected.receivedMono : null,
            raw: Object.assign({}, selected ? selected.raw : {}, {
                injectionCounter: this.last ? { value: this.last.raw, receivedMono: this.last.t, receivedAt: this.last.wall } : null,
                diagnostic: this.diagnostic ? this.diagnostic.raw : null,
            }),
            note: selected ? (source === 'CDS2/injectionVolumeFuelEngine/calibrated' ? 'Vehicle-session calibrated counter flow' : 'Fresh physical DME fuel flow') :
                this.running && (this.diagnostic || this.last) ? 'No fresh calibrated counter or diagnostic flow' : this.note,
            identity: this.identity, calibration: { factorLphPerCountSecond: this.factor, samples: this.ratios.length,
                iqrRatio: this.spread, identity: this.identity }, unit: 'US gal/h' };
    }
    _emit(now) { if (this.changed) this.changed(this.sample(now)); }
}
module.exports = { FuelSource };

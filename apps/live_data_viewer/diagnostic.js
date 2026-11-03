'use strict';
const D = require('./definitions');
const { Diag, NRC, hex } = require('./kit/diag');

const REQUEST_MS = 5000;
const FAST_REQUEST_MS = 1000, FAST_POLL_MS = 100, BUSY_RETRY_MS = 100, MAX_DIDS = 8;
const floatBytes = new Uint8Array(4), floatView = new DataView(floatBytes.buffer);
function deadline(promise, ms, label) {
    let timer;
    return Promise.race([Promise.resolve(promise), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).then((value) => { clearTimeout(timer); return value; }, (error) => { clearTimeout(timer); throw error; });
}
function byte(value) { return Number.isInteger(value) && value >= 0 && value <= 255; }
function requiredPayload(c) {
    return Math.max(c.at + c.bytes, c.minBytes || 0, c.validAt === undefined ? 0 : c.validAt + 1,
        c.qualityAt === undefined ? 0 : c.qualityAt + 1);
}
function configuration(d, candidate) {
    const c = candidate || d.diag;
    if (!c || typeof c !== 'object' || !byte(c.target) || c.target === 0xDF || c.target === 0xF2 ||
        ![0x22, 0x01].includes(c.sid) || !Number.isInteger(c.did) || c.did < 0 || c.did > (c.sid === 0x01 ? 255 : 65535) ||
        !Number.isSafeInteger(c.at) || c.at < 0 || !Number.isInteger(c.bytes) || c.bytes < 1 || c.bytes > 6 ||
        (c.signed !== undefined && typeof c.signed !== 'boolean') ||
        (c.minBytes !== undefined && (!Number.isSafeInteger(c.minBytes) || c.minBytes < 0)) ||
        (c.exactBytes !== undefined && (!Number.isSafeInteger(c.exactBytes) || c.exactBytes < c.at + c.bytes)) ||
        (c.format !== undefined && (c.format !== 'float32' || c.bytes !== 4 || c.signed || c.mask !== undefined)) ||
        (c.validAt !== undefined && (!Number.isSafeInteger(c.validAt) || c.validAt < 0 ||
            !Array.isArray(c.validValues) || !c.validValues.length || !c.validValues.every(byte))) ||
        (c.validMask !== undefined && (!byte(c.validMask) || c.validAt === undefined)) ||
        (c.mask !== undefined && (!byte(c.mask) || c.bytes !== 1 || !Number.isInteger(c.shift) || c.shift < 0 || c.shift > 7)) ||
        (c.qualityAt !== undefined && (!Number.isSafeInteger(c.qualityAt) || c.qualityAt < 0))) {
        throw new Error('Invalid physical read-only diagnostic configuration');
    }
    return Object.assign({}, c, { validValues: c.validValues && c.validValues.slice() });
}

class DiagnosticServices {
    constructor(ctx, model) {
        this.ctx = ctx; this.model = model; this.signals = ctx.signals;
        this.closed = false; this.generation = 0; this.signature = ''; this.groups = [];
        this.link = null; this.pending = null; this.timer = null; this.control = null; this.fastReads = 0; this.picks = {};
        this.lengths = new Map(); this.noBatch = new Set(); this.busyUntil = 0;
    }
    activate(definitions) {
        if (this.closed) return;
        const active = definitions.filter((d) => d.diag);
        const signature = JSON.stringify(active.map((d) =>
            [d.id, D.sourceKey(d), d.field, d.diag, d.diagCandidates, d.focusedFast, d.pollMs]));
        if (signature === this.signature) return;
        this.signature = signature; this.generation++;
        clearTimeout(this.timer); this.timer = null;
        const groups = new Map();
        active.forEach((d) => {
            try {
                const candidates = d.diagCandidates && d.diagCandidates.map((c) => configuration(d, c));
                const pick = candidates ? this.picks[d.id] || 0 : 0;
                const c = candidates ? candidates[pick] : configuration(d);
                const key = candidates ? d.id : [c.target, c.sid, c.did].join(':');
                if (!groups.has(key)) groups.set(key, { key, target: c.target, sid: c.sid,
                    params: c.sid === 0x01 ? [c.did] : [c.did >> 8, c.did & 255], entries: [], nextAt: 0, refreshBy: 0,
                    candidates, pick, failedCandidates: 0 });
                const group = groups.get(key);
                if (d.focusedFast) group.focusedFast = true;
                if (d.id === 'accelerator' || d.id === 'brakePressure' || d.id === 'kickdown' ||
                    d.id === 'boostAbsolute' || d.id === 'barometricPressure') group.fast = true;
                if (d.id === 'boostAbsolute' || d.id === 'barometricPressure') group.boost = true;
                if (d.refreshPriority) group.refreshPriority = true;
                group.entries.push({ d, config: c });
            } catch (error) { this.model.transport(D.sourceKey(d), d.field, 'error', error.message); }
        });
        this.groups = Array.from(groups.values());
        // A previous generation keeps its request slot until the reply/deadline is drained.
        // Its result cannot become a sample for the newly selected definitions.
        if (this.link && this.link.failed) { this._dispose(this.link); this.link = null; }
        this._wake();
    }
    async setExhaust(mode) {
        if (!['open', 'closed', 'oem'].includes(mode)) throw new Error('Unsupported exhaust mode');
        if (this.closed || this.ctx.preview || !this.signals.hasNative()) throw new Error('Live exhaust control unavailable');
        if (this.control) throw new Error('An exhaust command is already pending');
        const control = { generation: this.generation, cancelled: false, request: null };
        this.control = control;
        const timer = setTimeout(() => {
            control.cancelled = true;
            const error = new Error('Exhaust control deadline expired; any already sent command may have taken effect');
            if (control.request) { control.request.reject(error); control.request = null; }
            if (this.pending && this.pending.group.control) this._finish(this.pending, { state: 'error', note: error.message });
        }, 30000);
        const request = (target, sid, params) => new Promise((resolve, reject) => {
            if (this.closed || control.cancelled || control.generation !== this.generation) {
                reject(new Error('Exhaust control cancelled by connection or page change')); return;
            }
            control.request = { target, sid, params, entries: [], nextAt: 0, control: true, resolve, reject };
            this._wake();
        });
        try {
            // Probe each physical DME before any write; no inferred one-DME/bank routing.
            for (const target of [0x12, 0x13]) {
                const reply = await request(target, 0x22, [0x62, 0xFD]);
                if (reply.uds.length !== 5) throw new Error('Electric flap capability read has unexpected length');
            }
            const params = mode === 'oem' ? [0x60, 0xFD, 0] :
                [0x60, 0xFD, 3].concat(mode === 'open' ? [0x03, 0xE8] : [0x23, 0x28]);
            const outcomes = [];
            for (const target of [0x12, 0x13]) {
                try {
                    await request(target, 0x2F, params);
                    outcomes.push({ target, accepted: true });
                } catch (error) { outcomes.push({ target, accepted: false, error: error.message }); }
            }
            this.groups.forEach((group) => {
                if ((group.params[0] === 0x62 || group.params[0] === 0x64) && group.params[1] === 0xFD) {
                    group.nextAt = 0; group.refreshBy = 0;
                }
            });
            if (outcomes.some((outcome) => !outcome.accepted)) throw new Error(outcomes.map((outcome) =>
                'DME 0x' + hex(outcome.target) + ': ' + (outcome.accepted ? 'accepted' : outcome.error)).join('; '));
            return { accepted: true, mode, outcomes, confirmed: 'UNKNOWN',
                detail: 'Both DMEs accepted request; mechanical position unmeasured. Override self-times; no automatic refresh.' };
        } finally { clearTimeout(timer); this.control = null; this._wake(); }
    }
    _choose(group, pick) {
        const c = group.candidates[pick];
        group.pick = pick; group.target = c.target; group.sid = c.sid;
        group.params = c.sid === 0x01 ? [c.did] : [c.did >> 8, c.did & 255];
        group.entries[0].config = c;
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
                // A request is sent once only. Focused reads disable Diag's internal busy
                // retries; the scheduler owns their bounded, generation-safe retry timing.
                if (op.sent) return Promise.reject(new Error('Diagnostic transport busy; request not repeated'));
                op.sent = true;
                const guarded = { callMethod: (name, values, timeout) => {
                    if (!this._current(op) || op.done || Date.now() >= op.expiresAt) throw new Error('Diagnostic request cancelled');
                    op.startedAt = Date.now();
                    return proxy.callMethod(name, values, Math.max(1, Math.min(timeout, op.expiresAt - op.startedAt)));
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
                this.lengths.clear();
                this.groups.forEach((group) => { group.batchReady = false; });
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
        if (this.closed || !this.groups.length && !this.control) return;
        if (this.ctx.preview || !this.signals.hasNative()) {
            this._statusAll('unavailable', this.ctx.preview ? 'Preview has no live diagnostic feed' : 'SOME/IP native module unavailable');
            return;
        }
        if (!this.link) { this._open(); return; }
        if (!this._live(this.link) || !this.link.ready || !this.link.diag.available || this.pending) return;
        if (Date.now() < this.busyUntil) {
            this.timer = setTimeout(() => this._wake(), this.busyUntil - Date.now());
            if (this.timer.unref) this.timer.unref();
            return;
        }
        if (this.control && this.control.request) {
            const request = this.control.request; this.control.request = null;
            if (this.control.cancelled || this.control.generation !== this.generation) {
                request.reject(new Error('Exhaust control cancelled')); return;
            }
            this._request(request); return;
        }
        if (!this.groups.length) return;
        const now = Date.now(), needBoost = this.model.boostFromDme();
        const groups = this.groups.filter((group) => !group.boost || needBoost);
        // Keep checking FES freshness while diagnostic boost is asleep.
        let due = null, nextAt = groups.length < this.groups.length ? now + 100 : Infinity;
        groups.forEach((group) => {
            if (group.nextAt <= now && (!due || group.nextAt < due.nextAt)) due = group;
            nextAt = Math.min(nextAt, group.nextAt);
        });
        // Focused groups share earliest-due service, including steering, wheels and
        // sway: legacy pedal favoritism must not starve them on a saturated link.
        if (!groups.some((group) => group.focusedFast)) {
            // Other panels retain exhaust freshness and the existing fast-read priority.
            let urgent = null;
            groups.forEach((group) => {
                if (group.refreshPriority && group.nextAt <= now && group.refreshBy <= now + 1000 &&
                    (!urgent || group.refreshBy < urgent.refreshBy)) urgent = group;
            });
            let fast = null;
            if (!urgent && this.fastReads < 2) groups.forEach((group) => {
                if (group.fast && group.nextAt <= now && (!fast || group.nextAt < fast.nextAt)) fast = group;
            });
            if (urgent) { due = urgent; this.fastReads = 0; }
            else if (fast) { due = fast; this.fastReads++; }
            else if (due) this.fastReads = 0;
        }
        if (due) this._request(due, this._dueBatch(due, groups, now));
        else {
            this.timer = setTimeout(() => this._wake(), Math.max(1, nextAt - now));
            if (this.timer.unref) this.timer.unref();
        }
    }
    _payloadFits(group, length) {
        return Number.isSafeInteger(length) && group.entries.every(({ config: c }) =>
            length >= requiredPayload(c) && (c.exactBytes === undefined || length === c.exactBytes));
    }
    _batchable(group) {
        return group.focusedFast && group.batchReady && group.sid === 0x22 && !group.candidates &&
            !this.noBatch.has(group.target) && this._payloadFits(group, this.lengths.get(group.key));
    }
    _dueBatch(first, groups, now) {
        if (!this._batchable(first)) return [first];
        const batch = [first], seen = new Set([first.key]);
        groups.filter((group) => group !== first && group.target === first.target && group.nextAt <= now &&
            this._batchable(group)).sort((a, b) => a.nextAt - b.nextAt).forEach((group) => {
            if (batch.length < MAX_DIDS && !seen.has(group.key)) { batch.push(group); seen.add(group.key); }
        });
        return batch;
    }
    _splitBatch(groups, frame) {
        const uds = frame.uds, expected = new Map(), seen = new Set(), replies = [];
        groups.forEach((group) => expected.set(group.params[0] * 256 + group.params[1], group));
        if (expected.size !== groups.length || uds[0] !== 0x62 || !uds.every(byte)) return null;
        let at = 1;
        while (at < uds.length) {
            if (at + 2 > uds.length) return null;
            const did = uds[at] * 256 + uds[at + 1], group = expected.get(did);
            if (!group || seen.has(did)) return null;
            const length = this.lengths.get(group.key);
            if (!this._payloadFits(group, length)) return null;
            const end = at + 2 + length;
            if (end > uds.length) return null;
            replies.push({ group, reply: { ecu: frame.ecu, uds: [0x62].concat(uds.slice(at, end)) } });
            seen.add(did); at = end;
        }
        // No delivery occurs until every expected block, boundary and trailing byte is valid.
        return seen.size === expected.size && at === uds.length ? replies : null;
    }
    _request(group, groups) {
        groups = groups || [group];
        const link = this.link, diag = link.diag, batch = groups.length > 1;
        const params = batch ? groups.reduce((all, entry) => all.concat(entry.params), []) : group.params;
        const requestMs = group.focusedFast ? FAST_REQUEST_MS : REQUEST_MS, startedAt = Date.now();
        const op = { link, group, groups, batch, startedAt, generation: this.generation, expiresAt: startedAt + requestMs,
            sent: false, sendSettled: false, accepted: false, answer: null, done: false, timer: null };
        this.pending = op;
        op.onFrame = (frame) => {
            if (op.done || op.answer || !this._live(op.link) || this.pending !== op ||
                Date.now() >= op.expiresAt || frame.ecu !== group.target) return;
            const uds = frame.uds;
            if (!Array.isArray(uds) || !uds.length) return;
            const negative = uds[0] === 0x7F && uds[1] === group.sid;
            const echo = group.control && group.sid === 0x2F ? params.slice(0, 3) : params;
            const positive = uds[0] === group.sid + 0x40 && (batch || echo.every((value, index) => uds[index + 1] === value));
            if (!negative && !positive) return;
            if (!uds.every(byte) || (negative && uds.length < 3)) {
                op.answer = { error: { state: 'invalid', note: 'Malformed diagnostic response' } };
            } else if (negative) {
                if (uds[2] === 0x78) return; // Pending never extends the hard request deadline.
                op.answer = { error: { state: [0x11, 0x12, 0x31].includes(uds[2]) ? 'unavailable' : 'error',
                    busy: uds[2] === 0x21,
                    note: 'Diagnostic NRC 0x' + hex(uds[2]) + ': ' + (NRC[uds[2]] || 'request rejected') } };
            } else if (batch) {
                const replies = this._splitBatch(groups, frame);
                op.answer = replies ? { replies } :
                    { error: { state: 'invalid', note: 'Malformed or incomplete multi-DID diagnostic response' } };
            } else op.answer = { ecu: frame.ecu, uds: uds.slice() };
            if (op.accepted) this._finish(op, op.answer.error, op.answer);
        };
        op.onError = (error) => this._finish(op, { state: 'error', note: 'Diagnostic transport: ' + error });
        op.onReject = (code) => this._finish(op, { state: 'error', note: 'TASU rejected diagnostic request: 0x' + hex(code) });
        diag.on('frame', op.onFrame); diag.on('tasError', op.onError); diag.on('tasReject', op.onReject);
        op.timer = setTimeout(() => this._finish(op, { state: 'unavailable',
            note: 'No diagnostic response from ECU 0x' + hex(group.target) + ' within ' + requestMs + ' ms' }), requestMs);
        // The kit must not sleep for a second before its redundant adapter retry.
        // A busy focused request settles once, then the scheduler waits 100 ms globally.
        const options = group.focusedFast ? { maxRetries: 0, callTimeoutMs: requestMs } : undefined;
        Promise.resolve().then(() => {
            if (!this._current(op) || op.done || Date.now() >= op.expiresAt) throw new Error('Diagnostic request cancelled');
            return diag.send(group.target, group.sid, params, options);
        }).then((verdict) => {
            op.sendSettled = true;
            if (op.done) { this._release(op); return; }
            if (!['NO_ERROR', 'REQUEST_PENDING', '0', '1'].includes(verdict)) {
                this._finish(op, { state: 'error', busy: /TEMPORARILY_NOT_ACCEPTED|BUSY/i.test(verdict),
                    note: 'Diagnostic transport refused: ' + verdict }); return;
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
        let delivered = false;
        group.entries.forEach(({ d, config: c }) => {
            const required = base + requiredPayload(c);
            if (c.exactBytes !== undefined && reply.uds.length !== base + c.exactBytes) {
                this.model.transport(D.sourceKey(d), d.field, 'invalid', 'Unexpected diagnostic payload length: expected exactly ' + c.exactBytes + ' bytes');
                return;
            }
            if (reply.uds.length < required) {
                this.model.transport(D.sourceKey(d), d.field, 'invalid', 'Short diagnostic response: expected at least ' + required + ' bytes');
                return;
            }
            const validity = c.validAt === undefined ? null : reply.uds[base + c.validAt];
            if (c.validAt !== undefined && !c.validValues.includes(c.validMask === undefined ? validity : validity & c.validMask)) {
                this.model.transport(D.sourceKey(d), d.field, 'unavailable', 'Diagnostic validity byte at payload offset ' +
                    c.validAt + ' is 0x' + hex(reply.uds[base + c.validAt]));
                return;
            }
            if (c.qualityAt !== undefined) {
                const quality = reply.uds[base + c.qualityAt];
                if (quality <= 50 || quality > 100) {
                    this.model.transport(D.sourceKey(d), d.field, 'unavailable', 'Wheel signal quality ' + quality +
                        '%: no signal, weak signal or invalid quality'); return;
                }
            }
            let value = 0;
            if (c.format === 'float32') {
                for (let index = 0; index < 4; index++) floatBytes[index] = reply.uds[base + c.at + index];
                value = floatView.getFloat32(0, false);
            } else {
                for (let index = 0; index < c.bytes; index++) value = value * 256 + reply.uds[base + c.at + index];
                if (c.signed && reply.uds[base + c.at] >= 0x80) value -= Math.pow(256, c.bytes);
                if (c.mask !== undefined) value = (value & c.mask) >>> c.shift;
            }
            if (c.format === 'float32' ? !Number.isFinite(value) : !Number.isSafeInteger(value)) {
                this.model.transport(D.sourceKey(d), d.field, 'invalid', 'Diagnostic quantity is not finite or safely representable'); return;
            }
            const raw = { value, ecu: reply.ecu, sid: group.sid, identifier: c.did, uds: reply.uds.slice() };
            if (group.candidates) {
                const decoded = D.decode(d, raw);
                if (decoded.state !== 'live') {
                    this.model.transport(D.sourceKey(d), d.field, decoded.state, decoded.note); return;
                }
            }
            this.model.receive(D.sourceKey(d), d.field, raw, 'diagnostic'); delivered = true;
        });
        return delivered;
    }
    _finish(op, error, reply) {
        if (op.done) return;
        op.done = true; clearTimeout(op.timer);
        const diag = op.link.diag;
        diag.removeListener('frame', op.onFrame); diag.removeListener('tasError', op.onError); diag.removeListener('tasReject', op.onReject);
        const current = this._current(op), now = Date.now();
        let align = false;
        if (current && op.group.focusedFast && error && error.busy) this.busyUntil = now + BUSY_RETRY_MS;
        if (current && op.batch && error) {
            // A failed multi-read says nothing about individual DID support. Disable
            // batching for this ECU and leave all members due for single-read retries.
            this.noBatch.add(op.group.target);
            op.groups.forEach((group) => {
                group.batchReady = false;
                this._status(group, error.state, 'Batch failed; retrying individually: ' + error.note);
                group.nextAt = Math.min(group.nextAt, now);
            });
        } else if (current) {
            op.groups.forEach((group) => {
                const part = op.batch ? reply.replies.find((entry) => entry.group === group).reply : reply;
                let delivered = false;
                if (error) this._status(group, error.state, error.note);
                else if (part) delivered = this._deliver(group, part);
                const cadence = Math.min.apply(null, group.entries.map(({ d }) =>
                    Number.isFinite(d.pollMs) && d.pollMs > 0 ? d.pollMs : this.model.settings.refreshMs));
                if (group.focusedFast) {
                    // Success is start-to-start, not a cooldown after the response.
                    // A late response makes the next request due immediately, never overlaps it.
                    group.nextAt = error ? now + (error.busy ? BUSY_RETRY_MS : 5000) : op.startedAt + FAST_POLL_MS;
                    if (error) group.batchReady = false;
                    else if (!op.batch && group.sid === 0x22 && !group.candidates && part) {
                        const length = part.uds.length - 3;
                        if (this._payloadFits(group, length) && (delivered || group.batchReady)) {
                            // Only a validated full single response establishes its exact wire
                            // length. minBytes/exactBytes never supply an inferred batch boundary.
                            this.lengths.set(group.key, length);
                            if (!group.batchReady) align = true;
                            group.batchReady = true;
                        } else group.batchReady = false;
                    }
                } else {
                    // Non-focused panels retain their configured post-response cadence/backoff.
                    group.nextAt = now + Math.max(error ? 5000 : 50,
                        Number.isFinite(cadence) && cadence > 0 ? cadence : 1000);
                }
                if (group.candidates) {
                    if (!error && delivered) {
                        this.picks[group.entries[0].d.id] = group.pick; group.failedCandidates = 0;
                    } else {
                        this._choose(group, (group.pick + 1) % group.candidates.length);
                        group.failedCandidates++;
                        group.nextAt = now + (group.failedCandidates < group.candidates.length ? 50 : Math.max(5000, cadence));
                        if (group.failedCandidates >= group.candidates.length) group.failedCandidates = 0;
                    }
                }
                if (!error && group.refreshPriority) {
                    group.refreshBy = now + Math.min.apply(null, group.entries.map(({ d }) => d.staleMs));
                }
            });
            if (align) {
                // Initial singles finish at different times. Align healthy known-length
                // siblings once they join the cohort so due-only batches actually converge.
                // Failed/backoff groups cannot join or postpone the healthy cohort.
                const siblings = this.groups.filter((group) => group.target === op.group.target && this._batchable(group));
                const nextAt = Math.max.apply(null, siblings.map((group) => group.nextAt));
                siblings.forEach((group) => { group.nextAt = nextAt; });
            }
        }
        if (op.group.control) {
            if (!current) op.group.reject(new Error('Exhaust control cancelled'));
            else if (error) op.group.reject(new Error(error.note));
            else op.group.resolve(reply);
        }
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
        if (this.control) {
            this.control.cancelled = true;
            if (this.control.request) this.control.request.reject(new Error('Exhaust control closed'));
        }
        if (this.pending) this._finish(this.pending);
        if (this.link) this._dispose(this.link);
    }
}
module.exports = { DiagnosticServices };

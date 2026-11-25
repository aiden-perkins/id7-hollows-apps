'use strict';
const D = require('./definitions');
const { Diag, NRC, hex } = require('./kit/diag');

const REQUEST_MS = 5000;
const FAST_REQUEST_MS = 1000, FAST_POLL_MS = 100, BUSY_RETRY_MS = 100, MAX_DIDS = 8;
const STATUS_REQUEST_MS = 1600, STATUS_RETRY_MS = 15000, RECONNECT_MS = 5000;
const floatBytes = new Uint8Array(4), floatView = new DataView(floatBytes.buffer);
function deadline(promise, ms, label) {
    let timer;
    return Promise.race([Promise.resolve(promise), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).then((value) => { clearTimeout(timer); return value; }, (error) => { clearTimeout(timer); throw error; });
}
function byte(value) { return Number.isInteger(value) && value >= 0 && value <= 255; }
function transportBusy(verdict) { return verdict === '7' || /TEMPORARILY_NOT_ACCEPTED|BUSY/i.test(verdict); }
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
        this.bm3Queue = []; this.bm3Listener = null; this.bm3Connection = null;
        this.bm3LinkStatus = 'Connecting to diagnostic provider'; this.preferBm3 = true;
    }
    activate(definitions, page) {
        if (this.closed) return;
        const active = definitions.filter((d) => d.diag);
        const engine = this.model.settings.bm3Engine;
        const settingsFor = (d) => [d.id, D.sourceKey(d), d.field, d.diag, d.diagCandidates,
            d.focusedFast, d.statusPoll, d.pollMs, d.fallbackFor, d.refreshPriority, d.selectDiagCandidates ? engine : null];
        const signature = JSON.stringify([page, active.map(settingsFor)]);
        if (signature === this.signature) return;
        this.signature = signature; this.generation++;
        clearTimeout(this.timer); this.timer = null;
        const previous = new Map(this.groups.map((group) => [group.key, group]));
        const groups = new Map();
        active.forEach((d) => {
            try {
                const selected = d.selectDiagCandidates ? d.selectDiagCandidates(engine) : d.diagCandidates;
                const candidates = selected && selected.map((c) => configuration(d, c));
                const pick = candidates && !d.selectDiagCandidates ? this.picks[d.id] || 0 : 0;
                const c = candidates ? candidates[pick] : configuration(d);
                if (!c) throw new Error('No diagnostic candidate for the selected engine family');
                const key = candidates ? d.id : [c.target, c.sid, c.did].join(':');
                if (!groups.has(key)) groups.set(key, { key, target: c.target, sid: c.sid,
                    params: c.sid === 0x01 ? [c.did] : [c.did >> 8, c.did & 255], entries: [], nextAt: 0, refreshBy: 0,
                    candidates, pick, failedCandidates: 0 });
                const group = groups.get(key);
                if (d.focusedFast) group.focusedFast = true;
                if (d.statusPoll) group.statusPoll = true;
                if (d.id === 'accelerator' || d.id === 'brakePressure' || d.id === 'kickdown' ||
                    d.id === 'boostAbsolute' || d.id === 'barometricPressure') group.fast = true;
                if (d.id === 'boostAbsolute' || d.id === 'barometricPressure') group.boost = true;
                if (d.refreshPriority) group.refreshPriority = true;
                group.entries.push({ d, config: c });
            } catch (error) { this.model.transport(D.sourceKey(d), d.field, 'error', error.message); }
        });
        // Keep a continuing group's validated DID, schedule and pending reply when
        // unrelated Driving groups are added or removed.
        this.groups = Array.from(groups.values(), (group) => {
            group.signature = JSON.stringify(group.entries.map(({ d }) => settingsFor(d)));
            const old = previous.get(group.key);
            if (old && old.signature === group.signature) return old;
            if (old && group.entries.some(({ d }) => d.selectDiagCandidates)) {
                this._status(group, 'waiting', 'Waiting for a measurement with the new engine profile');
            }
            group.pollMs = group.focusedFast ? FAST_POLL_MS : Math.min(...group.entries.map(({ d }) => d.pollMs || FAST_POLL_MS));
            return group;
        });
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
    _current(op) {
        return this._live(op.link) && this.pending === op && op.epoch === op.link.epoch &&
            (op.group.bm3 ? op.group.connection === this.bm3Connection : op.group.control ?
                op.generation === this.generation : op.groups.every((group) => this.groups.includes(group)));
    }
    watchBm3(listener) {
        this.bm3Listener = listener;
        listener(this.bm3Connection, this.bm3LinkStatus);
        if (this.link && this._live(this.link) && this.link.ready && !this.link.diag.available) this._awaitProvider(this.link);
        this._wake();
        return () => { if (this.bm3Listener === listener) this.bm3Listener = null; };
    }
    _bm3Link(connection, status) {
        if (this.bm3Connection === connection && this.bm3LinkStatus === status) return;
        this.bm3Connection = connection; this.bm3LinkStatus = status;
        if (!connection) this.bm3Queue.splice(0).forEach((request) => {
            request.reject(Object.assign(new Error(status), { kind: 'connection' }));
        });
        if (this.bm3Listener) this.bm3Listener(connection, status);
    }
    requestBm3(connection, target, sid, params, timeoutMs, canDispatch) {
        if (this.closed || !connection || connection !== this.bm3Connection) {
            return Promise.reject(Object.assign(new Error('Diagnostic provider disconnected'), { kind: 'connection' }));
        }
        return new Promise((resolve, reject) => {
            this.bm3Queue.push({ bm3: true, connection, target, sid, params, timeoutMs,
                canDispatch, queuedAt: Date.now(), resolve, reject });
            this._wake();
        });
    }
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
    _awaitProvider(link) {
        clearTimeout(link.waitTimer);
        link.waitTimer = setTimeout(() => {
            if (!this._live(link) || link.diag.available) return;
            const note = 'No diagnostic provider announcement received';
            if (this.bm3Listener) this._reconnect(link, note);
            else {
                this._statusAll('unavailable', note);
                this._bm3Link(null, note);
            }
        }, RECONNECT_MS);
    }
    _open() {
        const link = { closed: false, ready: false, epoch: 0, proxy: null, waitTimer: null, diag: null };
        this.link = link;
        this._bm3Link(null, 'Connecting to diagnostic provider');
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
                    if (!this._current(op) || op.done || op.group.bm3 && !op.group.canDispatch()) {
                        throw Object.assign(new Error('Diagnostic request cancelled'), { kind: 'cancelled' });
                    }
                    if (Date.now() >= op.expiresAt) {
                        throw Object.assign(new Error('Diagnostic request expired before dispatch'), { kind: 'timeout' });
                    }
                    op.startedAt = Date.now();
                    op.dispatched = true;
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
                this.generation++; link.epoch++;
                this.lengths.clear();
                this.groups.forEach((group) => { group.batchReady = false; group.nextAt = 0; group.refreshBy = 0; });
                this._statusAll('unavailable', 'Diagnostic provider unavailable');
                this._bm3Link(null, 'Diagnostic provider disconnected');
                if (this.pending) this._finish(this.pending, { state: 'unavailable', kind: 'connection', note: 'Diagnostic provider disconnected' });
                if (link.ready && this.bm3Listener) this._awaitProvider(link);
            } else {
                this._statusAll('waiting', 'Diagnostic provider connected; waiting for measurement');
                if (link.ready && !this.bm3Connection) this._bm3Link({}, '');
                this._wake();
            }
        });
        this._statusAll('waiting', 'Connecting to read-only diagnostic provider');
        link.diag.init().then(() => {
            if (!this._live(link)) return;
            if (link.diag.error || !link.diag.p) {
                this._reconnect(link, link.diag.error || 'No diagnostic link'); return;
            }
            link.ready = true;
            if (link.diag.available) this._bm3Link({}, '');
            else this._awaitProvider(link);
            this._wake();
        }).catch((error) => {
            if (this._live(link)) this._reconnect(link, error.message);
        });
    }
    _reconnect(link, error) {
        this._statusAll('error', error);
        this._bm3Link(null, error);
        link.retryAt = Date.now() + RECONNECT_MS;
        this._dispose(link); this._wake();
    }
    _schedule(delay) {
        this.timer = setTimeout(() => this._wake(), Math.max(1, delay));
        if (this.timer.unref) this.timer.unref();
    }
    _wake() {
        clearTimeout(this.timer); this.timer = null;
        if (this.closed || !this.groups.length && !this.control && !this.bm3Listener && !this.bm3Queue.length) return;
        if (this.ctx.preview || !this.signals.hasNative()) {
            this._statusAll('unavailable', this.ctx.preview ? 'Preview has no live diagnostic feed' : 'SOME/IP native module unavailable');
            return;
        }
        const now = Date.now();
        if (this.link && this.link.retryAt) {
            if (now < this.link.retryAt) { this._schedule(this.link.retryAt - now); return; }
            this.link = null;
        }
        if (!this.link) { this._open(); return; }
        if (!this._live(this.link) || !this.link.ready || !this.link.diag.available || this.pending) return;
        if (now < this.busyUntil) { this._schedule(this.busyUntil - now); return; }
        if (this.control && this.control.request) {
            const request = this.control.request; this.control.request = null;
            if (this.control.cancelled || this.control.generation !== this.generation) {
                request.reject(new Error('Exhaust control cancelled')); return;
            }
            this._request(request); return;
        }
        while (this.bm3Queue.length && !this.bm3Queue[0].canDispatch()) {
            this.bm3Queue.shift().reject(Object.assign(new Error('Diagnostic request cancelled'), { kind: 'cancelled' }));
        }
        const needBoost = this.groups.length && this.model.boostFromDme();
        const groups = this.groups.filter((group) => (!group.boost || needBoost) && group.entries.some(({ d }) =>
            !d.fallbackFor || this.model.state(this.model.definitions[d.fallbackFor]).state !== 'live'));
        // Check notification freshness while the corresponding diagnostic reads are paused.
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
        // Alternate when both readers have work. The BM3 queue is FIFO across its
        // banks and groups, so setup traffic cannot jump ahead of a ready poll.
        if (this.bm3Queue.length && (!due || this.preferBm3)) {
            this.preferBm3 = false;
            this._request(this.bm3Queue.shift());
        } else if (due) {
            this.preferBm3 = true;
            this._request(due, this._dueBatch(due, groups, now));
        } else if (Number.isFinite(nextAt)) this._schedule(nextAt - now);
    }
    _payloadFits(group, length) {
        return Number.isSafeInteger(length) && group.entries.every(({ config: c }) =>
            length >= requiredPayload(c) && (c.exactBytes === undefined || length === c.exactBytes));
    }
    _batchable(group) {
        return (group.focusedFast || group.statusPoll) && group.batchReady && group.sid === 0x22 && !group.candidates &&
            !this.noBatch.has(group.target + ':' + group.pollMs) && this._payloadFits(group, this.lengths.get(group.key));
    }
    _dueBatch(first, groups, now) {
        if (!this._batchable(first)) return [first];
        const batch = [first], seen = new Set([first.key]);
        groups.filter((group) => group !== first && group.target === first.target && group.pollMs === first.pollMs && group.nextAt <= now &&
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
        const statusRead = group.statusPoll;
        const requestMs = group.bm3 ? group.timeoutMs : group.focusedFast ? FAST_REQUEST_MS : statusRead ? STATUS_REQUEST_MS : REQUEST_MS;
        const startedAt = Date.now();
        const op = { link, group, groups, batch, startedAt, generation: this.generation, epoch: link.epoch, expiresAt: startedAt + requestMs,
            sent: false, dispatched: false, sendSettled: false, accepted: false, answer: null, done: false, timer: null };
        this.pending = op;
        const echo = group.sid === 0x23 ? [] : group.sid === 0x2C || group.control && group.sid === 0x2F ? params.slice(0, 3) : params;
        const answer = (result) => {
            if (op.done || op.answer || !op.dispatched || this.pending !== op || !this._live(op.link) ||
                Date.now() >= op.expiresAt) return;
            op.answer = result;
            if (op.accepted) this._finish(op, result.error, result);
        };
        op.onFrame = (frame) => {
            if (frame.ecu !== group.target) return;
            const uds = frame.uds;
            if (!Array.isArray(uds) || !uds.length) return;
            const negative = uds[0] === 0x7F && uds[1] === group.sid;
            const positive = uds[0] === group.sid + 0x40 && (batch || echo.every((value, index) => uds[index + 1] === value));
            if (!negative && !positive) return;
            if (!uds.every(byte) || (negative && uds.length < 3)) {
                answer({ error: { state: 'invalid', kind: 'payload', note: 'Malformed diagnostic response' } });
            } else if (negative) {
                if (uds[2] === 0x78) return; // Pending never extends the hard request deadline.
                if (group.bm3) {
                    answer({ ecu: frame.ecu, uds: uds.slice() });
                    return;
                }
                answer({ error: { state: [0x11, 0x12, 0x31].includes(uds[2]) ? 'unavailable' : 'error',
                    busy: uds[2] === 0x21,
                    note: 'Diagnostic NRC 0x' + hex(uds[2]) + ': ' + (NRC[uds[2]] || 'request rejected') } });
            } else if (batch) {
                const replies = this._splitBatch(groups, frame);
                answer(replies ? { replies } : { error: { state: 'invalid', note: 'Malformed or incomplete multi-DID diagnostic response' } });
            } else answer({ ecu: frame.ecu, uds: uds.slice() });
        };
        op.onError = (error) => {
            if (group.bm3 && (error === 'REQUEST_PENDING' || error === '1')) return;
            answer({ error: { state: 'error', kind: 'transport', busy: transportBusy(error), note: 'Diagnostic transport: ' + error } });
        };
        op.onReject = (code) => answer({ error: {
            state: 'error', kind: 'transport', note: 'TASU rejected diagnostic request: 0x' + hex(code),
        } });
        diag.on('frame', op.onFrame); diag.on('tasError', op.onError); diag.on('tasReject', op.onReject);
        op.timer = setTimeout(() => this._finish(op, { state: 'unavailable', kind: 'timeout',
            note: 'No diagnostic response from ECU 0x' + hex(group.target) + ' within ' + requestMs + ' ms' }), requestMs);
        // BM3 and focused reads retry through the scheduler so they can release
        // the request slot while waiting to try again.
        const options = group.bm3 || group.focusedFast || statusRead ? { maxRetries: 0, callTimeoutMs: requestMs } : undefined;
        Promise.resolve().then(() => {
            if (!this._current(op) || op.done || Date.now() >= op.expiresAt) throw new Error('Diagnostic request cancelled');
            return diag.send(group.target, group.sid, params, options);
        }).then((verdict) => {
            op.sendSettled = true;
            op.verdict = verdict;
            if (op.done) { this._release(op); return; }
            if (!['NO_ERROR', 'REQUEST_PENDING', '0', '1'].includes(verdict)) {
                this._finish(op, { state: 'error', kind: 'verdict', busy: transportBusy(verdict),
                    note: 'Diagnostic transport refused: ' + verdict }); return;
            }
            op.accepted = true;
            if (op.answer) this._finish(op, op.answer.error, op.answer);
        }, (error) => {
            op.sendSettled = true;
            if (op.done) this._release(op);
            else this._finish(op, { state: 'error', kind: error && error.kind || 'send', note: error && error.message || String(error) });
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
        if (op.group.bm3) {
            op.result = { error: error || (!current ? { kind: 'connection', note: 'Diagnostic provider disconnected' } : null),
                reply, at: now };
            if (error && error.busy) this.busyUntil = now + BUSY_RETRY_MS;
            this._release(op);
            return;
        }
        let align = false;
        if (current && (op.group.focusedFast || op.group.statusPoll) && error && error.busy) this.busyUntil = now + BUSY_RETRY_MS;
        if (current && op.batch && error) {
            // A failed multi-read says nothing about individual DID support. Disable
            // batching for this ECU and cadence and leave the members due for single-read retries.
            this.noBatch.add(op.group.target + ':' + op.group.pollMs);
            op.groups.forEach((group) => {
                group.batchReady = false;
                this._status(group, error.state, 'Batch failed; retrying individually: ' + error.note);
                group.nextAt = Math.min(group.nextAt, now);
            });
        } else if (current) {
            op.groups.forEach((group) => {
                if (group.control) return;
                const part = op.batch ? reply.replies.find((entry) => entry.group === group).reply : reply;
                let delivered = false;
                if (error) this._status(group, error.state, error.note);
                else if (part) delivered = this._deliver(group, part);
                const cadence = group.pollMs, retryMs = group.statusPoll ? STATUS_RETRY_MS : 5000;
                if (group.focusedFast || group.statusPoll) {
                    // Success is start-to-start, not a cooldown after the response.
                    // A late response makes the next request due immediately, never overlaps it.
                    group.nextAt = error ? now + (error.busy ? BUSY_RETRY_MS : retryMs) : op.startedAt + cadence;
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
                    group.nextAt = now + Math.max(error ? retryMs : 50, cadence);
                }
                if (group.candidates) {
                    if (!error && delivered) {
                        const { d } = group.entries[0];
                        if (!d.selectDiagCandidates) this.picks[d.id] = group.pick;
                        group.failedCandidates = 0;
                    } else if (!(group.statusPoll && error && error.busy)) {
                        this._choose(group, (group.pick + 1) % group.candidates.length);
                        group.failedCandidates++;
                        group.nextAt = now + (group.failedCandidates < group.candidates.length ? 50 : Math.max(retryMs, cadence));
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
                const siblings = this.groups.filter((group) => group.target === op.group.target &&
                    group.pollMs === op.group.pollMs && this._batchable(group));
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
        if (op.group.bm3) {
            const { error, reply, at } = op.result;
            const details = { dispatched: op.dispatched, verdict: op.verdict,
                queueMs: Math.max(0, op.startedAt - op.group.queuedAt), elapsedMs: Math.max(0, at - op.startedAt) };
            if (error) op.group.reject(Object.assign(new Error(error.note), details, { kind: error.kind, busy: error.busy }));
            else op.group.resolve(Object.assign(reply, details));
            // Give a completed BM3 worker a chance to enqueue cleanup or its next
            // step before selecting the next regular diagnostic request.
            setImmediate(() => this._wake());
            return;
        }
        this._wake();
    }
    close() {
        if (this.closed) return;
        this.closed = true; this.generation++;
        clearTimeout(this.timer); this.timer = null; this.groups = [];
        this._bm3Link(null, 'Diagnostic service closed');
        if (this.control) {
            this.control.cancelled = true;
            if (this.control.request) this.control.request.reject(new Error('Exhaust control closed'));
        }
        if (this.pending) this._finish(this.pending);
        if (this.link) this._dispose(this.link);
    }
}
module.exports = { DiagnosticServices };

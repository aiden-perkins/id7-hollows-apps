'use strict';
const D = require('./domain');

function message(error) { return error && error.message ? error.message : String(error); }
function deadline(promise, ms, label, expired) {
    let timer;
    return Promise.race([Promise.resolve(promise), new Promise((resolve, reject) => {
        timer = setTimeout(() => { if (expired) expired(); reject(new Error(label + ' timed out; no automatic retry')); }, ms);
    })]).then((value) => { clearTimeout(timer); return value; }, (error) => { clearTimeout(timer); throw error; });
}
function bytes(value) {
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Array.prototype.slice.call(value);
    if (Array.isArray(value)) return value.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255) ? value.slice() : [];
    if (value && Array.isArray(value.data)) return bytes(value.data);
    return [];
}
const NRC = { 0x10: 'General reject', 0x11: 'Service not supported', 0x12: 'Subfunction not supported', 0x13: 'Incorrect length',
    0x21: 'Busy', 0x22: 'Conditions not correct', 0x31: 'Request out of range', 0x33: 'Security access denied',
    0x78: 'Response pending', 0x7E: 'Subfunction unavailable in session', 0x7F: 'Service unavailable in session' };
const TASU = ['NO_ERROR', 'REQUEST_PENDING', 'TAS_CONNECTION_ERROR', 'TIMEOUT_ERROR', 'DEACTIVATED', 'INVALID_REQUEST',
    'INVALID_LENGTH', 'APP_REQUEST_TEMPORARILY_NOT_ACCEPTED', 'INVALID_SESSION', 'EXCLUSIVE_MODE_REQUESTED',
    'EXCLUSIVE_MODE_OCCUPIED', 'EXCLUSIVE_MODE_ACTIVE', 'EXCLUSIVE_MODE_PENDING', 'WRONG_IDENTIFIER'];
function verdict(value) {
    const raw = value && typeof value === 'object' ? value.TasuErrorEnum : value;
    return typeof raw === 'number' && Number.isInteger(raw) && TASU[raw] ? TASU[raw] : typeof raw === 'string' && TASU.indexOf(raw) >= 0 ? raw : null;
}

class Services {
    constructor(ctx, lab) {
        this.ctx = ctx; this.lab = lab; this.signals = ctx.signals;
        this.connections = {}; this.closed = false; this.serial = 0; this.starting = null; this.refreshing = null;
        this.polling = false; this.lastPoll = 0; this.diagBusy = false; this.diagBlocked = false; this.pending = null; this.diagSequence = 0;
        this.timer = setInterval(() => this.tick(), 250);
        if (this.timer.unref) this.timer.unref();
    }
    alive(c) { return !!c && !this.closed && !c.closed && this.connections[c.def.key] === c; }
    epoch(key) { const c = this.connections[key]; return this.alive(c) ? c.serial + ':' + c.epoch : null; }
    available(key) { const c = this.connections[key]; return !!(this.alive(c) && c.proxy && c.available === true); }
    state(c, available, detail) {
        if (!this.alive(c)) return;
        if (c.available !== available) c.epoch++;
        c.available = available;
        this.lab.connection(c.def.key, available, detail, this.epoch(c.def.key));
        if (c.def.key === 'tasu' && available !== true && this.pending) {
            this.finishDiagnostic({ status: 'provider-lost', detail: 'TASU provider changed; reply outcome unknown' }, true);
        }
    }
    async start() {
        if (this.closed) throw new Error('xDrive services are closed');
        if (this.starting) return this.starting;
        this.starting = Promise.all(D.SERVICES.map((def) => this.open(def).catch((error) => {
            this.lab.record('service-error', def.label + ': ' + message(error));
        })));
        try { return await this.starting; } finally { this.starting = null; }
    }
    async open(def) {
        const old = this.connections[def.key];
        if (this.alive(old)) return old;
        const c = { def, serial: ++this.serial, epoch: 0, available: null, proxy: null, closed: false,
            ready: false, fetching: false, fetchedAt: 0, queue: Promise.resolve(), sending: false };
        this.connections[def.key] = c;
        this.state(c, null, 'Proxy not yet connected; provider unknown');
        if (this.ctx.preview || !this.signals || (this.signals.hasNative && !this.signals.hasNative())) {
            this.state(c, false, this.ctx.preview ? 'PREVIEW: no vehicle connection' : 'Native SOME/IP module unavailable');
            return c;
        }
        try {
            const opening = Promise.resolve(this.signals.proxy(def.iface, def.instance));
            opening.then((proxy) => { if (!this.alive(c)) this.shutdown(proxy); }, () => {});
            c.proxy = await deadline(opening, 5000, def.label + ' proxy');
            if (!this.alive(c)) throw new Error('Closed while connecting');
            await deadline(this.signals.onAvailable(c.proxy, (offered) => {
                if (!this.alive(c)) return;
                this.state(c, offered === true ? true : offered === false ? false : null,
                    offered === true ? 'Provider offered; individual field results are separate' : offered === false ? 'Provider not offered' : 'Provider availability unknown');
            }), 2000, def.label + ' availability subscription');
            for (const spec of def.fields) {
                if (!this.alive(c)) break;
                if (!spec.notify) continue;
                try {
                    await deadline(this.signals.on(c.proxy, spec.name, (raw) => {
                        if (this.alive(c)) this.lab.receive(def.key, spec.name, raw, 'notification');
                    }, this.ctx.log), 2000, def.label + '.' + spec.name + ' subscription');
                    if (this.alive(c)) this.lab.subscriptionReady(def.key, spec.name);
                } catch (error) { this.lab.readError(def.key, spec.name, message(error), 'subscription'); }
            }
            for (const name of def.events || []) {
                if (!this.alive(c)) break;
                try {
                    await deadline(this.signals.on(c.proxy, name, (raw) => {
                        if (this.alive(c) && def.key === 'tasu') this.onDiagnostic(raw, c);
                    }, this.ctx.log), 2000, def.label + '.' + name + ' subscription');
                    this.lab.subscriptionReady(def.key, name);
                } catch (error) { this.lab.readError(def.key, name, message(error), 'subscription'); }
            }
            c.ready = true;
            return c;
        } catch (error) {
            if (this.alive(c)) this.state(c, false, 'Connection failed: ' + message(error));
            c.closed = true; c.epoch++; this.shutdown(c.proxy);
            throw error;
        }
    }
    async read(key, name) {
        const c = this.connections[key], spec = D.field(key, name);
        if (!spec || !spec.getter) throw new Error(key + '.' + name + ': notification-only or unknown field; no getter sent');
        if (!this.available(key)) throw new Error(key + ': provider is not offered');
        const operation = c.queue.then(async () => {
            const epoch = this.epoch(key);
            if (!this.alive(c) || !this.available(key)) throw new Error(key + ': provider lost before getter');
            let expired = false;
            const guarded = { getValue: (...args) => {
                if (expired || !this.alive(c) || this.epoch(key) !== epoch || !this.available(key)) throw new Error('Queued getter cancelled after timeout/provider change');
                return c.proxy.getValue.apply(c.proxy, args);
            } };
            try {
                const raw = await deadline(this.signals.get(guarded, name, 1200), 1800, key + '.' + name + ' getter', () => { expired = true; });
                if (!this.alive(c) || this.epoch(key) !== epoch || !this.available(key)) throw new Error('Provider changed during getter');
                this.lab.receive(key, name, raw, 'getter');
                return raw;
            } catch (error) { this.lab.readError(key, name, message(error), 'getter'); throw error; }
        });
        c.queue = operation.catch(() => {});
        return operation;
    }
    async fetch(c) {
        if (!this.alive(c) || !c.ready || !this.available(c.def.key) || c.fetching) return;
        c.fetching = true; c.fetchedAt = D.now();
        try {
            for (const spec of c.def.fields) {
                if (!this.alive(c)) break;
                if (spec.getter) { try { await this.read(c.def.key, spec.name); } catch (error) { /* Field-level failure is retained by read. */ } }
            }
        } finally { c.fetching = false; }
    }
    tick() {
        if (this.closed) return;
        const now = D.now();
        if (!this.lab.busy && this.lab.armRemaining() <= 0) {
            Object.keys(this.connections).forEach((key) => {
                const c = this.connections[key];
                if (this.alive(c) && c.ready && !c.fetching && now - c.fetchedAt >= 1500) this.fetch(c).catch(() => {});
            });
        }
        if (this.polling && !this.diagBusy && !this.lab.busy && this.lab.armRemaining() <= 0 && now - this.lastPoll >= 1000) {
            this.lastPoll = now;
            this.probe(0x19, 0xDB32).then((result) => {
                this.lastPoll = D.now();
                if (result.status !== 'positive') this.setLmvPolling(false);
            }, (error) => {
                this.lastPoll = D.now(); this.setLmvPolling(false);
                this.lab.record('diagnostic-poll-stopped', message(error));
            });
        }
    }
    async refresh() {
        if (this.closed) throw new Error('xDrive services are closed');
        if (this.refreshing) return this.refreshing;
        this.refreshing = (async () => {
            const errors = [];
            for (const def of D.SERVICES) {
                if (!this.available(def.key)) continue;
                for (const spec of def.fields) {
                    if (spec.getter) { try { await this.read(def.key, spec.name); } catch (error) { errors.push(def.key + '.' + spec.name + ': ' + message(error)); } }
                }
            }
            return { errors, detail: 'Only real catalog getters refreshed; notification-only fields retain their actual receive times.' };
        })();
        try { return await this.refreshing; } finally { this.refreshing = null; }
    }
    async refreshSafety() {
        const fields = [ ['vehicle', 'statusCarSpeed2'], ['engine', 'statusHandBrake'], ['fes', 'statusDSCSwitchHMI'],
            ['mdrive', 'controlDisplayMSystemsMDrive'], ['rsu', 'isRsuSessionActive'], ['mdrive', 'statusMSystem'] ];
        const errors = [];
        for (const pair of fields) {
            try { await this.read(pair[0], pair[1]); } catch (error) { errors.push(pair.join('.') + ': ' + message(error)); }
        }
        if (errors.length) throw new Error('Safety getter failure: ' + errors.join(' | '));
    }
    async sendNative(request) {
        if (this.ctx.preview) throw new Error('Preview prohibits native MDrive writes');
        if (!request || JSON.stringify(request) !== JSON.stringify(D.nativeRequest(request.backendId, request.modeId))) throw new Error('Only a complete catalog-built MDrive request is permitted');
        const c = this.connections.mdrive;
        if (!this.available('mdrive') || !this.alive(c)) throw new Error('MDrive provider is not offered');
        if (this.diagBusy || c.sending) throw new Error('An earlier diagnostic or native request is unresolved');
        this.lab.dispatchGuard(request);
        const epoch = this.epoch('mdrive');
        let invoked = false, expired = false;
        const guarded = { setValue: (...args) => {
            if (expired || invoked || !this.alive(c) || this.epoch('mdrive') !== epoch || !this.available('mdrive')) throw new Error('Queued MDrive request cancelled; provider changed, permit expired or request already invoked');
            this.lab.dispatchGuard(request, true);
            invoked = true;
            return c.proxy.setValue.apply(c.proxy, args);
        } };
        c.sending = true;
        let operation;
        try { operation = Promise.resolve(this.signals.set(guarded, request.field, request.value, 2000)); }
        catch (error) { c.sending = false; this.lab.disarm('Native dispatch failed'); throw error; }
        operation.then(() => { c.sending = false; }, () => { c.sending = false; });
        try {
            const reply = await deadline(operation, 2800, 'Native MDrive request', () => {
                expired = true; this.lab.disarm('Native request timed out; outcome unknown');
            });
            if (!invoked || !this.alive(c) || this.epoch('mdrive') !== epoch || !this.available('mdrive')) throw new Error('Native request was not invoked or provider changed; outcome unconfirmed');
            return reply;
        } catch (error) { expired = true; this.lab.disarm('Native request failed or timed out; no retry'); throw error; }
    }
    diagnostic(event) { this.lab.diagnostic(Object.assign({ at: Date.now(), monoMs: D.now() }, event)); }
    onDiagnostic(raw, c) {
        const frame = bytes(raw && raw.udsResponse), declaredLength = raw && raw.udsResponseLength;
        const pending = this.pending, capturedAt = D.now();
        const event = { kind: 'response', envelope: raw, bytes: frame, declaredLength, epoch: this.epoch('tasu'),
            requestId: pending ? pending.id : null, attribution: 'unattributed',
            correlationLimit: 'ECU/SID/echoed DID matching only; TASU provides no end-to-end request token. Other tools may share the bus.' };
        const error = raw && raw.errorCode;
        if (error === 1 || error === 'REQUEST_PENDING') {
            event.attribution = 'transport-pending-unattributed'; this.diagnostic(event); return;
        }
        if (error !== undefined && error !== 0 && error !== 'NO_ERROR') {
            event.attribution = 'transport-error-unattributed'; event.detail = String(error); this.diagnostic(event);
            if (pending) this.finishDiagnostic({ status: 'transport-error', detail: String(error), response: event }, true);
            return;
        }
        if (frame.length < 10 || (declaredLength !== undefined && declaredLength !== frame.length)) {
            event.attribution = 'malformed-or-unsupported-envelope';
            event.detail = 'Expected existing runtime envelope layout: ECU byte 6, UDS from byte 9; full raw frame retained.';
            this.diagnostic(event); return;
        }
        const target = frame[6], uds = frame.slice(9);
        event.target = target; event.uds = uds;
        if (!pending || pending.epoch !== this.epoch('tasu') || !this.alive(c) || capturedAt < pending.startedMono || target !== pending.request.target) {
            this.diagnostic(event); return;
        }
        if (capturedAt > pending.deadlineMono) {
            event.attribution = 'late-response'; this.diagnostic(event);
            this.finishDiagnostic({ status: 'timeout', detail: 'Response arrived outside its monotonic deadline; not accepted as current evidence' }, true);
            return;
        }
        const request = pending.request;
        const negative = uds.length >= 3 && uds[0] === 0x7F && uds[1] === request.sid;
        const positive = uds[0] === request.sid + 0x40 && (request.sid === 0x22
            ? uds.length >= 3 && uds[1] === request.data[0] && uds[2] === request.data[1]
            : uds.length >= 3 && uds[1] === 0x02);
        if (!negative && !positive) { this.diagnostic(event); return; }
        event.attribution = 'matched-ecu-sid-did'; event.latencyMs = capturedAt - pending.startedMono;
        if (negative) { event.nrc = uds[2]; event.nrcText = NRC[uds[2]] || 'Unknown NRC'; }
        if (positive && request.sid === 0x22) {
            event.payload = uds.slice(3);
            if (request.target === 0x19 && request.did === 0xDB32) event.lmv = D.decodeLmv(event.payload);
        }
        if (positive && request.sid === 0x19) {
            event.dtcStatusAvailabilityMask = uds[2]; event.dtcs = [];
            if ((uds.length - 3) % 4 === 0) {
                for (let at = 3; at < uds.length; at += 4) event.dtcs.push({ codeBytes: uds.slice(at, at + 3), status: uds[at + 3] });
            } else event.dtcDecodeIssue = 'Incomplete DTC record; use raw bytes, not a fabricated fault list.';
        }
        this.diagnostic(event);
        if (negative && uds[2] === 0x78) {
            const remaining = 15000 - (capturedAt - pending.startedMono);
            if (remaining <= 0) this.finishDiagnostic({ status: 'timeout', detail: 'Maximum response-pending window elapsed' }, true);
            else {
                clearTimeout(pending.timer);
                pending.deadlineMono = capturedAt + Math.min(5000, remaining);
                pending.timer = setTimeout(() => this.finishDiagnostic({ status: 'timeout', detail: 'Response-pending window elapsed; late replies remain unattributed' }, true), Math.min(5000, remaining));
            }
            return;
        }
        pending.response = event; pending.responseStatus = negative ? 'negative' : 'positive';
        if (pending.verdictAccepted) this.finishDiagnostic({ status: pending.responseStatus, response: event });
    }
    finishDiagnostic(result, quarantine) {
        const pending = this.pending;
        if (!pending) return;
        clearTimeout(pending.timer); this.pending = null; this.diagBusy = false;
        if (quarantine) { this.diagBlocked = true; this.polling = false; }
        result = Object.assign({ requestId: pending.id, request: pending.request, transportVerdict: pending.verdict,
            elapsedMs: D.now() - pending.startedMono, epoch: pending.epoch,
            correlationLimit: 'Matched ECU/SID/DID is not proof of request ownership or physical drivetrain behavior.' }, result);
        this.diagnostic({ kind: 'result', result });
        pending.resolve(result);
    }
    async request(request) {
        if (this.ctx.preview) throw new Error('Preview has no diagnostic vehicle connection');
        if (this.closed || !this.available('tasu')) throw new Error('TASU provider is not offered');
        if (this.diagBusy || this.lab.armRemaining() > 0 || this.connections.mdrive && this.connections.mdrive.sending) throw new Error('Diagnostics blocked during another request or native arming');
        if (this.diagBlocked) throw new Error('Diagnostic timeout/provider failure quarantine: explicitly reconnect services before another request');
        const expected = request.sid === 0x22 ? D.readRequest(request.target, request.did) : D.faultRequest(request.target);
        if (JSON.stringify(request) !== JSON.stringify(expected)) throw new Error('Only a validated single-DID read or read-DTC request is allowed');
        const c = this.connections.tasu, epoch = this.epoch('tasu');
        const pending = { id: 'diag-' + (++this.diagSequence), request, epoch, startedMono: D.now(),
            verdict: null, verdictAccepted: false, response: null, timer: null, resolve: null, invoked: false };
        const completed = new Promise((resolve) => { pending.resolve = resolve; });
        pending.deadlineMono = pending.startedMono + 5000;
        this.pending = pending; this.diagBusy = true;
        this.diagnostic({ kind: 'request', requestId: pending.id, request, sourceAddress: 0xF2, epoch });
        const params = { sourceAddress: 0xF2, targetAddress: request.target, serviceID: request.sid, subroutineID: 0,
            udsDataLength: request.data.length, udsData: Buffer.from(request.data), deadlockTime: 0 };
        pending.timer = setTimeout(() => this.finishDiagnostic({ status: 'timeout', detail: 'No correlated final reply; no retry and diagnostic polling stopped' }, true), 5000);
        const guarded = { callMethod: (...args) => {
            if (this.pending !== pending || !this.alive(c) || this.epoch('tasu') !== epoch || !this.available('tasu') || pending.invoked || this.lab.armRemaining() > 0) throw new Error('Queued read request cancelled after timeout/provider change/arming');
            pending.invoked = true;
            this.diagnostic({ kind: 'invoked', requestId: pending.id, sourceAddress: 0xF2, request, params, epoch });
            return c.proxy.callMethod.apply(c.proxy, args);
        } };
        try {
            const reply = await deadline(this.signals.call(guarded, 'sendTasuRequest', params, 4000), 4500, 'TASU transport call');
            const accepted = verdict(reply);
            this.diagnostic({ kind: 'verdict', requestId: pending.id, raw: reply, verdict: accepted });
            if (this.pending === pending) {
                pending.verdict = accepted;
                pending.verdictAccepted = accepted === 'NO_ERROR' || accepted === 'REQUEST_PENDING';
                if (!pending.verdictAccepted) this.finishDiagnostic({ status: 'refused', detail: accepted || 'Unknown/missing transport verdict; not assumed successful' });
                else if (pending.response) this.finishDiagnostic({ status: pending.responseStatus, response: pending.response });
            }
        } catch (error) {
            if (this.pending === pending) this.finishDiagnostic({ status: 'transport-error', detail: message(error) }, true);
            else this.diagnostic({ kind: 'late-transport-error', requestId: pending.id, detail: message(error) });
        }
        return completed;
    }
    probe(target, did) { return this.request(D.readRequest(target, did)); }
    async identifyAll() {
        const results = [];
        for (const ecu of D.ECUS) {
            results.push(await this.probe(ecu.address, 0xF150));
            if (this.diagBlocked || this.closed) break;
        }
        return results;
    }
    async readFaultsAll() {
        const results = [];
        for (const ecu of D.ECUS) {
            results.push(await this.request(D.faultRequest(ecu.address)));
            if (this.diagBlocked || this.closed) break;
        }
        return results;
    }
    setLmvPolling(on) {
        if (on && (this.ctx.preview || this.closed || this.diagBlocked || !this.available('tasu') || this.lab.armRemaining() > 0 || this.lab.busy)) throw new Error('LMV polling requires offered live TASU, no arming/action and no diagnostic quarantine');
        const changed = this.polling !== !!on;
        this.polling = !!on;
        if (changed) this.lab.record('diagnostic-polling', on ? 'LMV DB32 read polling explicitly enabled; at most one request per second after completion' : 'LMV polling stopped; no automatic resume');
    }
    async retry() {
        if (this.closed || this.starting) throw new Error('Services are closed or still connecting');
        if (this.lab.busy || this.lab.trial || this.diagBusy) throw new Error('Reconnect blocked during an action, diagnostic request or unresolved native trial');
        this.lab.disarm('Explicit reconnect'); this.setLmvPolling(false);
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
        this.connections = {}; this.diagBlocked = false;
        this.lab.record('diagnostic-reconnect', 'Operator explicitly recreated providers after any quarantine; old replies are not promoted to current observations.');
        return this.start();
    }
    shutdown(proxy) {
        if (!proxy || !proxy.shutdown) return;
        try { Promise.resolve(proxy.shutdown()).catch(() => {}); } catch (error) { /* Teardown never sends a vehicle control. */ }
    }
    dispose(c) { if (c) { c.closed = true; c.epoch++; this.shutdown(c.proxy); } }
    close() {
        if (this.closed) return;
        this.setLmvPolling(false);
        if (this.pending) this.finishDiagnostic({ status: 'closed', detail: 'App closed; no retry/replay' }, true);
        this.closed = true; clearInterval(this.timer);
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
    }
}
module.exports = { Services };

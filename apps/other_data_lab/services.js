'use strict';
const { catalog, decode, bytes, now, hex } = require('./model');
const TASU = 'com.harman.infotainment.systemfunctions.tasu.tasu.InternalTasu';
const INSTANCE = 'SystemFunctionsInternalTasuInst1';
const verdicts = ['NO_ERROR', 'REQUEST_PENDING', 'TAS_CONNECTION_ERROR', 'TIMEOUT_ERROR', 'DEACTIVATED', 'INVALID_REQUEST',
    'INVALID_LENGTH', 'APP_REQUEST_TEMPORARILY_NOT_ACCEPTED', 'INVALID_SESSION', 'EXCLUSIVE_MODE_REQUESTED',
    'EXCLUSIVE_MODE_OCCUPIED', 'EXCLUSIVE_MODE_ACTIVE', 'EXCLUSIVE_MODE_PENDING', 'WRONG_IDENTIFIER'];
function deadline(promise, ms, name) {
    let timer;
    return Promise.race([Promise.resolve(promise), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(name + ' timed out')), ms);
    })]).then((v) => { clearTimeout(timer); return v; }, (e) => { clearTimeout(timer); throw e; });
}
class Services {
    constructor(ctx, model) {
        this.ctx = ctx; this.model = model; this.signals = ctx.signals;
        this.closed = false; this.connections = {}; this.enabled = false; this.quarantine = false;
        this.pending = null; this.inflight = false; this.identities = {}; this.serial = 0; this.enableEpoch = 0;
    }
    alive(c) { return !this.closed && !c.closed && this.connections[c.iface] === c; }
    shutdown(proxy) {
        if (proxy && proxy.shutdown) Promise.resolve().then(() => proxy.shutdown()).catch((e) => this.ctx.log.warn('Proxy shutdown: ' + e));
    }
    state(c, offered, detail) {
        if (!this.alive(c)) return;
        if (c.available !== offered) c.epoch++;
        c.available = offered;
        this.model.providers[c.iface] = { available: offered, epoch: c.epoch, detail, at: Date.now() };
        this.model.record('provider', { iface: c.iface, available: offered, epoch: c.epoch, detail });
        if (c.iface === TASU && offered !== true) {
            this.identities = {};
            if (this.pending) this.finish('provider-lost', 'TASU provider changed; no retry', true);
        }
    }
    async open(iface, instance, definitions) {
        const existing = this.connections[iface];
        if (existing && this.alive(existing)) return existing;
        const c = { iface, epoch: ++this.serial, available: null, proxy: null, ready: false, closed: false };
        this.connections[iface] = c;
        this.state(c, null, 'Connecting');
        if (this.model.preview || !this.signals.hasNative()) {
            this.state(c, false, this.model.preview ? 'PREVIEW: no real provider opened' : 'Native module unavailable'); return c;
        }
        try {
            const opening = Promise.resolve(this.signals.proxy(iface, instance));
            opening.then((proxy) => { if (!this.alive(c)) this.shutdown(proxy); }, () => {});
            c.proxy = await deadline(opening, 5000, 'Provider connect');
            if (!this.alive(c)) return c;
            await deadline(this.signals.onAvailable(c.proxy, (available) => this.state(c, !!available,
                available ? 'Provider offered; individual field support is separate' : 'Provider unavailable')), 2000, 'Availability subscription');
            for (const def of definitions) {
                if (!this.alive(c)) return c;
                await deadline(this.signals.on(c.proxy, def.field, (raw) => {
                    if (this.alive(c)) this.model.nativeSample(def, raw, c);
                }, this.ctx.log), 2000, 'Notification subscription');
            }
            if (iface === TASU) await deadline(this.signals.on(c.proxy, 'sendTasuResponse', (raw) => {
                if (this.alive(c)) this.response(raw, c);
            }, this.ctx.log), 2000, 'TASU response subscription');
            c.ready = true; return c;
        } catch (error) {
            if (this.alive(c)) this.state(c, false, String(error.message || error));
            c.closed = true; this.shutdown(c.proxy); throw error;
        }
    }
    async start() {
        const interfaces = Array.from(new Set(catalog.native.map((d) => d.iface)));
        await Promise.all(interfaces.map((iface) => this.open(iface, '1', catalog.native.filter((d) => d.iface === iface))
            .catch((error) => this.model.record('native-error', { iface, error: String(error.message || error) }))));
    }
    async enable() {
        if (this.closed || this.model.preview) throw new Error('Preview/closed app prohibits real diagnostics');
        if (this.quarantine || this.inflight) throw new Error('Diagnostic quarantine/unsettled call: stop other tools and restart this app after work has drained');
        const enableEpoch = this.enableEpoch;
        const c = await this.open(TASU, INSTANCE, []);
        if (!this.alive(c) || !c.ready || enableEpoch !== this.enableEpoch) throw new Error('TASU connection unavailable or enable cancelled');
        this.enabled = true;
        this.model.notice = 'Read-only diagnostics ENABLED. Identify the selected ECU first; no background polling.';
        this.model.record('diagnostics-enabled', { epoch: c.epoch });
    }
    disable() {
        this.enabled = false; this.enableEpoch++;
        if (this.pending) this.finish('disabled', 'Disabled while a read was pending; late reply cannot become current data', true);
        this.model.record('diagnostics-disabled', {});
    }
    status() {
        const c = this.connections[TASU];
        return { enabled: this.enabled, quarantine: this.quarantine, inflight: this.inflight, busy: !!this.pending,
            provider: c && this.alive(c) ? c.available : false, epoch: c && c.epoch, identities: this.identities,
            pending: this.pending && { id: this.pending.id, target: this.pending.target, did: this.pending.did, startedMono: this.pending.startedMono } };
    }
    finish(status, detail, quarantine) {
        const p = this.pending;
        if (!p) return;
        clearTimeout(p.timer); this.pending = null;
        if (quarantine) { this.quarantine = true; this.enabled = false; this.identities = {}; }
        const result = { status, detail, requestId: p.id, target: p.target, did: p.did, epoch: p.epoch,
            transportVerdict: p.verdict, response: p.response || null, elapsedMs: now() - p.startedMono,
            correlation: 'ECU/SID/echoed DID only; no end-to-end ownership token. Do not share diagnostics with other tools.' };
        if (status === 'positive' && p.response) {
            result.uds = p.response.uds; result.payload = result.uds.slice(3);
            if (p.probe) result.decoded = decode(p.probe, result.payload);
            else {
                const expected = catalog.ecus.find((e) => e.target === p.target);
                const index = result.payload.slice(0, 3).map((v) => hex(v)).join('');
                result.identity = { expected: expected.historicalIndex, observed: index, matched: result.payload.length >= 3 && index === expected.historicalIndex,
                    note: 'SGBD family-index match only; not a SWFL/version or physical validation.' };
                this.identities[p.target] = { matched: result.identity.matched, index, epoch: p.epoch };
            }
        }
        if (p.probe) this.model.result(p.probe, result, false);
        else this.model.record('identity-result', result);
        p.resolve(result);
    }
    response(raw, c) {
        const frame = bytes(raw && raw.udsResponse), p = this.pending;
        const event = { envelope: raw, bytes: frame, epoch: c.epoch, attribution: 'unattributed', requestId: p && p.id };
        const error = raw && raw.errorCode;
        if (error === 1 || error === 'REQUEST_PENDING') {
            event.attribution = 'unattributed-transport-pending'; this.model.record('frame', event); return;
        }
        if (error !== undefined && error !== 0 && error !== 'NO_ERROR') {
            event.attribution = 'unattributed-transport-error'; this.model.record('frame', event);
            if (p) this.finish('transport-error', String(error), true); return;
        }
        if (frame && frame.length >= 5 && frame[2] === 0x7F) {
            event.attribution = 'unattributed-TASU-rejection'; this.model.record('frame', event);
            if (p) this.finish('transport-rejected', 'TASU code 0x' + hex(frame[4]), true); return;
        }
        if (!frame || frame.length < 10 || (raw.udsResponseLength !== undefined && raw.udsResponseLength !== frame.length)) {
            event.attribution = 'malformed-envelope'; this.model.record('frame', event); return;
        }
        event.target = frame[6]; event.uds = frame.slice(9);
        if (!p || !p.invoked || p.response || p.target !== event.target || p.epoch !== c.epoch) { this.model.record('frame', event); return; }
        if (now() > p.expiresMono) {
            event.attribution = 'late'; this.model.record('frame', event); this.finish('timeout', 'Late response retained, not decoded', true); return;
        }
        const uds = event.uds;
        const positive = uds.length >= 3 && uds[0] === 0x62 && uds[1] === (p.did >> 8) && uds[2] === (p.did & 255);
        const negative = uds.length >= 3 && uds[0] === 0x7F && uds[1] === 0x22;
        if (!positive && !negative) { this.model.record('frame', event); return; }
        event.attribution = positive ? 'matched-ECU-SID-DID' : 'matched-ECU-SID-only-negative';
        if (negative) event.nrc = uds[2];
        this.model.record('frame', event);
        if (negative && uds[2] === 0x78) return; // Pending never extends the hard deadline.
        p.response = event; p.responseStatus = positive ? 'positive' : 'negative';
        if (p.accepted) this.finish(p.responseStatus, positive ? 'Positive reply; inspect layout/qualifiers separately' : 'ECU negative response NRC 0x' + hex(uds[2]), false);
    }
    async read(probe, target) {
        const known = probe && catalog.requests.find((r) => r.id === probe.id);
        if (probe && known !== probe) throw new Error('Only an exact catalog probe may be sent');
        const ecu = catalog.ecus.find((e) => e.target === (probe ? probe.target : target));
        if (!ecu) throw new Error('Unknown physical target');
        if (this.closed || this.model.preview || !this.enabled || this.quarantine || this.pending || this.inflight) throw new Error('Diagnostics disabled, preview, quarantined, or busy');
        const c = this.connections[TASU];
        if (!c || !this.alive(c) || !c.ready || c.available !== true) throw new Error('TASU provider not offered');
        const identity = this.identities[ecu.target];
        if (probe && (!identity || !identity.matched || identity.epoch !== c.epoch)) throw new Error('Read F150 first: current provider must match saved SGBD family index');
        const did = probe ? probe.did : 0xF150;
        if (!probe) delete this.identities[ecu.target];
        const p = { id: this.model.session + '-read-' + (++this.serial), probe, target: ecu.target, did, epoch: c.epoch,
            startedMono: now(), expiresMono: now() + 5000, invoked: false, accepted: false, response: null, verdict: null };
        const complete = new Promise((resolve) => { p.resolve = resolve; });
        this.pending = p; this.inflight = true;
        const params = { sourceAddress: 0xF2, targetAddress: p.target, serviceID: 0x22, subroutineID: 0,
            udsDataLength: 2, udsData: Buffer.from([did >> 8, did & 255]), deadlockTime: 0 };
        this.model.record('request', { id: p.id, target: p.target, did, epoch: p.epoch, params });
        p.timer = setTimeout(() => this.finish('timeout', '5-second hard deadline; no retry, no further reads this session', true), 5000);
        const guarded = { callMethod: (...args) => {
            if (this.pending !== p || p.invoked || this.closed || !this.enabled || c.epoch !== p.epoch || !this.alive(c) || c.available !== true || now() >= p.expiresMono) throw new Error('Queued read cancelled');
            p.invoked = true; return c.proxy.callMethod.apply(c.proxy, args);
        } };
        let sending;
        try { sending = Promise.resolve(this.signals.call(guarded, 'sendTasuRequest', params, 4000)); }
        catch (error) { sending = Promise.reject(error); }
        sending.then(() => { this.inflight = false; }, () => { this.inflight = false; });
        deadline(sending, 4500, 'TASU method').then((reply) => {
            const value = reply && typeof reply === 'object' ? reply.TasuErrorEnum : reply;
            const verdict = Number.isInteger(value) ? verdicts[value] : verdicts.includes(value) ? value : null;
            this.model.record('transport-verdict', { requestId: p.id, raw: reply, verdict });
            if (this.pending !== p) return;
            p.verdict = verdict; p.accepted = p.invoked && (verdict === 'NO_ERROR' || verdict === 'REQUEST_PENDING');
            if (!p.accepted) this.finish('refused', verdict || 'Missing/unknown transport verdict', true);
            else if (p.response) this.finish(p.responseStatus, 'Reply and transport verdict retained separately', false);
        }, (error) => {
            this.model.record('transport-error', { requestId: p.id, error: String(error.message || error) });
            if (this.pending === p) this.finish('transport-error', String(error.message || error), true);
        });
        return complete;
    }
    close() {
        if (this.closed) return;
        this.disable(); this.closed = true;
        Object.values(this.connections).forEach((c) => { c.closed = true; this.shutdown(c.proxy); });
    }
}
module.exports = { Services };

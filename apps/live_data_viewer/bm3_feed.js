'use strict';
const { Diag, hex } = require('./kit/diag');
const channels = require('./bm3_channels');
const catalog = require('./bm3_catalog');

// Recovered from Mobile_amd64.dll, SHA-256 recorded in bm3_catalog.js:
// 18103cec0: DID/position/width; 18103d2e0: address/size; 181049c20..18104a700: 2C/22.
// Ordinary values are BE (18103ef20); RAM uses cm.bigEndian (18103e5a0).
// This is a new scheduler, not the legacy viewer's scalar polling policy.
const DEADLINE_MS = 1200, FRESH_MS = 1500;
const POLL_RETRY_MS = 250, MAX_POLL_RETRIES = 3;
const ORDINARY_DID = 0xF300, RAM_DIDS = [0xF301, 0xF302];
const ROM_MARKER_BYTES = 255, ROM_READ_MS = 4500;
const ROM_READ_FALLBACK_NRCS = [0x11, 0x12, 0x13, 0x31];
const REPLY_ECHO_BYTES = { 0x22: 2, 0x23: 0, 0x2C: 3 };
const CORRECTION_IDS = [32, 33, 34, 35], STATUS_FRESH_MS = 6000;
const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
const word = (n) => [Math.floor(n / 256) & 255, n & 255];
const address = (n) => [Math.floor(n / 16777216) & 255, Math.floor(n / 65536) & 255,
    Math.floor(n / 256) & 255, n & 255];
function deadline(promise, ms, label) {
    let timer;
    return Promise.race([promise, new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).then((v) => { clearTimeout(timer); return v; }, (e) => { clearTimeout(timer); throw e; });
}
function positive(u) { return u && u[0] !== 0x7F; }
function retryable(error) {
    return error.nrc === 0x21 || /TEMPORARILY_NOT_ACCEPTED|BUSY|TIMED OUT|TIMEOUT/i.test(error.message || '');
}
function checked(u, length) {
    if (!u) throw new Error('Diagnostic response timed out');
    if (!positive(u)) {
        const error = new Error('UDS ' + hex(u[1]) + ' refused (NRC ' + hex(u[2]) + ')');
        error.nrc = u[2]; throw error;
    }
    if (length !== undefined && u.length !== length) throw new Error('Unexpected diagnostic payload length');
    return u;
}
const knownRom = (key) => Object.prototype.hasOwnProperty.call(catalog.roms, key);
function requireRom(key) {
    if (!key) throw new Error('Malformed BM3 CustomROM marker');
    if (!knownRom(key)) throw new Error('BM3 ROM ' + key + ' has no RAM channel catalog');
    return key;
}
function customRom(marker) {
    if (marker.startsWith('BM3_')) {
        // MG1 captures in live_adjustments have a 64- or 80-byte binary block, then ROM + five build characters.
        const delimiter = [68, 84].find((offset) => marker.startsWith('~|~', offset));
        if (delimiter !== undefined) {
            const tag = /^_+#([A-Z0-9]+)[A-Z0-9]{5}\x00/.exec(marker.slice(delimiter + 3));
            return requireRom(tag && tag[1]);
        }
        // The G87 S58 capture has its only '#' at byte 101, followed by ROM, build and vehicle fields.
        if (marker.indexOf('#') === 101 && marker.lastIndexOf('#') === 101) {
            const tag = /^#([A-Z0-9]{9})[A-Z0-9]{5}_[A-Z0-9_]*\x00/.exec(marker.slice(101));
            if (tag) return requireRom(tag[1]);
        }
    }
    if (marker.includes('BM3_R')) {
        const tags = Array.from(new Set(marker.match(/#[A-Za-z0-9]+/g) || []));
        if (tags.length !== 1) throw new Error('BM3 CustomROM marker has no unique ROM tag');
        const tag = tags[0].slice(1), key = tag.slice(0, -5);
        if (!knownRom(tag) && knownRom(key) && /^[A-Z0-9]{5}$/.test(tag.slice(-5))) return key;
        return requireRom(tag);
    }
    return null;
}
function scalar(d, ram) {
    if (![1, 2, 4].includes(d.bytes)) return false;
    if (!ram) return Number.isFinite(Number(d.factor)) && Number(d.div) !== 0 && Number.isFinite(Number(d.add));
    const cm = d.cm, c = cm && cm.coeffs;
    return !(d.m && d.m.arraySize > 1) && cm && cm.type === 'RAT_FUNC' && Array.isArray(c) && c.length === 6 &&
        c.every(Number.isFinite) && c[0] === 0 && c[3] === 0 && c[4] === 0 && c[1] !== 0;
}
function rawValue(bytes, at, d, ram) {
    let value = 0;
    const little = ram && !(d.cm && d.cm.bigEndian);
    for (let i = 0; i < d.bytes; i++) value = value * 256 + bytes[at + (little ? d.bytes - 1 - i : i)];
    if (d.signed && value >= Math.pow(2, d.bytes * 8 - 1)) value -= Math.pow(2, d.bytes * 8);
    // JS bitwise operations are signed; restore the full unsigned mask result.
    if (d.bitmask) value = ((value >>> 0) & (d.bitmask >>> 0)) >>> 0;
    if (ram) return (value * d.cm.coeffs[5] - d.cm.coeffs[2]) / d.cm.coeffs[1];
    return value * Number(d.factor) / Number(d.div) + Number(d.add);
}
function correctionEntries(definitions, allowSixSlots) {
    const candidates = definitions.filter((d) => normalize(d.name) === '(ram) ignition timing corr. cyl.');
    if (candidates.length !== 1) return [];
    const d = candidates[0], m = d.m, start = parseInt(d.pid, 16);
    if (!m || m.label !== 'Dzw_kr' || m.dataType !== 'SWORD' || m.matrixDim !== m.arraySize + ' 1 1' ||
        d.bytes !== 2 || !d.signed || !scalar(Object.assign({}, d, { m: null }), true) ||
        !['deg', '°'].includes(d.cm.unit) || !Number.isSafeInteger(start) || start < 0) return [];
    // The N63TU3 has four cylinders per DME. The V8 BM3 log shows
    // correction streams for local slots 1–4 on both DMEs.
    if (m.arraySize !== 4 && !(allowSixSlots && m.arraySize === 6)) return [];
    if (start + m.arraySize * d.bytes > 0x100000000) return [];
    return CORRECTION_IDS.map((id, index) => ({ id,
        d: Object.assign({}, d, { pid: (start + index * d.bytes).toString(16) }) }));
}
function displayValue(value, entry, ambient) {
    const d = entry.d, unit = d.units || d.cm && d.cm.unit || '', output = channels[entry.id].unit;
    if (output === 'psig') {
        const scale = { hPa: 0.0145, kPa: 0.145, MPa: 145, bar: 14.5038 }[unit];
        if (!scale) return NaN;
        // BMWtchbas_p_Dif_sw is explicitly target minus actual pressure in the
        // recovered A2L description: a difference must not lose atmospheric pressure twice.
        const difference = entry.id === 25;
        if (!difference && !d.forceAbsolute) {
            if (!Number.isFinite(ambient)) return NaN;
            value -= ambient / ({ hPa: 1, kPa: 10, MPa: 10000, bar: 1000 }[unit]);
        }
        return value * scale;
    }
    if (output === 'F') return ['C', '°C', '° C'].includes(unit) ? value * 9 / 5 + 32 : unit === 'F' ? value : NaN;
    if (output === 'mph') return unit === 'km/h' ? value * 0.621371 : unit === 'mph' ? value : NaN;
    if (output === 'rpm' || output === '1/min') return ['rpm', '1/min'].includes(unit) ? value : NaN;
    if (output === 'deg') return ['deg', '°'].includes(unit) ? value : NaN;
    if (output === 'deg KW' || output === 'degKW')
        return ['deg KW', 'degKW', 'Grad KW', '°KW', '° KW'].includes(unit) ? value : NaN;
    if (output === '-' && unit === '') return value;
    return unit === output ? value : NaN;
}

class Bm3Feed {
    constructor(ctx, changed) {
        this.ctx = ctx; this.changed = changed; this.run = null; this.task = null;
        this.timingEngine = null;
        this.banks = [0x12, 0x13].map((target) => ({ target, samples: {}, reasons: {}, groups: [], timingPeaks: {}, timingRom: null,
            status: 'Inactive', hz: 0, arrivals: [], lastCycle: 0, rom: null, failures: 0, retryAt: 0 }));
    }
    start(engine, options) {
        if (this.task) throw new Error('Previous BM3 acquisition has not drained');
        const run = { active: true, connected: false, lost: false, disposed: false, owned: new Map(),
            diag: null, proxy: null, pending: null, engine, timingOnly: !!options, withTransport: options && options.withTransport };
        if (run.timingOnly && this.timingEngine !== engine) {
            this.timingEngine = engine;
            this.banks.forEach((bank) => { bank.timingPeaks = {}; bank.timingRom = null; });
        }
        this.run = run;
        this.banks.forEach((bank) => Object.assign(bank, { samples: {}, reasons: {}, groups: [],
            status: 'Connecting', hz: 0, arrivals: [], lastCycle: 0, rom: null, ambient: null, failures: 0, retryAt: 0 }));
        this.task = (async () => {
            try { await this._run(run); }
            catch (error) {
                if (run.active) this.banks.forEach((bank) => { bank.status = error.message; bank.samples = {}; bank.hz = 0; });
                this._notify();
            } finally {
                run.active = false; this._dispose(run); this.task = null; this.changed();
            }
        })();
        this.changed();
    }
    cylinderTiming(cylinder, engine, now) {
        if (engine !== this.timingEngine) return { peak: null, fresh: false };
        // 0x12 is the right DME (C1–C4), 0x13 is the left DME (C5–C8).
        const bank = this.banks[cylinder <= 4 ? 0 : 1], id = CORRECTION_IDS[(cylinder - 1) % 4];
        const peak = bank.timingPeaks[id], sample = bank.samples[id];
        const fresh = this.run && this.run.active && this.run.timingOnly && sample &&
            now - sample.at <= STATUS_FRESH_MS && Math.abs(sample.value) <= 90;
        return { peak: Number.isFinite(peak) ? peak : null, fresh: !!fresh };
    }
    async stop() {
        const run = this.run;
        if (run) run.active = false;
        this.banks.forEach((bank) => { bank.samples = {}; bank.hz = 0; });
        if (this.task) await this.task;
        this.banks.forEach((bank) => { bank.status = 'Inactive'; });
        this.changed();
    }
    _notify() {
        this.ctx.settings.values.bm3Status = this.banks.map((bank, i) => 'DME ' + (i + 1) + ': ' + bank.status +
            '. ' + Object.keys(bank.reasons).map((id) => channels[id].name + ': ' + bank.reasons[id]).join('; ')).join(' | ');
        this.ctx.ui.cells('SET_BM3STATUS', 0, { Text1stRow: 'BM3 acquisition details', Text2ndRow: this.ctx.settings.values.bm3Status });
        this.changed();
    }
    _shutdown(proxy) {
        if (proxy && proxy.shutdown) Promise.resolve().then(() => proxy.shutdown()).catch((e) => this.ctx.log.warn(e));
    }
    _dispose(run) {
        run.disposed = true;
        if (run.diag) run.diag.removeAllListeners();
        this._shutdown(run.proxy); run.proxy = null;
    }
    async _open(run) {
        const native = this.ctx.signals;
        const signals = {
            proxy: async (iface, instance) => {
                const opening = native.proxy(iface, instance);
                opening.then((p) => {
                    if (!run.disposed) run.proxy = p;
                    else this._shutdown(p);
                }).catch(() => {});
                return deadline(opening, 5000, 'BM3 diagnostic connect');
            },
            on: (p, name, handler, log) => deadline(native.on(p, name, (v) => {
                if (!run.disposed) handler(v);
            }, log), 2000, 'BM3 response subscription'),
            onAvailable: (p, handler) => deadline(native.onAvailable(p, (available) => {
                if (run.disposed) return;
                handler(available);
                if (available) { run.connected = true; if (run.ready) run.ready(); }
                else if (run.connected) {
                    run.lost = true; run.active = false;
                    this.banks.forEach((bank) => { bank.samples = {}; bank.hz = 0; bank.status = 'Disconnected'; });
                    this._notify();
                }
            }), 2000, 'BM3 availability subscription'),
            call: (p, method, values) => {
                const op = run.pending;
                if (!op) return Promise.reject(new Error('No BM3 request active'));
                const guard = { callMethod: (name, params, timeout) => {
                    if (run.disposed || run.lost || (!run.active && !op.cleanup) || Date.now() >= op.expiresAt)
                        throw new Error('BM3 request cancelled before dispatch');
                    return p.callMethod(name, params, Math.max(1, Math.min(timeout, op.expiresAt - Date.now())));
                } };
                return native.call(guard, method, values, Math.max(1, op.expiresAt - Date.now()));
            },
        };
        run.diag = new Diag(signals, this.ctx.log); run.diag.quiet = true;
        await run.diag.init();
        if (run.diag.error || !run.diag.p) throw new Error(run.diag.error || 'No BM3 diagnostic link');
        if (!run.diag.available) {
            await deadline(new Promise((resolve) => { run.ready = resolve; }), 5000, 'BM3 provider availability');
            run.ready = null;
        }
    }
    _request(run, target, sid, data, { cleanup = false, timeoutMs = DEADLINE_MS } = {}) {
        const request = () => this._exchange(run, target, sid, data, cleanup, timeoutMs);
        return run.withTransport ? run.withTransport(request) : request();
    }
    async _exchange(run, target, sid, data, cleanup, timeoutMs) {
        if (run.lost || (!run.active && !cleanup)) throw new Error('BM3 acquisition stopped');
        const echo = data.slice(0, REPLY_ECHO_BYTES[sid]);
        const accept = (u) => (u[0] === sid + 0x40 && echo.every((b, i) => u[i + 1] === b)) ||
            (u.length >= 3 && u[0] === 0x7F && u[1] === sid);
        run.pending = { expiresAt: Date.now() + timeoutMs, cleanup };
        try {
            // Await the native send AND its reply/deadline. Never release the shared
            // transport slot just because a UI generation or response timer changed.
            const u = await run.diag.physical(target, sid, data, timeoutMs, accept, {
                maxRetries: 0, callTimeoutMs: timeoutMs, hardTimeoutMs: timeoutMs, pendingTimeoutMs: timeoutMs,
            });
            if (!cleanup && !run.active && sid !== 0x2C) throw new Error('BM3 acquisition stopped');
            return u;
        } finally { run.pending = null; }
    }
    _slot(target, did) { return target + ':' + did; }
    async _vacant(run, target, dids) {
        for (const did of dids) {
            const u = await this._request(run, target, 0x22, word(did));
            // An undefined slot responds with NRC 31. A positive reply sends us to the next slot.
            if (u && u[0] === 0x7F && u[2] === 0x31) return did;
            checked(u);
        }
        throw new Error('Dynamic DID ' + dids.map((did) => hex(did, 4)).join('/') + ' already in use');
    }
    async _clear(run, target, did) {
        const key = this._slot(target, did);
        if (!run.owned.has(key)) return;
        checked(await this._request(run, target, 0x2C, [3].concat(word(did)), { cleanup: true }), 4);
        run.owned.delete(key);
    }
    async _define(run, target, did, entries, ram, identity) {
        let data = [ram ? 2 : 1].concat(word(did));
        if (ram) data.push(0x24);
        entries.forEach((entry) => {
            const id = parseInt(entry.d.pid, 16);
            data = data.concat(ram ? address(id).concat(word(entry.d.bytes)) : word(id).concat([1, entry.d.bytes]));
        });
        if (data.length > 240 || entries.reduce((n, e) => n + e.d.bytes, 0) > (identity ? ROM_MARKER_BYTES : 96))
            throw new Error('BM3 aggregate exceeds conservative payload budget');
        const reply = checked(await this._request(run, target, 0x2C, data));
        run.owned.set(this._slot(target, did), { target, did });
        checked(reply, 4);
    }
    async _readRomMarker(run, target, did, custom) {
        await this._clear(run, target, did);
        const pid = custom ? '807FFE50' : '8005FE1E';
        const options = { timeoutMs: ROM_READ_MS };
        let dynamicNrc;
        try {
            await this._define(run, target, did, [{ d: { pid, bytes: ROM_MARKER_BYTES } }], true, true);
            const reply = checked(await this._request(run, target, 0x22, word(did), options), ROM_MARKER_BYTES + 3);
            return Buffer.from(reply.slice(3)).toString('latin1');
        } catch (error) {
            // Some DMEs reject the marker's dynamic definition or read. Try the read-only service
            // used by live_adjustments after an explicit service, format or range refusal.
            if (!run.active || run.lost || !ROM_READ_FALLBACK_NRCS.includes(error.nrc)) throw error;
            dynamicNrc = error.nrc;
        }
        await this._clear(run, target, did);
        // The reply carries no address. Keep this read serialized with other BM3 requests.
        const data = [0x14].concat(address(parseInt(pid, 16)), [ROM_MARKER_BYTES]);
        const reply = await this._request(run, target, 0x23, data, options);
        if (custom && reply && reply[0] === 0x7F) {
            const directNrc = reply[2];
            // A stock DME can reject the custom address and lack support for direct reads.
            // The stock marker can still be read through a dynamic DID.
            if (directNrc === 0x31 || (dynamicNrc === 0x31 && ROM_READ_FALLBACK_NRCS.includes(directNrc))) return '';
        }
        return Buffer.from(checked(reply, ROM_MARKER_BYTES + 1).slice(1)).toString('latin1');
    }
    async _identifyRom(run, target, did) {
        // Native lqwH57IWj / dQP4UQV51, independently corroborated by upstream
        // live_adjustments for the custom marker. Never substitute an SWFL ID for a ROM.
        const rom = customRom(await this._readRomMarker(run, target, did, true));
        if (rom) return rom;
        const stock = await this._readRomMarker(run, target, did, false);
        const keys = (stock.match(/[A-Za-z0-9]+/g) || []).filter(knownRom);
        const unique = Array.from(new Set(keys));
        if (unique.length !== 1) throw new Error('No exact supported ROM identity');
        return unique[0];
    }
    async _ordinary(run, bank) {
        await this._vacant(run, bank.target, [ORDINARY_DID]);
        const definitions = catalog.engines[run.engine].map((id) => catalog.definitions[id]), entries = [];
        for (const channel of channels.filter((c) => c.id < 23)) {
            const candidates = definitions.filter((d) => normalize(d.name) === normalize(channel.name) && scalar(d, false));
            let found = null;
            for (const d of candidates) {
                const u = await this._request(run, bank.target, 0x22, word(parseInt(d.pid, 16)));
                if (!u) throw new Error('DME capability probe timed out');
                if (positive(u) && u.length === 3 + d.bytes) { found = { id: channel.id, d }; break; }
            }
            if (found) entries.push(found);
            else bank.reasons[channel.id] = 'No supported, length-matched DID in selected engine catalog';
        }
        if (entries.length) {
            await this._define(run, bank.target, ORDINARY_DID, entries, false);
            bank.groups.push({ did: ORDINARY_DID, entries, ram: false });
        }
    }
    async _ram(run, bank) {
        const did = await this._vacant(run, bank.target, RAM_DIDS);
        bank.rom = await this._identifyRom(run, bank.target, did);
        if (run.timingOnly && bank.timingRom !== bank.rom) {
            bank.timingRom = bank.rom; bank.timingPeaks = {};
        }
        await this._clear(run, bank.target, did);
        const definitions = catalog.roms[bank.rom].map((id) => catalog.definitions[id]), entries = [];
        const corrections = correctionEntries(definitions, run.engine === 'N63T3');
        const wanted = run.timingOnly ? CORRECTION_IDS.map((id) => channels[id]) : channels.filter((c) => c.id >= 23);
        for (const channel of wanted) {
            const correction = corrections.find((entry) => entry.id === channel.id);
            if (correction) { entries.push(correction); continue; }
            const candidates = definitions.filter((d) => normalize(d.name) === normalize(channel.name));
            const unique = Array.from(new Set(candidates));
            if (unique.length === 1 && scalar(unique[0], true)) entries.push({ id: channel.id, d: unique[0] });
            else bank.reasons[channel.id] = /Corr\. Cyl\./.test(channel.name) ? 'Array element selection is not proven' :
                unique.length > 1 ? 'Multiple ROM sources; BM3 source selection is not proven' :
                unique.length ? 'Array or conversion layout is not proven' : 'No exact scalar definition in this ROM';
        }
        if (entries.length) {
            await this._define(run, bank.target, did, entries, true);
            bank.groups.push({ did, entries, ram: true });
        }
    }
    async _cleanup(run, target, dids) {
        if (!run.diag || run.lost) return;
        for (const slot of Array.from(run.owned.values())) {
            if (target !== undefined && slot.target !== target) continue;
            if (dids && !dids.includes(slot.did)) continue;
            try { await this._clear(run, slot.target, slot.did); }
            catch (error) {
                this.ctx.log.warn('BM3 dynamic DID cleanup: ' + error.message);
                const bank = this.banks.find((b) => b.target === slot.target);
                if (bank) bank.status = 'Temporary DID cleanup unconfirmed; restart vehicle diagnostics before reuse';
            }
        }
    }
    async _poll(run, bank) {
        for (const group of bank.groups) {
            const size = group.entries.reduce((n, e) => n + e.d.bytes, 0);
            let u;
            try { u = checked(await this._request(run, bank.target, 0x22, word(group.did)), size + 3); }
            catch (error) { return { group, error }; }
            const now = Date.now(), raw = {}; let offset = 3;
            group.entries.forEach((entry) => { raw[entry.id] = rawValue(u, offset, entry.d, group.ram); offset += entry.d.bytes; });
            if (raw[1] !== undefined) bank.ambient = { value: raw[1], at: now };
            const ambient = bank.ambient && now - bank.ambient.at <= FRESH_MS ? bank.ambient.value : NaN;
            group.entries.forEach((entry) => {
                const id = entry.id, value = displayValue(raw[id], entry, ambient);
                if (Number.isFinite(value)) {
                    bank.samples[id] = { value, at: now };
                    delete bank.reasons[id];
                    if (run.timingOnly && Math.abs(value) <= 90)
                        bank.timingPeaks[id] = Math.max(bank.timingPeaks[id] || 0, Math.abs(value));
                } else {
                    delete bank.samples[id];
                    bank.reasons[id] = 'Missing fresh ambient pressure or unsupported unit conversion';
                }
            });
            this.changed();
        }
        const now = Date.now(); bank.lastCycle = now; bank.arrivals.push(now);
        while (bank.arrivals.length > 128 || bank.arrivals[0] < now - 2000) bank.arrivals.shift();
        bank.hz = bank.arrivals.length > 1 && now > bank.arrivals[0] ?
            (bank.arrivals.length - 1) * 1000 / (now - bank.arrivals[0]) : 0;
        return null;
    }
    async _run(run) {
        if (!Object.prototype.hasOwnProperty.call(catalog.engines, run.engine)) throw new Error('Select the exact BM3 engine family in Settings');
        if (run.timingOnly && !/^[NS]63/.test(run.engine)) throw new Error('Car Status cylinder timing requires an N63 or S63 engine profile');
        if (this.ctx.preview || !this.ctx.signals.hasNative()) throw new Error('Live vehicle diagnostic transport unavailable');
        try {
            await this._open(run);
            for (const bank of this.banks) {
                let ramError;
                for (const prepare of run.timingOnly ? [this._ram] : [this._ordinary, this._ram]) {
                    if (!run.active) return;
                    try { await prepare.call(this, run, bank); }
                    catch (error) {
                        if (!run.active) return;
                        const ram = prepare === this._ram;
                        const failed = run.timingOnly ? CORRECTION_IDS.map((id) => channels[id]) :
                            channels.filter((c) => ram ? c.id >= 23 : c.id < 23);
                        failed.forEach((c) => { bank.reasons[c.id] = error.message; });
                        if (ram) ramError = error.message;
                        await this._cleanup(run, bank.target, ram ? RAM_DIDS : [ORDINARY_DID]);
                    }
                }
                const count = bank.groups.reduce((n, group) => n + group.entries.length, 0);
                bank.readyStatus = (bank.rom ? 'ROM ' + bank.rom + ' / ' : '') + count +
                    (run.timingOnly ? '/4 timing channels defined' : '/44 defined') + (ramError ? ' / RAM ' + ramError : '');
                bank.status = bank.readyStatus;
                this._notify();
            }
            while (run.active && this.banks.some((bank) => bank.groups.length)) {
                for (const bank of this.banks) {
                    if (!run.active) return;
                    if (!bank.groups.length || Date.now() < bank.retryAt) continue;
                    const failure = await this._poll(run, bank);
                    if (!run.active || run.lost) return;
                    if (!failure) {
                        const recovered = bank.failures > 0;
                        bank.failures = 0; bank.retryAt = 0;
                        if (recovered) { bank.status = bank.readyStatus; this._notify(); }
                        continue;
                    }
                    const { group, error } = failure;
                    const message = (group.ram ? 'RAM ' : 'DID ') + error.message;
                    group.entries.forEach(({ id }) => {
                        delete bank.samples[id];
                        bank.reasons[id] = error.message;
                    });
                    if (!group.ram) bank.ambient = null;
                    bank.hz = 0; bank.arrivals = []; bank.lastCycle = 0;
                    if (retryable(error) && bank.failures < MAX_POLL_RETRIES) {
                        bank.failures++;
                        bank.retryAt = Date.now() + POLL_RETRY_MS * bank.failures;
                        bank.status = message + ' / retry ' + bank.failures + '/' + MAX_POLL_RETRIES;
                    } else {
                        bank.groups = bank.groups.filter((active) => active !== group);
                        bank.failures = 0; bank.retryAt = 0;
                        bank.readyStatus = message; bank.status = message;
                        await this._cleanup(run, bank.target, [group.did]);
                    }
                    this._notify();
                }
                // Back off failed DMEs independently, without holding up a healthy DME.
                const next = this.banks.filter((bank) => bank.groups.length).map((bank) => bank.retryAt);
                const waitMs = Math.max(run.timingOnly ? 750 : 0, Math.min.apply(null, next) - Date.now());
                if (run.active && next.length && waitMs > 0)
                    await new Promise((resolve) => setTimeout(resolve, waitMs));
            }
        } finally {
            await this._cleanup(run);
            if (run.lost) this.banks.forEach((bank) => {
                bank.samples = {}; bank.hz = 0; bank.status = 'Provider disconnected; re-enter tab to identify again';
            });
            this._notify();
        }
    }
}
module.exports = { Bm3Feed };

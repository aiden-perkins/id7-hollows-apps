'use strict';
const { NRC, hex } = require('./kit/diag');
const channels = require('./bm3_channels');
const catalog = require('./bm3_catalog');

// Recovered from Mobile_amd64.dll, SHA-256 recorded in bm3_catalog.js:
// 18103cec0: DID/position/width; 18103d2e0: address/size; 181049c20..18104a700: 2C/22.
// Ordinary values are BE (18103ef20); RAM uses cm.bigEndian (18103e5a0).
const POLL_MS = 250, POLL_DEADLINE_MS = 1200, SETUP_DEADLINE_MS = 4500;
const MIN_FRESH_MS = 1500, MAX_FRESH_MS = 6000;
const RETRY_MS = 250, MAX_RETRY_MS = 5000;
const ORDINARY_DID = 0xF300, RAM_DIDS = [0xF301, 0xF302];
const ROM_MARKER_BYTES = 255;
const ROM_READ_FALLBACK_NRCS = [0x11, 0x12, 0x13, 0x31];
const UNSUPPORTED_NRCS = [0x11, 0x12, 0x31];
const CORRECTION_IDS = [32, 33, 34, 35], STATUS_POLL_MS = 500;
const ORDINARY_CHANNELS = channels.filter((channel) => channel.id < 23);
const RAM_CHANNELS = channels.filter((channel) => channel.id >= 23);
const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
const word = (n) => [Math.floor(n / 256) & 255, n & 255];
const address = (n) => [Math.floor(n / 16777216) & 255, Math.floor(n / 65536) & 255,
    Math.floor(n / 256) & 255, n & 255];
function fault(message, kind, phase) { return Object.assign(new Error(message), { kind, phase }); }
function retryable(error) {
    return error.busy || ['timeout', 'occupied'].includes(error.kind) || [0x21, 0x22].includes(error.nrc) ||
        /TEMPORARILY_NOT_ACCEPTED|BUSY|TIMED OUT|TIMEOUT/i.test(error.message);
}
function retryDelay(failures, error) {
    if (error.kind === 'occupied') return MAX_RETRY_MS;
    return Math.min(MAX_RETRY_MS, RETRY_MS * Math.pow(2, Math.min(5, failures - 1)));
}
const knownRom = (key) => Object.prototype.hasOwnProperty.call(catalog.roms, key);
function requireRom(key) {
    if (!key) throw fault('Malformed BM3 CustomROM marker', 'marker', 'Parse ROM');
    if (!knownRom(key)) throw fault('No RAM catalog for ROM ' + key, 'catalog', 'Parse ROM');
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
        if (tags.length !== 1) throw fault('CustomROM marker has no unique ROM tag', 'marker', 'Parse ROM');
        const tag = tags[0].slice(1), key = tag.slice(0, -5);
        if (!knownRom(tag) && knownRom(key) && /^[A-Z0-9]{5}$/.test(tag.slice(-5))) return key;
        return requireRom(tag);
    }
    if (marker.startsWith('BM3_')) throw fault('Unrecognized BM3 CustomROM marker layout', 'marker', 'Parse ROM');
    return null;
}
function scalar(d, ram) {
    if (![1, 2, 4].includes(d.bytes)) return false;
    if (!ram) return [d.factor, d.div, d.add].every((n) => Number.isFinite(Number(n))) && Number(d.div) !== 0;
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
function needsAmbient(entry) {
    return channels[entry.id].unit === 'psig' && entry.id !== 25 && !entry.d.forceAbsolute;
}
function displayValue(value, entry, ambient) {
    const d = entry.d, unit = d.units || d.cm && d.cm.unit || '', output = channels[entry.id].unit;
    if (output === 'psig') {
        const scale = { hPa: 0.0145, kPa: 0.145, MPa: 145, bar: 14.5038 }[unit];
        if (!scale) return NaN;
        // BMWtchbas_p_Dif_sw is explicitly target minus actual pressure in the
        // recovered A2L description: a difference must not lose atmospheric pressure twice.
        if (needsAmbient(entry)) {
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
    constructor(ctx, diagnostic, changed) {
        this.ctx = ctx; this.diagnostic = diagnostic; this.changed = changed;
        this.run = null; this.task = null; this.timingEngine = null;
        this.identities = new Map(); this.uncertainSlots = new Map();
        this.banks = [0x12, 0x13].map((target) => ({ target, timingPeaks: {}, timingRom: null }));
        this._resetBanks('Inactive');
    }
    _resetBanks(status) {
        this.banks.forEach((bank) => Object.assign(bank, {
            status, rom: null, samples: {}, reasons: {}, pressure: {}, ambient: null, groups: [], issues: new Map(),
        }));
    }
    start(engine, { timingOnly = false } = {}) {
        if (this.task) throw new Error('Previous BM3 acquisition has not drained');
        const run = { engine, timingOnly, trackTiming: /^[NS]63/.test(engine),
            active: true, connection: null, waiters: new Set() };
        if (run.trackTiming && this.timingEngine !== engine) {
            this.timingEngine = engine;
            this.banks.forEach((bank) => { bank.timingPeaks = {}; bank.timingRom = null; });
        }
        this.run = run;
        this._resetBanks('Connecting');
        this.ctx.log.info('BM3 ' + this.ctx.spec.version + ' / ' + engine + ' / ' + (timingOnly ? 'timing' : 'full'));
        this.task = this._run(run).catch((error) => {
            if (run.active) {
                this._resetBanks(error.message);
                this.ctx.log.warn('BM3: ' + error.message);
            }
        }).then(() => {
            run.active = false;
            this.task = null;
            this.changed();
        });
        this.changed();
    }
    async stop() {
        if (this.run) {
            this.run.active = false;
            this._wake(this.run);
        }
        this._resetBanks('Inactive');
        if (this.task) await this.task;
        this.changed();
    }
    cylinderTiming(cylinder, engine, now) {
        if (engine !== this.timingEngine) return { peak: null, fresh: false };
        // Keep the existing Car Status bank mapping. BM3's grid uses DME-local slots.
        const bank = this.banks[cylinder <= 4 ? 0 : 1], id = CORRECTION_IDS[(cylinder - 1) % 4];
        const peak = bank.timingPeaks[id], sample = bank.samples[id];
        const fresh = this.run && this.run.active && this.run.trackTiming && sample &&
            now <= sample.expiresAt && Math.abs(sample.value) <= 90;
        return { peak: Number.isFinite(peak) ? peak : null, fresh: !!fresh };
    }
    summary(bank, now) {
        if (bank.status) return bank.status;
        const ram = bank.groups.filter((group) => group.ram);
        const count = ram.reduce((total, group) => total + group.entries.length, 0);
        const rates = ram.filter((group) => group.expiresAt >= now && group.hz > 0).map((group) => group.hz);
        // A group that updates faster must not hide the cadence of the other group.
        const rate = rates.length === ram.length && rates.length ? ' / ' + Math.min(...rates).toFixed(1) + ' Hz' : '';
        const issue = bank.issues.get('ram') || bank.issues.get('RAM seed') || bank.issues.get('expansion') ||
            bank.issues.get('RAM expansion') || bank.issues.values().next().value;
        return (bank.rom ? 'ROM ' + bank.rom + ' / ' : '') + (count ? count + ' RAM' + rate : 'RAM setup') +
            (issue ? ' / ' + issue.message + (issue.retry ? ' / retrying' : '') : count ? '' : ' in progress');
    }
    _issue(bank, key, error, retry) {
        if (!error) {
            if (bank.issues.delete(key)) {
                this.ctx.log.info('BM3 DME 0x' + hex(bank.target) + ' / ' + key + ' recovered');
                this.changed();
            }
            return;
        }
        const message = (error.phase ? error.phase + ': ' : '') + error.message;
        const previous = bank.issues.get(key);
        if (previous && previous.message === message && previous.retry === retry) return;
        bank.issues.set(key, { message, retry });
        const details = [
            error.service && 'UDS ' + error.service,
            error.verdict !== undefined && 'TASU ' + error.verdict,
            error.expectedLength !== undefined && 'expected ' + error.expectedLength + ' bytes',
            error.actualLength !== undefined && 'received ' + error.actualLength + ' bytes',
            error.queueMs !== undefined && 'queued ' + error.queueMs + ' ms',
            error.elapsedMs !== undefined && 'elapsed ' + error.elapsedMs + ' ms',
        ].filter(Boolean);
        this.ctx.log.info('BM3 DME 0x' + hex(bank.target) + ' / ' + message +
            (details.length ? ' (' + details.join(', ') + ')' : '') + (retry ? ' / retrying' : ''));
        this.changed();
    }
    _reason(bank, id, kind, message) {
        const previous = bank.reasons[id];
        if (previous && previous.kind === kind && previous.message === message) return;
        bank.reasons[id] = { kind, message };
        this.ctx.log.info('BM3 DME 0x' + hex(bank.target) + ' / ' + channels[id].name + ': ' + message);
    }
    _active(session) { return session.run.active && session.run.connection === session.connection; }
    _wake(run) { Array.from(run.waiters).forEach((done) => done()); }
    _wait(run, ms, cleanup = false) {
        if ((!run.active && !cleanup) || ms <= 0) return Promise.resolve();
        return new Promise((resolve) => {
            let timer;
            const done = () => { clearTimeout(timer); run.waiters.delete(done); resolve(); };
            run.waiters.add(done);
            if (Number.isFinite(ms)) timer = setTimeout(done, ms);
        });
    }
    async _request(session, bank, phase, sid, data, options = {}) {
        const { timeoutMs = SETUP_DEADLINE_MS, length, allowRefusal = [], cleanup = false } = options;
        const service = hex(sid) + (sid === 0x22 ? ' ' + data.map((value) => hex(value)).join('') :
            sid === 0x2C ? ' ' + hex(data[0]) + ' ' + hex(data[1]) + hex(data[2]) : '');
        try {
            const reply = await this.diagnostic.requestBm3(session.connection, bank.target, sid, data, timeoutMs,
                () => cleanup ? session.run.connection === session.connection : this._active(session));
            const uds = reply.uds;
            if (uds[0] === 0x7F) {
                const nrc = uds[2];
                if (allowRefusal.includes(nrc)) return reply;
                throw Object.assign(fault('NRC 0x' + hex(nrc) + ' (' + (NRC[nrc] || 'refused') + ')', 'nrc'),
                    { nrc, verdict: reply.verdict, queueMs: reply.queueMs, elapsedMs: reply.elapsedMs, actualLength: uds.length });
            }
            if (length !== undefined && uds.length !== length) {
                throw Object.assign(fault('Unexpected reply length ' + uds.length + '/' + length, 'payload'),
                    { dispatched: true, verdict: reply.verdict, queueMs: reply.queueMs,
                        elapsedMs: reply.elapsedMs, actualLength: uds.length });
            }
            return reply;
        } catch (error) {
            throw Object.assign(error, { phase, service, expectedLength: length });
        }
    }
    _slot(bank, did) { return bank.target + ':' + did; }
    async _vacant(session, bank, dids, phase) {
        let lastError, availableToCheck = false;
        for (const did of dids) {
            const key = this._slot(bank, did);
            if (session.owned.has(key) || this.uncertainSlots.get(key) === session.connection) continue;
            availableToCheck = true;
            try {
                const { uds } = await this._request(session, bank, phase, 0x22, word(did),
                    { timeoutMs: POLL_DEADLINE_MS, allowRefusal: [0x31] });
                if (uds[0] === 0x7F) {
                    this.uncertainSlots.delete(key);
                    return did;
                }
            } catch (error) {
                if (!this._active(session)) throw error;
                if (!lastError || retryable(error)) lastError = error;
            }
        }
        if (lastError) throw lastError;
        if (!availableToCheck && dids.some((did) => this.uncertainSlots.get(this._slot(bank, did)) === session.connection)) {
            throw fault('Temporary identifier ownership uncertain', 'ownership', phase);
        }
        throw fault('No free identifier (' + dids.map((did) => hex(did, 4)).join('/') + ')', 'occupied', phase);
    }
    _quarantine(session, bank, did) {
        const key = this._slot(bank, did);
        session.owned.delete(key);
        this.uncertainSlots.set(key, session.connection);
    }
    async _clear(session, bank, did) {
        const key = this._slot(bank, did);
        if (!session.owned.has(key)) return;
        const label = 'Clear ' + hex(did, 4);
        for (let attempt = 0; ; attempt++) {
            try {
                await this._request(session, bank, label, 0x2C, [3].concat(word(did)), { cleanup: true, length: 4 });
                session.owned.delete(key);
                this._issue(bank, label, null);
                return;
            } catch (error) {
                // Repeat only when the clear was explicitly refused or never dispatched.
                const refused = error.kind === 'nrc' || error.kind === 'verdict' && error.busy;
                const retry = attempt < 2 && session.run.connection === session.connection &&
                    retryable(error) && (refused || !error.dispatched);
                this._issue(bank, label, error, retry);
                if (!retry) { this._quarantine(session, bank, did); return; }
                await this._wait(session.run, retryDelay(attempt + 1, error), true);
            }
        }
    }
    async _define(session, bank, did, entries, ram, phase, marker = false) {
        const identifier = ram ? /^[0-9a-f]{1,8}$/i : /^[0-9a-f]{1,4}$/i;
        if (entries.some(({ d }) => !identifier.test(d.pid))) throw fault('Invalid measurement identifier', 'catalog', phase);
        let data = [ram ? 2 : 1].concat(word(did));
        if (ram) data.push(0x24);
        entries.forEach(({ d }) => {
            const id = parseInt(d.pid, 16);
            data = data.concat(ram ? address(id).concat(word(d.bytes)) : word(id).concat([1, d.bytes]));
        });
        if (data.length > 240 || entries.reduce((sum, entry) => sum + entry.d.bytes, 0) > (marker ? ROM_MARKER_BYTES : 96)) {
            throw fault('Group exceeds payload budget', 'budget', phase);
        }
        try {
            await this._request(session, bank, phase, 0x2C, data, { length: 4 });
            session.owned.set(this._slot(bank, did), { bank, did });
        } catch (error) {
            // A lost acknowledgement can leave a definition behind. Only confirmed
            // definitions are cleared, and an uncertain slot stays out of this connection's rotation.
            if (error.dispatched && !(error.kind === 'verdict' && error.busy)) this._quarantine(session, bank, did);
            throw error;
        }
    }
    async _readRomMarker(session, bank, custom) {
        const label = custom ? 'CustomROM marker' : 'stock ROM marker';
        const pid = custom ? '807FFE50' : '8005FE1E';
        const did = await this._vacant(session, bank, RAM_DIDS, 'Find slot for ' + label);
        const readPhase = 'Read ' + label;
        let dynamicError;
        try {
            await this._define(session, bank, did, [{ d: { pid, bytes: ROM_MARKER_BYTES } }], true, 'Define ' + label, true);
            const { uds } = await this._request(session, bank, readPhase, 0x22, word(did), { length: ROM_MARKER_BYTES + 3 });
            return Buffer.from(uds.slice(3)).toString('latin1');
        } catch (error) {
            const incomplete = error.phase === readPhase && ['timeout', 'payload'].includes(error.kind);
            if (error.kind === 'payload') this._quarantine(session, bank, did);
            if (!this._active(session) || !(incomplete || ROM_READ_FALLBACK_NRCS.includes(error.nrc))) throw error;
            dynamicError = error;
        } finally {
            await this._clear(session, bank, did);
        }
        this._issue(bank, label, dynamicError, false);
        const data = [0x14].concat(address(parseInt(pid, 16)), [ROM_MARKER_BYTES]);
        try {
            const { uds } = await this._request(session, bank, 'Direct ' + label, 0x23, data, { length: ROM_MARKER_BYTES + 1 });
            return Buffer.from(uds.slice(1)).toString('latin1');
        } catch (error) {
            if (custom && (error.nrc === 0x31 || (dynamicError.nrc === 0x31 && ROM_READ_FALLBACK_NRCS.includes(error.nrc)))) return '';
            throw error;
        } finally {
            bank.issues.delete(label);
        }
    }
    async _identifyRom(session, bank) {
        const cached = this.identities.get(bank.target);
        if (cached && cached.connection === session.connection && cached.engine === session.run.engine) return cached.rom;
        let rom = customRom(await this._readRomMarker(session, bank, true));
        if (!rom) {
            const stock = await this._readRomMarker(session, bank, false);
            const keys = Array.from(new Set((stock.match(/[A-Za-z0-9]+/g) || []).filter(knownRom)));
            if (keys.length !== 1) throw fault('No unique supported stock ROM', 'catalog', 'Parse ROM');
            rom = keys[0];
        }
        if (this._active(session)) this.identities.set(bank.target, { connection: session.connection, engine: session.run.engine, rom });
        return rom;
    }
    async _setup(session, bank, key, prepare) {
        for (let failures = 0; this._active(session); failures++) {
            try {
                const result = await prepare();
                this._issue(bank, key, null);
                return result;
            } catch (error) {
                if (!this._active(session)) return null;
                const retry = retryable(error);
                this._issue(bank, key, error, retry);
                if (!retry) return null;
                await this._wait(session.run, retryDelay(failures + 1, error));
            }
        }
        return null;
    }
    async _ordinary(session, bank) {
        const definitions = catalog.engines[session.run.engine].map((id) => catalog.definitions[id]);
        const entries = [];
        let nextChannel = 0;
        const group = await this._setup(session, bank, 'ordinary', async () => {
            // Keep successful probes across transient failures during this connection.
            for (; nextChannel < ORDINARY_CHANNELS.length; nextChannel++) {
                const channel = ORDINARY_CHANNELS[nextChannel];
                const candidates = definitions.filter((d) => normalize(d.name) === normalize(channel.name) && scalar(d, false));
                let found;
                for (const d of candidates) {
                    try {
                        const { uds } = await this._request(session, bank, 'Probe ' + channel.name, 0x22, word(parseInt(d.pid, 16)),
                            { timeoutMs: POLL_DEADLINE_MS, allowRefusal: UNSUPPORTED_NRCS });
                        if (uds[0] !== 0x7F && uds.length === 3 + d.bytes) { found = { id: channel.id, d }; break; }
                    } catch (error) {
                        if (!this._active(session) || retryable(error)) throw error;
                        this._reason(bank, channel.id, 'error', error.message);
                    }
                }
                if (found) entries.push(found);
                else if (!bank.reasons[channel.id]) this._reason(bank, channel.id, 'unsupported', 'No supported, length-matched ordinary identifier');
            }
            if (!entries.length) throw fault('No supported ordinary identifiers', 'catalog', 'Ordinary channels');
            const did = await this._vacant(session, bank, [ORDINARY_DID], 'Find ordinary slot');
            return this._install(session, bank, did, entries, false, 'ordinary group');
        });
        if (group) await this._serve(session, bank, group);
    }
    _ramEntries(run, bank) {
        const definitions = catalog.roms[bank.rom].map((id) => catalog.definitions[id]);
        const corrections = correctionEntries(definitions, run.engine === 'N63T3');
        const wanted = run.timingOnly ? CORRECTION_IDS.map((id) => channels[id]) : RAM_CHANNELS;
        const entries = [];
        for (const channel of wanted) {
            const correction = corrections.find((entry) => entry.id === channel.id);
            if (correction) { entries.push(correction); continue; }
            const candidates = Array.from(new Set(definitions.filter((d) => normalize(d.name) === normalize(channel.name))));
            if (candidates.length === 1 && scalar(candidates[0], true)) entries.push({ id: channel.id, d: candidates[0] });
            else this._reason(bank, channel.id, 'unsupported', CORRECTION_IDS.includes(channel.id) ?
                'No verified correction slot layout for this ROM and engine' : channel.id === 29 && candidates.length ?
                    'Injection end-angle array element is unverified' : candidates.length > 1 ?
                        'Multiple ROM sources without a verified selection' : candidates.length ?
                            'Unsupported array or conversion' : 'No exact measurement definition in this ROM');
        }
        return entries;
    }
    async _selectRamGroup(session, bank, candidates, name) {
        while (candidates.length && this._active(session)) {
            const entries = candidates.shift();
            const did = await this._vacant(session, bank, RAM_DIDS, 'Find slot for ' + name);
            try {
                return await this._install(session, bank, did, entries, true, name);
            } catch (error) {
                if (!this._active(session)) return null;
                // Isolate an entry or a group-size limit after an explicit length/range
                // refusal. Access denials and ambiguous writes never trigger splitting.
                if (error.kind !== 'budget' && ![0x13, 0x31].includes(error.nrc)) throw error;
                this._issue(bank, name, error, false);
                if (entries.length === 1) this._reason(bank, entries[0].id, 'unsupported', error.message);
                else {
                    const mid = Math.ceil(entries.length / 2);
                    candidates.unshift(entries.slice(0, mid), entries.slice(mid));
                }
            }
        }
        return null;
    }
    async _ram(session, bank) {
        const start = await this._setup(session, bank, 'ram', async () => {
            const rom = await this._identifyRom(session, bank);
            if (!this._active(session)) return null;
            if (bank.rom !== rom) {
                bank.rom = rom;
                this.ctx.log.info('BM3 DME 0x' + hex(bank.target) + ' / identified ROM ' + rom);
                this.changed();
            }
            if (session.run.trackTiming && bank.timingRom !== bank.rom) {
                bank.timingRom = bank.rom; bank.timingPeaks = {};
            }
            const entries = this._ramEntries(session.run, bank);
            if (!entries.length) throw fault('No supported RAM channel definitions', 'catalog', 'Select RAM channels');
            const seed = entries.filter((entry) => CORRECTION_IDS.includes(entry.id));
            if (!seed.length) seed.push(entries.find(({ id }) => id === 38) || entries.find((entry) => !needsAmbient(entry)) || entries[0]);
            const fallback = entries.filter((entry) => !seed.includes(entry)).map((entry) => [entry]);
            const group = await this._selectRamGroup(session, bank, [seed].concat(fallback), 'RAM seed');
            if (!group) throw fault('DME refused the available RAM entries', 'catalog', 'Verify RAM seed');
            const remaining = entries.filter((entry) => !group.entries.includes(entry) &&
                (!bank.reasons[entry.id] || bank.reasons[entry.id].kind !== 'unsupported'));
            return { group, remaining };
        });
        if (!start) return;
        const poll = this._serve(session, bank, start.group);
        const expand = start.remaining.length ? this._expand(session, bank, start.remaining) : null;
        await Promise.all([poll, expand]);
    }
    async _expand(session, bank, entries) {
        const group = await this._setup(session, bank, 'expansion', async () => {
            const accepted = await this._selectRamGroup(session, bank, [entries], 'RAM expansion');
            if (!accepted) throw fault('DME refused the remaining RAM entries', 'catalog', 'Verify RAM expansion');
            entries.filter((entry) => !accepted.entries.includes(entry) && !bank.reasons[entry.id]).forEach((entry) => {
                this._reason(bank, entry.id, 'unsupported', 'Group was reduced after rejection; no additional verified slot');
            });
            return accepted;
        });
        if (group) await this._serve(session, bank, group);
    }
    async _install(session, bank, did, entries, ram, name) {
        const group = { did, entries, ram, name, bytes: entries.reduce((n, entry) => n + entry.d.bytes, 0),
            lastAt: 0, expiresAt: 0, hz: 0, failures: 0 };
        await this._define(session, bank, did, entries, ram, 'Define ' + name);
        try {
            const { uds } = await this._readGroup(session, bank, group, 'Verify ' + name, SETUP_DEADLINE_MS);
            if (!this._active(session)) throw fault('Acquisition stopped', 'cancelled', 'Verify ' + name);
            bank.groups.push(group);
            this._publish(bank, group, uds, session.run.trackTiming);
            this._issue(bank, name, null);
            this.ctx.log.info('BM3 DME 0x' + hex(bank.target) + ' / ' + (bank.rom || session.run.engine) +
                ' / verified ' + name + ' ' + hex(did, 4) + ' (' + entries.length + ' channels, ' + group.bytes + ' bytes)');
            return group;
        } catch (error) {
            if (error.kind === 'payload') this._quarantine(session, bank, did);
            await this._clear(session, bank, did);
            throw error;
        }
    }
    async _readGroup(session, bank, group, phase, timeoutMs) {
        const reply = await this._request(session, bank, phase, 0x22, word(group.did), { timeoutMs, length: group.bytes + 3 });
        group.timeoutMs = Math.min(SETUP_DEADLINE_MS, Math.max(POLL_DEADLINE_MS, Math.ceil(reply.elapsedMs * 1.5)));
        return reply;
    }
    _setValue(bank, entry, raw, expiresAt, ambient = NaN, trackTiming = false) {
        const value = displayValue(raw, entry, ambient);
        if (!Number.isFinite(value)) {
            delete bank.samples[entry.id];
            this._reason(bank, entry.id, 'unsupported', 'Unsupported measurement unit or conversion');
            return;
        }
        bank.samples[entry.id] = { value, expiresAt };
        delete bank.reasons[entry.id];
        if (trackTiming && CORRECTION_IDS.includes(entry.id) && Math.abs(value) <= 90) {
            bank.timingPeaks[entry.id] = Math.max(bank.timingPeaks[entry.id] || 0, Math.abs(value));
        }
    }
    _pressure(bank, now) {
        const ambient = bank.ambient;
        Object.keys(bank.pressure).forEach((id) => {
            const sample = bank.pressure[id];
            if (sample.expiresAt < now) { delete bank.pressure[id]; return; }
            if (!ambient || ambient.expiresAt < now) {
                delete bank.samples[id];
                this._reason(bank, id, 'ambient', 'Waiting for fresh ambient pressure on this DME');
                return;
            }
            this._setValue(bank, sample.entry, sample.raw, Math.min(sample.expiresAt, ambient.expiresAt), ambient.value);
        });
    }
    _publish(bank, group, uds, trackTiming) {
        const now = Date.now(), period = group.lastAt && !group.failures ? now - group.lastAt : 0;
        const freshMs = Math.max(MIN_FRESH_MS, Math.min(MAX_FRESH_MS, period * 1.5));
        group.lastAt = now; group.expiresAt = now + freshMs; group.hz = period > 0 ? 1000 / period : 0;
        let offset = 3;
        group.entries.forEach((entry) => {
            const raw = rawValue(uds, offset, entry.d, group.ram);
            offset += entry.d.bytes;
            if (entry.id === 1) {
                bank.ambient = entry.d.units === 'hPa' && Number.isFinite(raw) && raw > 0 ?
                    { value: raw, expiresAt: group.expiresAt } : null;
            }
            if (needsAmbient(entry)) bank.pressure[entry.id] = { entry, raw, expiresAt: group.expiresAt };
            else this._setValue(bank, entry, raw, group.expiresAt, NaN, trackTiming);
        });
        this._pressure(bank, now);
        this.changed();
    }
    async _serve(session, bank, group) {
        try {
            while (this._active(session)) {
                const cadence = session.run.timingOnly ? STATUS_POLL_MS : POLL_MS;
                await this._wait(session.run, group.retryAt ? group.retryAt - Date.now() : group.lastAt + cadence - Date.now());
                if (!this._active(session)) break;
                try {
                    const { uds } = await this._readGroup(session, bank, group, 'Poll ' + group.name, group.timeoutMs);
                    if (!this._active(session)) break;
                    this._publish(bank, group, uds, session.run.trackTiming);
                    group.failures = 0; group.retryAt = 0;
                    this._issue(bank, group.name, null);
                } catch (error) {
                    if (!this._active(session)) break;
                    const retry = retryable(error);
                    this._issue(bank, group.name, error, retry);
                    if (!retry) {
                        group.entries.forEach(({ id }) => {
                            delete bank.samples[id]; delete bank.pressure[id];
                            this._reason(bank, id, 'error', error.message);
                        });
                        if (group.entries.some(({ id }) => id === 1)) { bank.ambient = null; this._pressure(bank, Date.now()); }
                        if (error.kind === 'payload') this._quarantine(session, bank, group.did);
                        if (group.ram) this.identities.delete(bank.target);
                        break;
                    }
                    group.retryAt = Date.now() + retryDelay(++group.failures, error);
                }
            }
        } finally {
            bank.groups = bank.groups.filter((entry) => entry !== group);
            await this._clear(session, bank, group.did);
            this.changed();
        }
    }
    async _run(run) {
        if (!Object.prototype.hasOwnProperty.call(catalog.engines, run.engine)) throw new Error('Select the BM3 engine family in Settings');
        if (run.timingOnly && !run.trackTiming) throw new Error('Car Status timing requires an N63 or S63 engine profile');
        if (this.ctx.preview || !this.ctx.signals.hasNative()) throw new Error('Vehicle diagnostic transport unavailable');
        const unwatch = this.diagnostic.watchBm3((connection, status) => {
            run.connection = connection;
            if (!connection && run.active) {
                this.identities.clear();
                this._resetBanks(status);
                this.ctx.log.info('BM3 provider: ' + status);
            }
            this._wake(run);
            this.changed();
        });
        try {
            while (run.active) {
                if (!run.connection) { await this._wait(run, Infinity); continue; }
                const session = { run, connection: run.connection, owned: new Map() };
                this._resetBanks('');
                const work = [];
                for (const bank of this.banks) {
                    work.push(this._ram(session, bank).catch((error) => this._issue(bank, 'ram', error, false)));
                    if (!run.timingOnly) work.push(this._ordinary(session, bank).catch((error) => this._issue(bank, 'ordinary', error, false)));
                }
                try {
                    await Promise.all(work);
                } finally {
                    for (const { bank, did } of session.owned.values()) await this._clear(session, bank, did);
                }
                if (this._active(session)) await this._wait(run, Infinity);
            }
        } finally { unwatch(); }
    }
}
module.exports = { Bm3Feed };

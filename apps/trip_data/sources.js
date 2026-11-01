'use strict';
const DEFINITIONS = [
    { key: 'gps', iface: 'de.bmw.infotainment.navigation.positioning.Positioning', instance: 'Main_Instance', field: 'rawPositionData', read: true, staleMs: 5000 },
    { key: 'speed', iface: 'de.bmw.infotainment.vehicle.Vehicle2', field: 'statusCarSpeed2', read: true, staleMs: 3000 },
    { key: 'rpm', iface: 'de.bmw.infotainment.vehicle.CDS', field: 'statusEngineSpeed2', read: true, staleMs: 3000 },
    { key: 'gear', iface: 'de.bmw.infrastructure.VehicleInformation', field: 'statusGearboxDrive', read: false, staleMs: null },
    { key: 'gearSelection', iface: 'de.bmw.infrastructure.VehicleInformation', field: 'DataPowerTrain2', read: false, staleMs: null },
];
const NOTES = {
    ignition: 'Automatic recording uses fresh sustained engine RPM, not true ignition. Missing RPM is not engine-off; engine stop/start may divide engine sessions.',
    fuel: 'No validated consumption/flow source. Tank-level changes are not short-trip fuel consumption.',
    speed: 'Raw / 64 km/h, converted to mph; 65535 is unavailable.',
    rpm: 'Raw * 0.25 RPM; 65535 is unavailable.',
    gps: 'Distance assumes Wgs84Coordinate3D latitude/longitude are WGS84 degrees; not calibrated on-car. UTC must advance; receipt freshness alone is insufficient. Accuracy is not supplied. 3D height is converted from rawLengthMeter to feet; height reference and vertical response remain unconfirmed.',
    gear: 'Actual gearbox enum takes precedence; DataPowerTrain2 is fallback. N_OR_P/NP remain unresolved unless an explicit P/N selector resolves them. Change-driven values hold only while their provider remains connected. No D/S/M program or RPM/speed gear guess is inferred.',
    gearSelection: 'DataPowerTrain2 explicit selector/engaged-gear fallback, not a transmission-program inference.',
};
const SELECTIONS = { 1: 'N', 2: 'R', 3: 'P', 4: 'NP', 5: '1', 6: '2', 7: '3', 8: '4', 9: '5', 10: '6', 11: '7', 12: '8', 13: '9' };
const STAGES = { 1: 'P', 2: 'R', 3: 'N', 4: 'D', P: 'P', R: 'R', N: 'N', D: 'D' };
const FIX_MAX_AGE_MS = 5000, FIX_FUTURE_MS = 2000;
const mono = () => { const t = process.hrtime(); return t[0] * 1000 + t[1] / 1000000; };
function utcTime(raw) {
    const d = raw && raw.date, t = raw && raw.time;
    if (!d || !t || d.invalid !== false || t.invalid !== false ||
        ![d.year, d.month, d.day, t.hour, t.minute, t.seconds].every(Number.isInteger) ||
        d.year < 1980 || d.year > 9999 || d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31 ||
        t.hour < 0 || t.hour > 23 || t.minute < 0 || t.minute > 59 || t.seconds < 0 || t.seconds > 59) return null;
    const at = Date.UTC(d.year, d.month - 1, d.day, t.hour, t.minute, t.seconds), date = new Date(at);
    return date.getUTCFullYear() === d.year && date.getUTCMonth() === d.month - 1 && date.getUTCDate() === d.day ? at : null;
}
function decode(key, raw) {
    if (!raw || typeof raw !== 'object') return { state: 'invalid', note: 'Malformed payload' };
    if (key === 'gps') {
        const p = raw.position || {}, h = p.height || {};
        const coordinates = p.coordinatesValid === true && Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 &&
            Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180;
        const fix = ['FIX_2D', 'FIX_3D', 2, 3].includes(raw.fixType);
        const height = (raw.fixType === 'FIX_3D' || raw.fixType === 3) && p.heightValid === true && Number.isFinite(h.rawLengthMeter);
        return { state: coordinates || height ? 'live' : 'invalid',
            coordinates: coordinates && fix ? { latitude: p.latitude, longitude: p.longitude } : null,
            altitudeFt: height ? h.rawLengthMeter * 3.280839895013123 : null,
            quality: { coordinatesValid: coordinates && fix, heightValid: height, fixType: raw.fixType, accuracyMeters: null },
            sourceTime: raw.utcDateTime || null, fixTimeMs: utcTime(raw.utcDateTime), note: NOTES.gps };
    }
    if (key === 'gear' || key === 'gearSelection') {
        const v = raw[key === 'gear' ? 'statusActualGearDrive' : 'statusGearSelectionDrive'];
        let gear = null, stage = null;
        if (key === 'gear') {
            gear = typeof v === 'number' ? Number.isInteger(v) && v >= 3 && v <= 12 ? String(v - 2) : v === 1 ? 'R' : v === 2 ? 'NP' : null :
                /^G([1-9]|10)$/.test(v) ? v.slice(1) : v === 'R' ? 'R' : v === 'N_OR_P' ? 'NP' : null;
            stage = STAGES[raw.statusActualStageDrive] || null;
            if (gear === 'NP' && (stage === 'P' || stage === 'N')) gear = stage;
            else if (gear && stage && (stage === 'R' && gear !== 'R' || stage === 'D' && gear === 'R' || (stage === 'P' || stage === 'N') && gear !== stage)) gear = null;
        } else gear = typeof v === 'number' ? SELECTIONS[v] : /^(N|R|P|NP|_[1-9])$/.test(v) ? v.replace('_', '') : null;
        return { state: gear ? 'live' : 'invalid', value: gear || null, stage, source: key === 'gear' ? 'statusGearboxDrive' : 'DataPowerTrain2', note: NOTES[key] };
    }
    const value = raw[key === 'speed' ? 'speedVehicleCentreOfGravity' : 'actualValueRPMEngineCrankshaft'];
    const valid = Number.isInteger(value) && value >= 0 && value < 65535;
    return { state: valid ? 'live' : 'invalid',
        value: valid ? (key === 'speed' ? value / 64 * 0.621371 : value * 0.25) : null, note: NOTES[key] };
}
function deadline(p, ms, label) {
    let timer;
    return Promise.race([Promise.resolve(p), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).then((v) => { clearTimeout(timer); return v; }, (e) => { clearTimeout(timer); throw e; });
}
class Sources {
    constructor(ctx, changed) {
        this.ctx = ctx; this.signals = ctx.signals; this.changed = changed; this.connections = {};
        this.values = {}; this.closed = false; this.enabled = false; this.mode = 'off'; this.pollMs = 1000;
        this.fixSequence = 0; this.gpsFixes = []; this.lastFix = null; this.lastFixTime = null;
        DEFINITIONS.forEach((d) => { this.values[d.key] = { state: 'waiting', note: 'Recorder is not collecting', epoch: 0, coordinateEpoch: 0, receivedMono: null, receivedAt: null, raw: null }; });
        this.timer = setInterval(() => {
            if (!this.enabled) return;
            Object.keys(this.connections).forEach((key) => {
                const c = this.connections[key];
                if (c.available && c.def.read && !c.reading && mono() >= c.nextRead) this.read(c).catch(() => {});
            });
        }, 250);
        if (this.timer.unref) this.timer.unref();
    }
    alive(c) { return !this.closed && this.enabled && !c.closed && this.connections[c.def.key] === c; }
    state(key, state, note) {
        const old = this.values[key];
        this.values[key] = Object.assign({}, old, { state, note, epoch: old.epoch + 1,
            coordinateEpoch: (old.coordinateEpoch || 0) + 1 });
        if (key === 'gps') { this.lastFix = null; this.gpsFixes = []; }
        this.changed();
    }
    position(decoded, old, now, wall) {
        let epoch = old.coordinateEpoch || 0, state = 'invalid', note = 'Invalid coordinates, fix type or UTC';
        const sourceAge = Number.isFinite(decoded.fixTimeMs) ? wall - decoded.fixTimeMs : null;
        const valid = !!decoded.coordinates && sourceAge !== null && sourceAge >= -FIX_FUTURE_MS && sourceAge <= FIX_MAX_AGE_MS;
        if (valid && (this.lastFixTime === null || decoded.fixTimeMs > this.lastFixTime)) {
            if (this.lastFix && now - this.lastFix.receivedMono > FIX_MAX_AGE_MS) { epoch++; this.gpsFixes = []; }
            this.lastFix = { id: ++this.fixSequence, utcMs: decoded.fixTimeMs, coordinates: decoded.coordinates,
                coordinateEpoch: epoch, receivedMono: now, accuracyMeters: null };
            this.lastFixTime = decoded.fixTimeMs;
            this.gpsFixes = this.gpsFixes.filter((f) => now - f.receivedMono <= FIX_MAX_AGE_MS * 2).concat([this.lastFix]).slice(-64);
            state = 'live'; note = 'Unique advancing UTC fix; accuracy not supplied';
        } else if (valid && this.lastFix && decoded.fixTimeMs === this.lastFix.utcMs && now - this.lastFix.receivedMono <= FIX_MAX_AGE_MS) {
            state = 'live'; note = 'Repeated UTC fix; receipt is not a new position';
        } else {
            state = sourceAge !== null && sourceAge > FIX_MAX_AGE_MS ? 'stale' : 'invalid';
            note = valid ? 'Backward or repeated UTC without a continuous accepted fix' : state === 'stale' ? 'UTC fix is too old' : note;
            if (this.lastFix) epoch++;
            this.lastFix = null; this.gpsFixes = [];
        }
        return { positionState: state, positionNote: note, coordinateEpoch: epoch,
            coordinates: state === 'live' && this.lastFix ? this.lastFix.coordinates : null,
            fixId: this.lastFix ? this.lastFix.id : null,
            fixTimeMs: this.lastFix ? this.lastFix.utcMs : decoded.fixTimeMs,
            fixAdvancedMono: this.lastFix ? this.lastFix.receivedMono : null };
    }
    receive(c, raw) {
        if (!this.alive(c)) return;
        const key = c.def.key, decoded = decode(key, raw), old = this.values[key], now = mono(), wall = Date.now();
        const position = key === 'gps' ? this.position(decoded, old, now, wall) : {};
        this.values[key] = Object.assign({}, decoded, { raw, receivedAt: wall, receivedMono: now,
            epoch: old.epoch + (decoded.state === 'live' ? 0 : 1),
            heightEpoch: (old.heightEpoch || 0) + (old.quality && old.quality.heightValid && decoded.quality && !decoded.quality.heightValid ? 1 : 0) }, position);
        this.changed();
    }
    async open(def) {
        const c = { def, proxy: null, available: false, availabilityKnown: false, closed: false, reading: null, nextRead: 0, epoch: 0, waitTimer: null };
        this.connections[def.key] = c; this.state(def.key, 'waiting', 'Connecting');
        if (!this.signals.hasNative()) { this.state(def.key, 'unavailable', 'No live SOME/IP connection'); return; }
        try {
            const opening = this.signals.proxy(def.iface, def.instance || '1');
            opening.then((p) => { if (!this.alive(c)) this.dispose({ proxy: p }); }).catch(() => {});
            c.proxy = await deadline(opening, 5000, 'Connect');
            if (!this.alive(c)) return;
            await deadline(this.signals.onAvailable(c.proxy, (available) => {
                if (!this.alive(c) || c.availabilityKnown && c.available === available) return;
                c.available = available; c.availabilityKnown = true; c.epoch++;
                this.state(def.key, available ? 'waiting' : 'unavailable', available ? 'Waiting for data' : 'Provider unavailable');
                if (available) clearTimeout(c.waitTimer);
                if (available && def.read) this.read(c).catch(() => {});
            }), 2000, 'Availability subscription');
            if (!c.available) c.waitTimer = setTimeout(() => {
                if (this.alive(c) && !c.available) this.state(def.key, 'unavailable', 'No provider announcement');
            }, 5000);
            await deadline(this.signals.on(c.proxy, def.field, (raw) => {
                if (this.alive(c) && c.available) this.receive(c, raw);
            }, this.ctx.log), 2000, 'Field subscription');
        } catch (e) {
            if (!this.alive(c)) return;
            this.state(def.key, 'error', e.message); this.dispose(c);
        }
    }
    async read(c) {
        if (!this.alive(c) || !c.available) return;
        if (c.reading) return c.reading;
        const epoch = c.epoch;
        c.reading = (async () => {
            try {
                const raw = await deadline(this.signals.get(c.proxy, c.def.field, 1200), 1800, 'Read');
                if (!this.alive(c) || c.epoch !== epoch) return;
                this.receive(c, raw); c.nextRead = mono() + this.pollMs;
            } catch (e) {
                if (this.alive(c)) this.state(c.def.key, 'error', e.message);
                c.nextRead = mono() + 5000;
            }
        })();
        try { return await c.reading; } finally { c.reading = null; }
    }
    collect(mode, pollMs) {
        if (this.closed) return;
        this.pollMs = pollMs; this.enabled = true; this.mode = mode;
        DEFINITIONS.forEach((d) => {
            const wanted = mode === 'full' || d.key === 'rpm', c = this.connections[d.key];
            if (wanted && (!c || c.closed)) this.open(d);
            else if (!wanted && c) {
                this.dispose(c); delete this.connections[d.key];
                this.state(d.key, 'waiting', 'RPM-only engine-session monitor');
            }
        });
    }
    monitor(pollMs) { this.collect('monitor', pollMs); }
    start(pollMs) { this.collect('full', pollMs); }
    stop() {
        this.enabled = false; this.mode = 'off';
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
        this.connections = {};
        DEFINITIONS.forEach((d) => this.state(d.key, 'waiting', 'Recorder is not collecting'));
    }
    retry() { const mode = this.mode; this.stop(); if (mode !== 'off') this.collect(mode, this.pollMs); }
    dispose(c) {
        c.closed = true; clearTimeout(c.waitTimer);
        if (c.proxy && c.proxy.shutdown) Promise.resolve().then(() => c.proxy.shutdown()).catch((e) => this.ctx.log.warn(e));
    }
    sample(now) {
        const result = {};
        DEFINITIONS.forEach((d) => {
            const v = this.values[d.key], age = v.receivedMono === null ? null : Math.max(0, now - v.receivedMono);
            result[d.key] = Object.assign({}, v, { ageMs: age });
            if (d.staleMs !== null && age !== null && age > d.staleMs && v.state === 'live') {
                result[d.key].state = 'stale';
                result[d.key].value = null; result[d.key].coordinates = null; result[d.key].altitudeFt = null;
            }
        });
        const gps = result.gps;
        gps.fixAgeMs = gps.fixAdvancedMono === null || gps.fixAdvancedMono === undefined ? null : Math.max(0, now - gps.fixAdvancedMono);
        if (gps.positionState === 'live' && (gps.state !== 'live' || gps.fixAgeMs > FIX_MAX_AGE_MS || Date.now() - gps.fixTimeMs > FIX_MAX_AGE_MS)) {
            gps.positionState = 'stale'; gps.positionNote = 'UTC fix has not advanced within the bounded freshness window'; gps.coordinates = null;
        }
        gps.fixes = this.gpsFixes.map((f) => ({ id: f.id, utcMs: f.utcMs, coordinates: f.coordinates,
            coordinateEpoch: f.coordinateEpoch, ageMs: Math.max(0, now - f.receivedMono), accuracyMeters: null }));
        const actual = result.gear, selection = result.gearSelection;
        if (actual.state === 'live') {
            if (actual.value === 'NP' && selection.state === 'live' && (selection.value === 'N' || selection.value === 'P'))
                result.gear = Object.assign({}, actual, { value: selection.value, source: 'statusGearboxDrive+DataPowerTrain2', epoch: actual.epoch + ':' + selection.epoch });
        } else if (selection.state === 'live') result.gear = Object.assign({}, selection, { note: NOTES.gear });
        result.fuel = { state: 'unavailable', value: null, note: NOTES.fuel };
        result.ignition = { state: 'unavailable', note: NOTES.ignition };
        return result;
    }
    close() { this.stop(); this.closed = true; clearInterval(this.timer); }
}
module.exports = { Sources, DEFINITIONS, NOTES, mono };

'use strict';
const { FuelSource } = require('./fuel');
const DEFINITIONS = [
    { key: 'gps', iface: 'de.bmw.infotainment.navigation.positioning.Positioning', instance: 'Main_Instance', field: 'rawPositionData', read: true, pollMs: 1000, staleMs: 5000 },
    { key: 'speed', iface: 'de.bmw.infotainment.vehicle.Vehicle2', field: 'statusCarSpeed2', read: true, pollMs: 100, staleMs: 3000 },
    { key: 'rpm', iface: 'de.bmw.infotainment.vehicle.CDS', field: 'statusEngineSpeed2', read: true, pollMs: 100, staleMs: 3000 },
    { key: 'engine', iface: 'de.bmw.infotainment.vehicle.CDS', field: 'statusEngineStatus', read: true, pollMs: 1000, staleMs: 3000 },
    { key: 'fuelCounter', iface: 'de.bmw.infotainment.vehicle.CDS2', field: 'statusInjectionVolume', read: true, pollMs: 100, staleMs: 3000 },
    { key: 'range', iface: 'de.bmw.infotainment.KombiIF', field: 'statusRangeTankStatus', read: true, pollMs: 1000, staleMs: 30000 },
    { key: 'rangeFallback', iface: 'de.bmw.infrastructure.VehicleInformation', field: 'Range', read: false, staleMs: null },
    { key: 'gear', iface: 'de.bmw.infrastructure.VehicleInformation', field: 'statusGearboxDrive', read: false, staleMs: null },
    { key: 'gearSelection', iface: 'de.bmw.infrastructure.VehicleInformation', field: 'DataPowerTrain2', read: false, staleMs: null },
];
const NOTES = {
    ignition: 'Automatic recording uses the CDS engine-running enum, not ignition. Missing or invalid engine status is not engine-off; engine stop/start may divide engine sessions.',
    fuel: 'Upstream Live Data fuel path: physical DME diagnostic flow, then CDS2 injection-volume counter calibrated against fresh DME flow. US gallons/hour; stale/unsupported flow is unavailable, not zero. Tank changes are never consumption.',
    fuelCounter: 'CDS2.statusInjectionVolume.injectionVolumeFuelEngine is a wrapping raw counter, not litres. Its rate requires live diagnostic calibration for this collection session.',
    range: 'KombiIF.statusRangeTankStatus: mileageKilometre / 1.609344 miles; fluidLevelFuelTank / 3.785411784 US gallons. Invalid sentinels excluded; context only, not trip-distance or fuel-consumption deltas.',
    rangeFallback: 'VehicleInformation.Range is an event-only odometer fallback; never polled. Held only while its provider remains connected.',
    speed: 'Raw / 64 km/h, converted to mph; 65535 is unavailable.',
    rpm: 'Raw * 0.25 RPM; 65535 is unavailable.',
    engine: 'CDS.statusEngineStatus.statusEngineRunDrive: MOTOR_AUS/0 off, MOTOR_STARTET/1 starting, MOTOR_LAEUFT/2 running; 3 is unavailable. Same engine input as upstream Live Data trips.',
    gps: 'Position assumes Wgs84Coordinate3D latitude/longitude are WGS84 degrees; not calibrated on-car. UTC must advance; receipt freshness alone is insufficient. Accuracy is not supplied. 3D height is converted from rawLengthMeter to feet; height reference and vertical response remain unconfirmed. New trip distance uses vehicle speed; saved GPS-policy trips keep their original calculation.',
    gear: 'Actual gearbox enum takes precedence; DataPowerTrain2 is fallback. N_OR_P/NP remain unresolved unless an explicit P/N selector resolves them. Change-driven values hold only while their provider remains connected. No D/S/M program or RPM/speed gear guess is inferred.',
    gearSelection: 'DataPowerTrain2 explicit selector/engaged-gear fallback, not a transmission-program inference.',
    transport: 'Upstream SOME/IP speed/RPM streams and scaling; one proxy per interface/instance. Subscribe before reading; poll readable fields when notifications are silent. Acquisition cadence is independent of saved sample cadence. Event-only gears are never polled.',
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
    if (key === 'engine') {
        const rawValue = raw.statusEngineRunDrive;
        const value = rawValue === 0 || rawValue === 'MOTOR_AUS' ? 'off' :
            rawValue === 1 || rawValue === 'MOTOR_STARTET' ? 'starting' :
                rawValue === 2 || rawValue === 'MOTOR_LAEUFT' ? 'running' : null;
        return { state: value ? 'live' : 'invalid', value, note: NOTES.engine };
    }
    if (key === 'fuelCounter') {
        const value = raw.injectionVolumeFuelEngine;
        const valid = Number.isInteger(value) && value >= 0 && value <= 65535;
        return { state: valid ? 'live' : 'invalid', value: valid ? value : null, note: NOTES.fuelCounter };
    }
    if (key === 'range' || key === 'rangeFallback') {
        const odo = raw.mileageKilometre, tank = key === 'range' ? raw.fluidLevelFuelTank : null;
        const odometerMiles = Number.isFinite(odo) && odo >= 0 && odo < 16777215 ? odo / 1.609344 : null;
        const tankGallons = Number.isFinite(tank) && tank >= 0 && tank < 255 ? tank / 3.785411784 : null;
        return { state: odometerMiles !== null || tankGallons !== null ? 'live' : 'invalid',
            odometerMiles, tankGallons, note: NOTES[key] };
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
        value: valid ? (key === 'speed' ? value / 64 / 1.609344 : value * 0.25) : null, note: NOTES[key] };
}
function deadline(p, ms, label) {
    let timer;
    return Promise.race([Promise.resolve(p), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).then((v) => { clearTimeout(timer); return v; }, (e) => { clearTimeout(timer); throw e; });
}
class Sources {
    constructor(ctx, changed, Diag) {
        this.ctx = ctx; this.signals = ctx.signals; this.changed = changed; this.connections = {};
        this.values = {}; this.closed = false; this.enabled = false; this.mode = 'off';
        this.fixSequence = 0; this.gpsFixes = []; this.lastFix = null; this.lastFixTime = null;
        DEFINITIONS.forEach((d) => { this.values[d.key] = { state: 'waiting', note: 'Recorder is not collecting', epoch: 0, coordinateEpoch: 0, receivedMono: null, receivedAt: null, raw: null }; });
        this.fuel = new FuelSource(ctx, (sample) => this.fuelDelivery(sample), Diag);
        this.timer = setInterval(() => {
            if (!this.enabled) return;
            Object.keys(this.connections).forEach((key) => {
                const c = this.connections[key];
                this.fetch(c);
            });
        }, 50);
        if (this.timer.unref) this.timer.unref();
    }
    alive(c) { return !this.closed && this.enabled && !c.closed && this.connections[c.key] === c; }
    state(key, state, note) {
        const old = this.values[key];
        this.values[key] = Object.assign({}, old, { state, note, epoch: old.epoch + 1,
            coordinateEpoch: (old.coordinateEpoch || 0) + 1 });
        if (key === 'gps') { this.lastFix = null; this.gpsFixes = []; }
        if (key === 'fuelCounter') this.fuel.resetCounter();
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
    receive(c, def, raw) {
        if (!this.alive(c)) return;
        const key = def.key, decoded = decode(key, raw), old = this.values[key], now = mono(), wall = Date.now();
        const position = key === 'gps' ? this.position(decoded, old, now, wall) : {};
        this.values[key] = Object.assign({}, decoded, { raw, receivedAt: wall, receivedMono: now,
            epoch: old.epoch + (decoded.state === 'live' ? 0 : 1),
            heightEpoch: (old.heightEpoch || 0) + (old.quality && old.quality.heightValid && decoded.quality && !decoded.quality.heightValid ? 1 : 0) }, position);
        if (key === 'fuelCounter') {
            if (decoded.state === 'live') this.fuel.feed(decoded.value, now, wall);
            else this.fuel.resetCounter();
        }
        this.changed();
    }
    fuelDelivery(sample) { this.values.fuel = sample; this.changed(); }
    transport(c, state, note) { c.definitions.forEach((d) => this.state(d.key, state, note)); }
    async open(def) {
        const c = { key: def.key, definitions: def.definitions, proxy: null, available: false, availabilityKnown: false,
            closed: false, ready: false, reads: {}, versions: {}, notifiedAt: {}, nextRead: {}, epoch: 0, waitTimer: null };
        this.connections[c.key] = c; this.transport(c, 'waiting', 'Connecting');
        if (!this.signals.hasNative()) { this.transport(c, 'unavailable', 'No live SOME/IP connection'); return; }
        try {
            const opening = this.signals.proxy(def.iface, def.instance);
            opening.then((p) => { if (!this.alive(c)) this.dispose({ proxy: p }); }).catch(() => {});
            c.proxy = await deadline(opening, 5000, 'Connect');
            if (!this.alive(c)) return;
            await deadline(this.signals.onAvailable(c.proxy, (available) => {
                if (!this.alive(c) || c.availabilityKnown && c.available === available) return;
                c.available = available; c.availabilityKnown = true; c.epoch++;
                c.versions = {}; c.notifiedAt = {}; c.nextRead = {};
                this.transport(c, available ? 'waiting' : 'unavailable', available ? 'Waiting for data' : 'Provider unavailable');
                if (available) { clearTimeout(c.waitTimer); this.fetch(c); }
            }), 2000, 'Availability subscription');
            if (!c.available) c.waitTimer = setTimeout(() => {
                if (this.alive(c) && !c.available) this.transport(c, 'unavailable', 'No provider announcement');
            }, 5000);
            for (const d of c.definitions) {
                if (!this.alive(c)) return;
                try {
                    await deadline(this.signals.on(c.proxy, d.field, (raw) => {
                        if (!this.alive(c) || !c.available) return;
                        c.notifiedAt[d.key] = mono();
                        c.versions[d.key] = (c.versions[d.key] || 0) + 1;
                        if (d.read) c.nextRead[d.key] = c.notifiedAt[d.key] + d.pollMs;
                        this.receive(c, d, raw);
                    }, this.ctx.log), 2000, d.field + ' subscription');
                } catch (e) {
                    if (this.alive(c)) this.state(d.key, 'error', 'Subscription: ' + e.message + (d.read ? '; getter polling remains enabled' : ''));
                }
            }
            c.ready = true; this.fetch(c);
        } catch (e) {
            if (!this.alive(c)) return;
            this.transport(c, 'error', e.message); this.dispose(c);
        }
    }
    fetch(c) {
        if (!this.alive(c) || !c.available || !c.ready) return;
        const now = mono();
        c.definitions.forEach((d) => {
            if (!d.read || c.reads[d.key] || now < (c.nextRead[d.key] || 0)) return;
            if (c.notifiedAt[d.key] !== undefined && now - c.notifiedAt[d.key] < d.pollMs) return;
            this.read(c, d).catch(() => {});
        });
    }
    read(c, def) {
        if (!this.alive(c) || !c.available || !c.ready || !def.read) return Promise.resolve();
        const key = def.key;
        if (c.reads[key]) return c.reads[key].promise;
        const epoch = c.epoch, version = c.versions[key] || 0;
        const op = { promise: null, expiresAt: mono() + 1800, expired: false };
        c.reads[key] = op; c.nextRead[key] = mono() + def.pollMs;
        // Native calls can wait in the kit queue after our local deadline or stop.
        const guarded = { getValue: (field, timeout) => {
            const remaining = op.expiresAt - mono();
            if (!this.alive(c) || !c.available || c.epoch !== epoch || op.expired || remaining <= 0 ||
                (c.versions[key] || 0) !== version) throw new Error('Connection or stream changed before read dispatch');
            c.nextRead[key] = mono() + def.pollMs;
            return c.proxy.getValue(field, Math.min(timeout, Math.max(1, Math.floor(remaining))));
        } };
        const request = Promise.resolve().then(() => this.signals.get(guarded, def.field, 1200));
        // Keep the field locked until native settlement, not merely our timeout.
        const settled = request.then((raw) => {
            if (c.reads[key] === op) delete c.reads[key];
            return raw;
        }, (error) => {
            if (c.reads[key] === op) delete c.reads[key];
            throw error;
        });
        op.promise = deadline(settled, 1800, def.field + ' read').then((raw) => {
            if (this.alive(c) && c.available && c.epoch === epoch && (c.versions[key] || 0) === version)
                this.receive(c, def, raw);
        }).catch((error) => {
            if (this.alive(c) && c.available && c.epoch === epoch && (c.versions[key] || 0) === version) {
                c.nextRead[key] = mono() + 5000;
                this.state(key, 'error', error.message);
            }
        }).then(() => { op.expired = true; });
        return op.promise;
    }
    collect(mode) {
        if (this.closed) return;
        this.enabled = true; this.mode = mode;
        if (mode === 'full') this.fuel.start(); else this.fuel.stop();
        const wanted = {};
        DEFINITIONS.forEach((d) => {
            if (mode !== 'full' && d.key !== 'engine') return;
            const instance = d.instance || '1', key = d.iface + ':' + instance;
            if (!wanted[key]) wanted[key] = { key, iface: d.iface, instance, definitions: [] };
            wanted[key].definitions.push(d);
        });
        Object.keys(this.connections).forEach((key) => {
            const c = this.connections[key];
            if (wanted[key] && !c.closed && c.definitions.length === wanted[key].definitions.length) return;
            this.dispose(c); delete this.connections[key];
            c.definitions.forEach((d) => this.state(d.key, 'waiting', 'Engine-status session monitor'));
        });
        Object.keys(wanted).forEach((key) => { if (!this.connections[key]) this.open(wanted[key]); });
    }
    monitor() { this.collect('monitor'); }
    start() { this.collect('full'); }
    stop() {
        this.enabled = false; this.mode = 'off';
        this.fuel.stop();
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
        this.connections = {};
        DEFINITIONS.forEach((d) => this.state(d.key, 'waiting', 'Recorder is not collecting'));
    }
    retry() { const mode = this.mode; this.stop(); if (mode !== 'off') this.collect(mode); }
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
        const range = result.range, fallback = result.rangeFallback;
        const odo = range.state === 'live' && Number.isFinite(range.odometerMiles) ? range :
            fallback.state === 'live' && Number.isFinite(fallback.odometerMiles) ? fallback : null;
        result.odometer = Object.assign({}, odo || range, { state: odo ? 'live' : range.state === 'live' ? 'invalid' : range.state,
            value: odo ? odo.odometerMiles : null, source: odo === fallback ? 'VehicleInformation.Range' : 'KombiIF.statusRangeTankStatus' });
        result.tank = Object.assign({}, range, { state: range.state === 'live' && Number.isFinite(range.tankGallons) ? 'live' :
            range.state === 'live' ? 'invalid' : range.state, value: range.state === 'live' ? range.tankGallons : null,
            source: 'KombiIF.statusRangeTankStatus' });
        result.fuel = this.fuel.sample(now);
        result.ignition = { state: 'unavailable', note: NOTES.ignition };
        return result;
    }
    close() { this.stop(); this.closed = true; clearInterval(this.timer); this.fuel.close(); }
}
module.exports = { Sources, DEFINITIONS, NOTES, mono };

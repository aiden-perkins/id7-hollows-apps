'use strict';
const DEFINITIONS = [
    { key: 'gps', iface: 'de.bmw.infotainment.navigation.positioning.Positioning', instance: 'Main_Instance', field: 'rawPositionData', read: true, staleMs: 5000 },
    { key: 'speed', iface: 'de.bmw.infotainment.vehicle.Vehicle2', field: 'statusCarSpeed2', read: true, staleMs: 3000 },
    { key: 'rpm', iface: 'de.bmw.infotainment.vehicle.CDS', field: 'statusEngineSpeed2', read: true, staleMs: 3000 },
    { key: 'gear', iface: 'de.bmw.infrastructure.VehicleInformation', field: 'DataPowerTrain2', read: false, staleMs: 3000 },
];
const NOTES = {
    ignition: 'No validated ignition-on/off source; infotainment power and engine stop/start are not ignition boundaries.',
    fuel: 'No validated consumption/flow source. Tank-level changes are not short-trip fuel consumption.',
    speed: 'Raw / 64 km/h, converted to mph; 65535 is unavailable.',
    rpm: 'Raw * 0.25 RPM; 65535 is unavailable.',
    gps: '3D height converted from rawLengthMeter to feet; height reference, accuracy and vertical response unconfirmed.',
    gear: 'Catalog-reported selector enums; NP stays unresolved. No transmission program is inferred.',
};
const GEARS = { 1: 'N', 2: 'R', 3: 'P', 4: 'NP', 5: '1', 6: '2', 7: '3', 8: '4', 9: '5', 10: '6', 11: '7', 12: '8', 13: '9' };
const mono = () => { const t = process.hrtime(); return t[0] * 1000 + t[1] / 1000000; };
function decode(key, raw) {
    if (!raw || typeof raw !== 'object') return { state: 'invalid', note: 'Malformed payload' };
    if (key === 'gps') {
        const p = raw.position || {}, h = p.height || {};
        const coordinates = p.coordinatesValid === true && Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 &&
            Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180;
        const height = (raw.fixType === 'FIX_3D' || raw.fixType === 3) && p.heightValid === true && Number.isFinite(h.rawLengthMeter);
        return { state: coordinates || height ? 'live' : 'invalid',
            coordinates: coordinates ? { latitude: p.latitude, longitude: p.longitude } : null,
            altitudeFt: height ? h.rawLengthMeter * 3.280839895013123 : null,
            quality: { coordinatesValid: coordinates, heightValid: height, fixType: raw.fixType },
            sourceTime: raw.utcDateTime || null, note: NOTES.gps };
    }
    if (key === 'gear') {
        const v = raw.statusGearSelectionDrive;
        const gear = typeof v === 'number' ? GEARS[v] : /^(N|R|P|NP|_[1-9])$/.test(v) ? v.replace('_', '') : null;
        return { state: gear ? 'live' : 'invalid', value: gear || null, note: NOTES.gear };
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
        this.values = {}; this.closed = false; this.enabled = false; this.pollMs = 1000;
        DEFINITIONS.forEach((d) => { this.values[d.key] = { state: 'waiting', note: 'Recorder is not collecting', epoch: 0, receivedMono: null, receivedAt: null, raw: null }; });
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
        this.values[key] = Object.assign({}, old, { state, note, epoch: old.epoch + 1 });
        this.changed();
    }
    receive(c, raw) {
        if (!this.alive(c)) return;
        const key = c.def.key, decoded = decode(key, raw), old = this.values[key];
        this.values[key] = Object.assign({}, decoded, { raw, receivedAt: Date.now(), receivedMono: mono(),
            epoch: old.epoch + (decoded.state === 'live' ? 0 : 1),
            coordinateEpoch: (old.coordinateEpoch || 0) + (old.quality && old.quality.coordinatesValid && decoded.quality && !decoded.quality.coordinatesValid ? 1 : 0),
            heightEpoch: (old.heightEpoch || 0) + (old.quality && old.quality.heightValid && decoded.quality && !decoded.quality.heightValid ? 1 : 0) });
        this.changed();
    }
    async open(def) {
        const c = { def, proxy: null, available: false, closed: false, reading: null, nextRead: 0, epoch: 0, waitTimer: null };
        this.connections[def.key] = c; this.state(def.key, 'waiting', 'Connecting');
        if (!this.signals.hasNative()) { this.state(def.key, 'unavailable', 'No live SOME/IP connection'); return; }
        try {
            const opening = this.signals.proxy(def.iface, def.instance || '1');
            opening.then((p) => { if (!this.alive(c)) this.dispose({ proxy: p }); }).catch(() => {});
            c.proxy = await deadline(opening, 5000, 'Connect');
            if (!this.alive(c)) return;
            await deadline(this.signals.onAvailable(c.proxy, (available) => {
                if (!this.alive(c)) return;
                c.available = available; c.epoch++;
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
    start(pollMs) {
        if (this.closed) return;
        this.pollMs = pollMs;
        if (this.enabled) return;
        this.enabled = true; DEFINITIONS.forEach((d) => this.open(d));
    }
    stop() {
        this.enabled = false;
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
        this.connections = {};
        DEFINITIONS.forEach((d) => this.state(d.key, 'waiting', 'Recorder is not collecting'));
    }
    retry() { const wanted = this.enabled; this.stop(); if (wanted) this.start(this.pollMs); }
    dispose(c) {
        c.closed = true; clearTimeout(c.waitTimer);
        if (c.proxy && c.proxy.shutdown) Promise.resolve().then(() => c.proxy.shutdown()).catch((e) => this.ctx.log.warn(e));
    }
    sample(now) {
        const result = {};
        DEFINITIONS.forEach((d) => {
            const v = this.values[d.key], age = v.receivedMono === null ? null : Math.max(0, now - v.receivedMono);
            result[d.key] = Object.assign({}, v, { ageMs: age });
            if (age !== null && age > d.staleMs && v.state === 'live') {
                result[d.key].state = 'stale';
                result[d.key].value = null; result[d.key].coordinates = null; result[d.key].altitudeFt = null;
            }
        });
        result.fuel = { state: 'unavailable', value: null, note: NOTES.fuel };
        result.ignition = { state: 'unavailable', note: NOTES.ignition };
        return result;
    }
    close() { this.stop(); this.closed = true; clearInterval(this.timer); }
}
module.exports = { Sources, DEFINITIONS, NOTES, mono };

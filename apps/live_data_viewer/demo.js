'use strict';
const Sim = require('./kit/sim');
const D = require('./definitions');

const units = {
    rpm: 'rpm', speed: 'mph', boost: 'psi', torque: 'lb-ft', horsepower: 'hp',
    brakePressure: 'bar', accelerator: '%', steering: 'deg', frontAxle: 'deg', gLat: 'g', gLong: 'g', altitude: 'ft',
    voltage: 'V', tankTotal: 'L', tankLeft: 'L', tankRight: 'L',
    oil: 'F', coolant: 'F', transmission1: 'F', transmission2: 'F', converter: 'F',
    iatBank1: 'F', iatBank2: 'F', outside: 'F', chargeAir: 'F', cabin: 'F',
    oilPressure: 'psi', transmissionPressure: 'psi', fuelHighActual: 'psi', fuelHighTarget: 'psi', fuelLowActual: 'psi', fuelLowTarget: 'psi',
};
const wheels = ['FLH', 'FRH', 'RLH', 'RRH'];
wheels.forEach((wheel) => { units['pressure' + wheel] = 'psi'; units['target' + wheel] = 'psi'; units['tyreTemp' + wheel] = 'F'; });
for (let cylinder = 1; cylinder <= 8; cylinder++) {
    units['timingCorrection' + cylinder] = 'deg'; units['misfire' + cylinder] = 'count'; units['knock' + cylinder] = 'count';
}

// Upstream's drive supplies motion/powertrain; other channels are illustrative only.
// Metadata and samples are private to this model: no live decoder or source is changed.
class Demo {
    constructor(settings) {
        this.settings = settings; this.definitions = {}; this.readings = {};
        this.at = Date.now() - 600000; this.startedAt = this.at;
        this.sim = new Sim(); this.sim.t0 = this.at;
        D.definitions.forEach((d) => {
            this.definitions[d.id] = Object.assign({}, d, { source: 'demo', decoder: 'demo',
                numeric: !!units[d.id], unit: units[d.id] || '', counterPeriod: 'simulated demo session' });
            this.readings[d.id] = { decoded: { state: 'unavailable', note: 'No simulated channel' },
                min: null, max: null, history: [] };
        });
        this.advance(Date.now());
    }
    state(d) { return this.readings[d.id].decoded; }
    advance(now) {
        let data;
        while (this.at + 50 <= now) {
            this.at += 50; data = this.sim.sample(this.at);
            if ((this.at - this.startedAt) % 500 === 0) this.record(data);
        }
        if (data) this.record(data);
    }
    record(data) {
        const seconds = (this.at - this.startedAt) / 1000, wave = Math.sin(seconds / 19);
        const tank = Math.max(0, 38.562 - seconds / 600), highTarget = 1800 + data.throttle * 900;
        const values = {
            rpm: data.rpm, speed: data.speed / 1.609344, boost: data.throttle * 22,
            torque: data.torque * 0.7375621492772656, horsepower: data.torque * data.rpm * (2 * Math.PI / 60) / 745.6998715822702,
            brakePressure: Math.max(0, -data.gLong) * 70, accelerator: data.throttle * 100,
            steering: data.gLat * 32, frontAxle: data.gLat * 4, gLat: data.gLat, gLong: data.gLong,
            altitude: 1240 + 160 * Math.sin(seconds / 90), voltage: 14.32 + wave * 0.12,
            tankTotal: tank, tankLeft: tank * 0.499, tankRight: tank * 0.501,
            oil: data.oil * 1.8 + 32, coolant: data.coolant * 1.8 + 32,
            transmission1: 185 + wave * 4, transmission2: 188 + Math.sin(seconds / 23) * 4, converter: 197 + wave * 5,
            iatBank1: 91 + data.throttle * 9, iatBank2: 94 + data.throttle * 8, outside: 68 + wave,
            chargeAir: 89 + data.throttle * 12, cabin: 72 + wave * 0.5,
            oilPressure: 32 + data.rpm / 150, transmissionPressure: 72 + data.throttle * 18,
            fuelHighActual: highTarget + wave * 35, fuelHighTarget: highTarget, fuelLowActual: 74 + wave * 2, fuelLowTarget: 75,
            gear: data.gear ? String(data.gear) : 'P', gearProgram: 'M', driveMode: 'SPORT EXPERT', traction: 'DSC ON',
            parkingBrake: 'RELEASED', kickdown: data.throttle > 0.9 ? 'ENGAGED' : 'RELEASED',
            brakePedal: data.gLong < -0.1 ? 'PRESSED' : 'RELEASED',
        };
        wheels.forEach((wheel, index) => {
            values['pressure' + wheel] = 34.8 + index * 0.4 + wave * 0.1;
            values['target' + wheel] = 35; values['tyreTemp' + wheel] = 87 + index * 2 + wave * 2;
        });
        for (let cylinder = 1; cylinder <= 8; cylinder++) {
            values['timingCorrection' + cylinder] = -(cylinder % 4) * 0.4 - data.throttle * 0.2;
            values['misfire' + cylinder] = cylinder === 6 ? Math.floor(seconds / 46) : 0;
            values['knock' + cylinder] = cylinder === 3 ? Math.floor(seconds / 60) : cylinder === 7 ? Math.floor(seconds / 90) : 0;
        }
        Object.keys(this.readings).forEach((id) => {
            const value = values[id], r = this.readings[id];
            if (value === undefined) return;
            r.decoded = { state: 'live', value, unit: units[id] || '', quality: 'SIMULATED DEMO DATA; not vehicle measurements' };
            if (!Number.isFinite(value)) return;
            r.min = r.min === null ? value : Math.min(r.min, value);
            r.max = r.max === null ? value : Math.max(r.max, value);
            const last = r.history[r.history.length - 1];
            if (!last || this.at - last.at >= 500) r.history.push({ at: this.at, value });
            else last.value = value;
            while (r.history.length && (r.history[0].at < this.at - 600000 || r.history.length > 1201)) r.history.shift();
        });
    }
}
module.exports = Demo;

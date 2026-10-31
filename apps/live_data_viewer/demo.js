'use strict';
const VitalsDemo = require('./vitals_demo');
const D = require('./definitions');

const units = {
    rpm: 'rpm', speed: 'mph', boost: 'psi', torque: 'lb-ft', horsepower: 'hp',
    brakePressure: 'bar', accelerator: '%', steering: 'deg', frontAxle: 'deg', rearAxle: 'deg', gLat: 'g', gLong: 'g', gForce: 'g', altitude: 'ft',
    voltage: 'V', tankTotal: 'L', tankLeft: 'L', tankRight: 'L',
    oil: 'F', coolant: 'F', transmission1: 'F', transmission2: 'F', converter: 'F',
    iat: 'F', iatBank1: 'F', iatBank2: 'F', outside: 'F', chargeAir: 'F', preThrottleAir: 'F', cabin: 'F',
    chargeCoolerCoolant: 'F', exhaustBank1: 'F', exhaustBank2: 'F', catalystBank1: 'F', catalystBank2: 'F',
    transferCase: 'F', rearDifferential: 'F', frontPower: 'hp', rearPower: 'hp', rearTorqueShare: '%',
    oilPressure: 'psi', transmissionPressure: 'psi', fuelHighActual: 'psi', fuelHighTarget: 'psi', fuelLowActual: 'psi', fuelLowTarget: 'psi',
};
['Front', 'Rear'].forEach((axle) => {
    units['sway' + axle + 'Current'] = 'A'; units['sway' + axle + 'Torque'] = 'Nm';
    units['sway' + axle + 'MotorTarget'] = 'Nm'; units['sway' + axle + 'MotorActual'] = 'Nm';
    units['sway' + axle + 'MotorAngle'] = 'rad';
});
['Right', 'Left'].forEach((side) => {
    units['exhaustCommand' + side] = '%'; units['exhaustOutput' + side] = '%';
});
const wheels = ['FLH', 'FRH', 'RLH', 'RRH'];
wheels.forEach((wheel) => { units['pressure' + wheel] = 'psi'; units['target' + wheel] = 'psi'; units['tyreTemp' + wheel] = 'F'; units['wheelSpeed' + wheel] = 'mph'; });
for (let cylinder = 1; cylinder <= 8; cylinder++) {
    units['timingCorrection' + cylinder] = 'deg'; units['misfire' + cylinder] = 'count'; units['knock' + cylinder] = 'V*ms';
}
// Twelve-second loop: straight, sharp left, recover, sharp right, recover.
// Smooth turn-in/out with a held corner: motor position must stop changing during the hold.
function corneringDemand(seconds) {
    const cycle = Math.max(0, seconds) % 12, at = cycle % 6;
    if (at < 1 || at >= 4.2) return 0;
    const ramp = at < 1.6 ? (at - 1) / 0.6 : at < 3.5 ? 1 : (4.2 - at) / 0.7;
    return (cycle < 6 ? 1 : -1) * ramp * ramp * (3 - 2 * ramp);
}


// M Vitals' unmodified demo supplies longitudinal motion/powertrain; cornering and other channels are illustrative only.
// Metadata and samples are private to this model: no live decoder or source is changed.
class Demo {
    constructor(settings, driveMode) {
        this.settings = settings; this.driveMode = driveMode; this.definitions = {}; this.readings = {};
        this.at = Date.now(); this.startedAt = this.at;
        this.swayStartedAt = null;
        this.sim = new VitalsDemo();
        D.definitions.forEach((d) => {
            this.definitions[d.id] = Object.assign({}, d, { source: 'demo', decoder: 'demo',
                numeric: !!units[d.id], unit: units[d.id] || '', counterPeriod: 'simulated demo session' });
            this.readings[d.id] = { decoded: { state: 'unavailable', note: 'No simulated channel' },
                min: null, max: null, history: [] };
        });
        this.record(this.sim.sample());
    }
    state(d) { return this.readings[d.id].decoded; }
    advance(now) {
        this.at = now;
        // Preview startup advances its clock before drawing; start the manoeuvre on the first update.
        if (this.swayStartedAt === null) this.swayStartedAt = now;
        this.record(this.sim.sample());
    }
    record(data) {
        data.throttle = data.powerPct / 100;
        const seconds = (this.at - this.startedAt) / 1000, wave = Math.sin(seconds / 19);
        const tank = Math.max(0, 38.562 - seconds / 600), highTarget = 1800 + data.throttle * 900;
        const swaySeconds = this.swayStartedAt === null ? 0 : (this.at - this.swayStartedAt) / 1000;
        const demand = corneringDemand(swaySeconds), response = corneringDemand(swaySeconds - 0.16);
        const motorPosition = corneringDemand(swaySeconds - 0.28), lateralG = demand * 0.8;
        const turnAt = swaySeconds % 6, direction = swaySeconds % 12 < 6 ? 'LEFT' : 'RIGHT';
        this.swayDemoPhase = turnAt < 1 || turnAt >= 4.5 ? 'STRAIGHT' :
            'SHARP ' + direction + (turnAt < 1.6 ? ' / TURN-IN' : turnAt < 3.5 ? ' / HOLD' : ' / UNWIND');
        const horsepower = data.torque * data.rpm * (2 * Math.PI / 60) / 745.6998715822702;
        const values = {
            rpm: data.rpm, speed: data.speed / 1.609344, boost: data.boost * 14.503773773020923,
            torque: data.torque * 0.7375621492772656, horsepower,
            brakePressure: Math.max(0, -data.gLong) * 70, accelerator: data.throttle * 100,
            steering: lateralG * 32, frontAxle: lateralG * 4, rearAxle: -lateralG * 0.8, gLat: lateralG, gLong: data.gLong,
            gForce: Math.hypot(lateralG, data.gLong),
            altitude: 1240 + 160 * Math.sin(seconds / 90), voltage: 14.32 + wave * 0.12,
            tankTotal: tank, tankLeft: tank * 0.499, tankRight: tank * 0.501,
            oil: data.oil * 1.8 + 32, coolant: data.coolant * 1.8 + 32,
            transmission1: 185 + wave * 4, transmission2: 188 + Math.sin(seconds / 23) * 4, converter: 197 + wave * 5,
            iat: 90 + data.throttle * 10,
            iatBank1: 91 + data.throttle * 9, iatBank2: 94 + data.throttle * 8, outside: 68 + wave,
            chargeAir: 89 + data.throttle * 12, preThrottleAir: 92 + data.throttle * 13, cabin: 72 + wave * 0.5,
            chargeCoolerCoolant: 85 + data.throttle * 10, exhaustBank1: 650 + data.throttle * 450,
            exhaustBank2: 665 + data.throttle * 440, catalystBank1: 790 + data.throttle * 380,
            catalystBank2: 805 + data.throttle * 375, transferCase: 125 + wave * 5, rearDifferential: 140 + wave * 6,
            frontPower: horsepower * 0.35,
            rearPower: horsepower * 0.65,
            rearTorqueShare: 65,
            exhaust: data.throttle > 0.5 ? 'OPEN' : 'CLOSED', exhaustRight: data.throttle > 0.5 ? 'OPEN' : 'CLOSED',
            exhaustLeft: data.throttle > 0.5 ? 'OPEN' : 'CLOSED',
            oilPressure: 32 + data.rpm / 150, transmissionPressure: 72 + data.throttle * 18,
            fuelHighActual: highTarget + wave * 35, fuelHighTarget: highTarget, fuelLowActual: 74 + wave * 2, fuelLowTarget: 75,
            driveMode: this.driveMode, traction: 'DSC ON',
            parkingBrake: 'RELEASED', kickdown: data.throttle > 0.9 ? 'ENGAGED' : 'RELEASED',
            brakePedal: data.gLong < -0.1 ? 'PRESSED' : 'RELEASED',
        };
        ['Front', 'Rear'].forEach((axle, index) => {
            // One cornering demand drives every sway channel; fixed delays illustrate controller response.
            // Amplitudes and polarity are illustrative, not a measured motor/bar ratio or vehicle calibration.
            const motorTorque = index ? 4.5 : 6;
            values['sway' + axle + 'Current'] = Math.abs(response) * (index ? 8 : 11);
            values['sway' + axle + 'Torque'] = response * (index ? 420 : 560);
            values['sway' + axle + 'MotorTarget'] = demand * motorTorque;
            values['sway' + axle + 'MotorActual'] = response * motorTorque;
            values['sway' + axle + 'MotorAngle'] = motorPosition * (index ? 1.8 : 2.4);
            values['sway' + axle + 'Status'] = demand || response || motorPosition ? 'ACTIVE' : 'READY';
        });
        ['Right', 'Left'].forEach((side) => {
            values['exhaustCommand' + side] = data.throttle > 0.5 ? 10 : 90;
            values['exhaustOutput' + side] = data.throttle > 0.5 ? 10 : 90;
        });
        wheels.forEach((wheel, index) => {
            values['pressure' + wheel] = 34.8 + index * 0.4 + wave * 0.1;
            values['target' + wheel] = 35; values['tyreTemp' + wheel] = 87 + index * 2 + wave * 2;
            values['wheelSpeed' + wheel] = data.speed / 1.609344;
            values['wheelDirection' + wheel] = data.speed > 0.1 ? 'FORWARD' : 'STANDSTILL';
        });
        for (let cylinder = 1; cylinder <= 8; cylinder++) {
            values['timingCorrection' + cylinder] = -(cylinder % 4) * 0.4 - data.throttle * 0.2;
            values['misfire' + cylinder] = cylinder === 6 ? Math.floor(seconds / 46) : 0;
            values['knock' + cylinder] = 0.06 + cylinder * 0.009 + data.throttle * 0.04 + wave * 0.004;
        }
        Object.keys(this.readings).forEach((id) => {
            const value = values[id], r = this.readings[id];
            if (value === undefined) return;
            r.decoded = { state: 'live', value, unit: units[id] || '', quality: 'SIMULATED DEMO DATA; not vehicle measurements' };
            if (!Number.isFinite(value)) return;
            r.min = r.min === null ? value : Math.min(r.min, value);
            r.max = r.max === null ? value : Math.max(r.max, value);
            let point = r.history[r.history.length - 1];
            if (!point || this.at - point.at >= 500) { point = { at: this.at, value }; r.history.push(point); }
            else point.value = value;
            if (id === 'gForce') { point.lateral = values.gLat; point.longitudinal = values.gLong; }
            while (r.history.length && (r.history[0].at < this.at - 600000 || r.history.length > 1201)) r.history.shift();
        });
    }
}
module.exports = Demo;

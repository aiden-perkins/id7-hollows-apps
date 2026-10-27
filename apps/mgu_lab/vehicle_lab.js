'use strict';
const D = require('./domain');

const DEFINITIONS = [
    { key: 'exterior', group: 'lights', label: 'Exterior light controls', iface: 'de.bmw.body.drivinglight.LightswitchOperation',
        fields: ['mainLightswitchState', 'lightswitchButtonAvailability', 'foglightFront', 'foglightRear', 'headlampRangeAdjustment'],
        events: ['showLightswitchOperationFeedback'], poll: 2000 },
    { key: 'lamps', group: 'lights', label: 'Body lighting signals', iface: 'de.bmw.body.Light', fields: ['LowBeam'],
        events: ['LampExterior', 'statusOperationLightExterior', 'IndicatorSteeringColumnComplete'] },
    { key: 'fuel', group: 'fuel', label: 'Left / right fuel levels', iface: 'de.bmw.infotainment.KombiIF',
        fields: ['statusRangeTankStatus'], poll: 2000 },
    { key: 'fuelEstimate', group: 'fuel', label: 'Fuel estimates', iface: 'de.bmw.infotainment.lsc.LSCDataSink',
        events: ['fuelSupply', 'dataCombinedInstrumentCluster', 'mileageRange'] },
    { key: 'tpms', group: 'tpms', label: 'TPMS status', iface: 'de.bmw.infotainment.vehicle.TPMS',
        fields: ['statusTyrePressure', 'statusTyreTemperature', 'statusTargetTyrePressure', 'statusTyreState', 'statusTyresStatus',
            'statusFrontAxleTyre', 'statusRearAxleTyre', 'statusSummerTyre', 'statusWinterTyre', 'statusAvailableTypeTyreList', 'tyreParkSupervision'],
        events: ['statusAvailableTypeTyreListEvent'], poll: 5000 },
    { key: 'tpmsInternal', group: 'tpms', label: 'TPMS identities / radio', iface: 'de.bmw.infotainment.vehicle.TPMSInternalData',
        fields: ['tpmsInternalLastValues', 'controlRadioreceiverTpms1', 'controlRadioreceiverTpms2', 'controlRadioreceiverTpms3',
            'controlRadioreceiverTpms4', 'tyreDataRadioReceiver', 'tpmsCalibrationData', 'qrCodeData', 'tireMileageData',
            'tpmsErfsActualTireData', 'statusWheelTypeChange'], poll: 5000 },
    { key: 'pedal', group: 'inputs', label: 'Accelerator pedal', iface: 'de.bmw.powertrain.AcceleratorPedal',
        events: ['AngleAcceleratorPedal'] },
    { key: 'steering', group: 'inputs', label: 'Steering / front axle', iface: 'de.bmw.infotainment.drivingexcitement.XView',
        fields: ['statusSteeringAngleDriver', 'statusFrontAxleSteeringAngle'], poll: 1000 },
    { key: 'steeringChassis', group: 'inputs', label: 'Chassis steering', iface: 'de.bmw.chassis.SteeringAngle',
        events: ['ActualSteeringAngleDriver', 'actualSteeringAngleDriverNoCRC', 'SteeringAngleFrontAxleEffective'] },
    { key: 'braking', group: 'inputs', label: 'Driver braking status', iface: 'de.bmw.chassis.VehicleStabilizationManagement',
        events: ['StabilizationManagement'] },
].map((def) => Object.assign({ optional: true }, def));

const GROUPS = [
    { id: 'lights', state: 'VEHICLE_LIGHTS', title: 'Exterior lighting',
        help: 'Commands require a fresh standstill reading. High beam / flasher is status only: this catalog has no command. Headlamp range is shown raw.' },
    { id: 'fuel', state: 'VEHICLE_FUEL', title: 'Fuel tank sensors',
        help: 'Separate total, left and right tank fields from the cluster, plus fuel estimates. Values are raw; units / scaling need comparison with ISTA. 255 means unfilled for tank levels.' },
    { id: 'tpms', state: 'VEHICLE_TPMS', title: 'TPMS identities and radio',
        help: 'Sensor serials / IDs, reported positions, battery, reception, calibration, QR / DOT, mileage and tyre state. Slots are not assumed to be wheel positions. Sensor IDs are not UUIDs.' },
    { id: 'gps', state: 'VEHICLE_GPS', title: 'GPS and elevation',
        help: 'GPS height uses heightValid and rawLengthMeter. A 2D fix can have valid coordinates without valid height. The catalog does not specify a sea-level / geoid reference.' },
    { id: 'inputs', state: 'VEHICLE_INPUTS', title: 'Pedals and steering',
        help: 'Accelerator and steering include raw values and quality flags. Driver-braking status is available as a candidate; pedal travel / pressure is not identified in this catalog. No guessed percentages or degrees.' },
];
const LIGHT_STATES = ['DRIVINGLIGHT', 'AUTO', 'POSITIONLIGHT', 'PARKINGLIGHT_LEFT', 'PARKINGLIGHT_RIGHT', 'LIGHT_OFF'];
const ACTIONS = [
    { id: 'LOW', label: 'Driving lights / low beam', method: 'pushButtonDrivingLight', availability: 'pushButtonDrivingLight', button: 0 },
    { id: 'AUTO', label: 'Automatic lighting', method: 'pushButtonAuto', availability: 'pushButtonAUTO', button: 1 },
    { id: 'POSITION', label: 'Position / parking lights', method: 'pushButtonPositionLight', availability: 'pushButtonPositionLight', button: 2 },
    { id: 'LEFT', label: 'Left parking light', method: 'pushButtonParkinglightLeft', availability: 'pushButtonParklightLeft', button: 3 },
    { id: 'RIGHT', label: 'Right parking light', method: 'pushButtonParkinglightRight', availability: 'pushButtonParklightRight', button: 4 },
    { id: 'OFF', label: 'Lights off', method: 'pushButtonLightOff', availability: 'pushButtonOff', button: 5 },
    { id: 'FRONT_ON', label: 'Front fog lights on', field: 'foglightFront', value: true, availability: 'pushButtonFoglightFront', button: 6 },
    { id: 'FRONT_OFF', label: 'Front fog lights off', field: 'foglightFront', value: false, availability: 'pushButtonFoglightFront', button: 6 },
    { id: 'REAR_ON', label: 'Rear fog light on', field: 'foglightRear', value: true, availability: 'pushButtonFoglightRear', button: 7 },
    { id: 'REAR_OFF', label: 'Rear fog light off', field: 'foglightRear', value: false, availability: 'pushButtonFoglightRear', button: 7 },
];
const BUTTONS = LIGHT_STATES.concat(['FOGLIGHT_FRONT', 'FOGLIGHT_REAR']);
const FEEDBACK_INFO = ['NO_ADDITIONAL_INFORMATION', 'BELOW_SPEED_THRESHOLD', 'ABOVE_SPEED_THRESHOLD', 'NOT_DURING_DRIVING',
    'VEHICLE_STATE_CHANGE_TO_DRIVING', 'FOG_LIGHT_FRONT_OFF', 'LONG_PRESS_FOR_OFF'];

function enumName(value, names) { return typeof value === 'number' ? names[value] || String(value) : String(value == null ? '--' : value); }
function rawValue(value, invalid) {
    if (value == null) return '--';
    return value === invalid ? 'unfilled (' + value + ')' : String(value);
}
function serial(value, invalid) {
    if (!D.number(value) || value < 0 || value === invalid) return rawValue(value, invalid);
    return String(value) + ' / 0x' + value.toString(16).toUpperCase().padStart(8, '0');
}
function position(value) {
    if (typeof value !== 'number') return rawValue(value);
    if (value < 16) return ['FRONT_LEFT', 'FRONT_RIGHT', 'REAR_LEFT', 'REAR_RIGHT', 'SPARE_TYRE'][value] || 'raw ' + value;
    return 'raw ' + value;
}
function battery(value) {
    if (value === 1) return 'NOT_OK (1)';
    if (value === 11) return 'OK (11)';
    return D.number(value) && value >= 0 && value <= 10 ? (value * 10) + '% (enum ' + value + ')' : rawValue(value, 255);
}
function age(lab, entry) {
    if (!entry) return 'no samples';
    const seconds = Math.max(0, (lab.now() - entry.at) / 1000);
    return (seconds >= 10 ? 'STALE / ' : '') + seconds.toFixed(1) + ' s ago / ' + entry.samples + ' samples';
}

class VehicleLab {
    constructor(ui, lab, services) {
        this.ui = ui; this.lab = lab; this.services = services;
        this.active = null; this.selected = {}; this.labels = {}; this.closed = false;
        this.busy = false; this.result = 'No exterior lighting command sent'; this.pending = null;
        this.rendering = false; this.timer = null; this.snapshotResult = '';
    }
    start(bind) {
        bind('OPEN_VEHICLE_LAB', () => this.ui.open('VEHICLE_LAB'));
        bind('VEHICLE_HOME_BACK', () => this.ui.open('SECTIONS'));
        GROUPS.forEach((group) => {
            const prefix = group.state + '_';
            bind('VEHICLE_OPEN_' + group.id.toUpperCase(), () => this.open(group));
            bind(prefix + 'BACK', () => this.ui.open('VEHICLE_LAB'));
            bind(prefix + 'PREV', () => this.move(group, -1));
            bind(prefix + 'NEXT', () => this.move(group, 1));
            bind(prefix + 'REFRESH', () => this.services.refreshVehicle(group.id));
            bind(prefix + 'SNAPSHOT', () => this.snapshot());
        });
        ACTIONS.forEach((action) => bind('VEHICLE_LIGHT_' + action.id, () => this.command(action)));
        this.ui.onVisible((name, visible) => {
            if (this.closed) return;
            const group = GROUPS.find((item) => item.state === name);
            if (!group) return;
            if (visible) {
                this.active = group; this.services.watchVehicle(group.id); this.render();
            } else if (this.active === group) {
                this.active = null; this.services.watchVehicle(null);
            }
        });
        this.timer = setInterval(() => this.render(), 500);
        if (this.timer.unref) this.timer.unref();
    }
    fields(group) {
        let defs = DEFINITIONS.filter((def) => def.group === group.id);
        if (group.id === 'gps') defs = [{ key: 'gps', iface: 'de.bmw.infotainment.navigation.positioning.Positioning', fields: ['rawPositionData'] }];
        if (group.id === 'lights') defs = [{ key: 'vehicle', iface: 'de.bmw.infotainment.vehicle.Vehicle2', fields: ['statusLightStatus'] }].concat(defs);
        return defs.reduce((all, def) => all.concat((def.fields || []).concat(def.events || []).map((field) => ({
            id: def.key + '.' + field, key: def.key, field, iface: def.iface, event: !(def.fields || []).includes(field),
        }))), []);
    }
    async open(group) {
        this.services.watchVehicle(group.id);
        await this.render(group);
        if (!this.closed) return this.ui.open(group.state);
    }
    move(group, step) {
        const count = this.fields(group).length;
        this.selected[group.id] = ((this.selected[group.id] || 0) + step + count) % count;
        return this.render(group);
    }
    entry(key, field) { return this.lab.readings[key + '.' + field]; }
    data(key, field) { const entry = this.entry(key, field); return entry ? entry.value : null; }
    text(name, value) {
        value = String(value);
        if (this.labels[name] === value) return Promise.resolve();
        this.labels[name] = value; return this.ui.text(name, value);
    }
    summaries(group) {
        const d = (key, field) => this.data(key, field) || {};
        const fresh = (key, field) => age(this.lab, this.entry(key, field));
        if (group.id === 'fuel') {
            const tank = d('fuel', 'statusRangeTankStatus'), estimates = d('fuelEstimate', 'fuelSupply');
            return [
                'Tank raw: TOTAL ' + rawValue(tank.fluidLevelFuelTank, 255) + ' | LEFT ' + rawValue(tank.fluidLevelFuelTankLeftHand, 255) +
                    ' | RIGHT ' + rawValue(tank.fluidLevelFuelTankRightHand, 255),
                'Reserve: ' + rawValue(tank.statusFluidLevelFuelTankSpare, 3) + ' | Range raw: ' + rawValue(tank.range, 4095) +
                    ' | Mileage raw: ' + rawValue(tank.mileageKilometre, 16777215) + ' | ' + fresh('fuel', 'statusRangeTankStatus'),
                'Estimates raw: fuel ' + rawValue(estimates.fuelLevelEstimate, 4095) + ' | relative ' +
                    rawValue(estimates.relativeFuelLevelEstimate, 4095) + ' | ' + fresh('fuelEstimate', 'fuelSupply'),
            ];
        }
        if (group.id === 'gps') {
            const gps = d('gps', 'rawPositionData'), p = gps.position || {}, h = p.height || {};
            const validHeight = p.heightValid === true && D.number(h.rawLengthMeter);
            return [
                'Elevation: ' + (validHeight ? h.rawLengthMeter.toFixed(1) + ' m / ' + (h.rawLengthMeter * 3.280839895).toFixed(1) + ' ft' : 'unavailable / invalid height') +
                    ' | heightValid=' + rawValue(p.heightValid),
                'Coordinates: ' + (p.coordinatesValid === true && D.number(p.latitude) && D.number(p.longitude) ?
                    p.latitude.toFixed(6) + ', ' + p.longitude.toFixed(6) : 'unavailable / invalid coordinates') +
                    ' | Fix: ' + enumName(gps.fixType, ['NO_FIX', 'FIX_1D', 'FIX_2D', 'FIX_3D']),
                'Height raw: ' + rawValue(h.rawLengthMeter) + ' m | display=' + rawValue(h.displayLength) + ' ' + rawValue(h.unit) +
                    ' | ' + fresh('gps', 'rawPositionData'),
            ];
        }
        if (group.id === 'inputs') {
            const pedal = d('pedal', 'AngleAcceleratorPedal'), steering = d('steering', 'statusSteeringAngleDriver');
            const chassis = d('steeringChassis', 'ActualSteeringAngleDriver'), brake = d('braking', 'StabilizationManagement');
            return [
                'Accelerator raw: ' + rawValue(pedal.actualValueAngleAcceleratorPedal, 4095) + ' | virtual ' +
                    rawValue(pedal.actualValueAngleAcceleratorPedalVirtual, 4095) + ' | quality ' +
                    rawValue(pedal.qualifierActualValueAngleAcceleratorPedal) + ' | ' + fresh('pedal', 'AngleAcceleratorPedal'),
                'Steering raw (XView): ' + rawValue(steering.actualValueSteeringAngleDriver, 65535) + ' | quality ' +
                    rawValue(steering.qualifierActualValueSteeringAngleDriver) + ' | chassis ' +
                    rawValue(chassis.actualValueSteeringAngleDriver, 65535) + ' | ' + fresh('steering', 'statusSteeringAngleDriver'),
                'Driver-braking status raw: ' + rawValue(brake.statusBrakingDriver, 63) + ' | MSA ' + rawValue(brake.statusBrakingMSA, 15) +
                    ' | ' + fresh('braking', 'StabilizationManagement') + ' | Pedal travel / pressure: no identified signal',
            ];
        }
        if (group.id === 'tpms') {
            const last = d('tpmsInternal', 'tpmsInternalLastValues'), rows = [];
            for (let i = 1; i <= 4; i++) {
                const get = (name) => last['tpmsInternalLast' + name + 'Id' + i];
                rows.push('Slot ' + i + ': ' + position(get('Position')) + ' | Serial ' + serial(get('SensorSerNo'), 2147483647) +
                    ' | Pressure ' + rawValue(get('PressureMbar'), 65535) + ' mbar | Target ' + rawValue(get('TargetPressureMbar'), 65535) +
                    ' mbar | Temp raw ' + rawValue(get('TemperatureDegC'), 255) + ' | Battery ' + battery(get('BatteryStatus')) +
                    ' | RSSI raw ' + rawValue(get('ReceptionRssi'), 255) + ' | Yield raw ' + rawValue(get('ReceptionYield'), 255));
            }
            rows.push('Last sensor values: ' + fresh('tpmsInternal', 'tpmsInternalLastValues') + ' | Inspect receiver IDs, QR, calibration and mileage using Next field.');
            return rows;
        }
        const status = d('vehicle', 'statusLightStatus'), state = this.data('exterior', 'mainLightswitchState');
        return [
            'Switch: ' + enumName(state, LIGHT_STATES) + ' | ' + fresh('exterior', 'mainLightswitchState') +
                ' | Front fog: ' + rawValue(this.data('exterior', 'foglightFront')) + ' | Rear fog: ' + rawValue(this.data('exterior', 'foglightRear')),
            'Lamp status raw: low beam ' + rawValue(status.statusDippedBeam) + ' | high / flash ' +
                rawValue(status.statusMainBeam_headlightFlasher) + ' | position ' + rawValue(status.statusPositionLight) +
                ' | ' + fresh('vehicle', 'statusLightStatus'),
            this.result,
        ];
    }
    feedbackResult() {
        if (!this.pending) return;
        const entry = this.entry('exterior', 'showLightswitchOperationFeedback'), pending = this.pending;
        if (!entry || entry.samples <= pending.feedbackSamples) return;
        const feedback = entry.value || {}, expected = pending.action.button;
        if (feedback.operatedLightswitchButton !== expected && feedback.operatedLightswitchButton !== BUTTONS[expected]) return;
        this.result = pending.action.label + ': provider reports ' + (feedback.successful === true ? 'success' : feedback.successful === false ? 'rejection' : 'unknown result') +
            ' / ' + enumName(feedback.additonalLightswitchInformation, FEEDBACK_INFO) + ' / speed threshold raw ' + rawValue(feedback.lightswitchSpeedThreshold);
        this.pending = null;
        this.lab.record('exterior result', this.result, feedback);
    }
    async render(group) {
        group = group || this.active;
        if (this.closed || !group || this.rendering) return;
        this.rendering = true;
        try {
            this.feedbackResult();
            const prefix = group.state + '_', fields = this.fields(group), index = this.selected[group.id] || 0;
            const field = fields[index], entry = this.lab.readings[field.id], service = this.lab.services[field.key] || {};
            const error = this.lab.readErrors[field.id];
            const updates = [
                this.text(prefix + 'HELP', group.help),
                this.text(prefix + 'SOURCE', (index + 1) + '/' + fields.length + ' | ' + field.iface + '.' + field.field),
                this.text(prefix + 'STATE', (service.status || 'not requested') + ' / ' + (error || service.detail || '') + ' | ' +
                    age(this.lab, entry) + (field.event ? ' | subscription only; no getter' : ' | read + subscribe') +
                    (this.snapshotResult ? ' | ' + this.snapshotResult : '')),
                this.text(prefix + 'RAW', entry ? JSON.stringify(entry.value, null, 2) : 'No payload received for this field.'),
            ];
            this.summaries(group).forEach((line, i) => updates.push(this.text(prefix + 'SUMMARY_' + (i + 1), line)));
            if (group.id === 'lights') {
                const availability = this.data('exterior', 'lightswitchButtonAvailability') || {};
                ACTIONS.forEach((action) => {
                    const state = availability[action.availability];
                    const operable = state == null || state === 2 || state === 'OPERABLE';
                    updates.push(this.text('VEHICLE_LIGHT_' + action.id, action.label + ' | ' + enumName(state, ['NOT_AVAILABLE', 'NOT_OPERABLE', 'OPERABLE'])));
                    updates.push(this.ui.enabled('VEHICLE_LIGHT_' + action.id, !this.busy && operable));
                });
            }
            await Promise.all(updates);
        } catch (e) { this.lab.tell('Vehicle screen: ' + e.message, 'error'); }
        finally { this.rendering = false; }
    }
    async command(action) {
        if (this.busy || this.closed) return;
        this.busy = true; this.pending = null;
        this.result = 'Checking standstill and provider...'; this.render();
        try {
            const c = this.services.connections.exterior;
            if (!c || c.closed || !c.proxy || c.available !== true) throw new Error('Exterior lighting provider is unavailable');
            const availability = await this.services.read(c, 'lightswitchButtonAvailability');
            const state = availability && availability[action.availability];
            if (state != null && state !== 2 && state !== 'OPERABLE') throw new Error('Button is ' + enumName(state, ['NOT_AVAILABLE', 'NOT_OPERABLE', 'OPERABLE']));
            await this.services.read(this.services.connections.vehicle, 'statusCarSpeed2');
            if (this.closed) return;
            const speed = this.lab.sensors.speed, speedEntry = this.entry('vehicle', 'statusCarSpeed2');
            if (!D.number(speed) || speed < 0 || speed >= 0.5 || !speedEntry || this.lab.now() - speedEntry.at > 2000) {
                throw new Error('A fresh vehicle speed below 0.5 km/h is required');
            }
            if (this.closed) return;
            const feedback = this.entry('exterior', 'showLightswitchOperationFeedback');
            this.pending = { action, feedbackSamples: feedback ? feedback.samples : 0 };
            this.lab.record('exterior command', action.label, { method: action.method, field: action.field, value: action.value });
            await this.services.writeExterior(action);
            if (this.pending) this.result = action.label + ': sent; waiting for provider feedback. Check the physical lamps.';
            for (const field of ['mainLightswitchState', 'foglightFront', 'foglightRear']) {
                try { await this.services.read(c, field); } catch (e) { this.lab.record('exterior readback', field + ': ' + e.message); }
            }
            try { await this.services.read(this.services.connections.vehicle, 'statusLightStatus'); }
            catch (e) { this.lab.record('exterior readback', e.message); }
            this.feedbackResult();
        } catch (e) {
            this.pending = null; this.result = action.label + ': ' + e.message;
            this.lab.tell(this.result, 'error');
        } finally { this.busy = false; this.render(); }
    }
    snapshot() {
        this.feedbackResult();
        const saved = this.lab.store.save('lab-vehicle-snapshot.json', {
            capturedAt: this.lab.now(), readings: this.lab.readings, services: this.lab.services,
            readErrors: this.lab.readErrors, exteriorResult: this.result,
        });
        this.snapshotResult = saved ? 'Saved lab-vehicle-snapshot.json at ' + new Date(this.lab.now()).toISOString() : this.lab.store.error;
        this.lab.tell(this.snapshotResult, saved ? 'good' : 'error');
        this.render();
    }
    close() {
        if (this.closed) return;
        this.closed = true; clearInterval(this.timer); this.services.watchVehicle(null);
    }
}
module.exports = { VehicleLab, DEFINITIONS, GROUPS, ACTIONS };

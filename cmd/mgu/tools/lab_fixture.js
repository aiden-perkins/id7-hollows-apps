'use strict';
// Host-only traffic for previewing MGU Lab. Never shipped as an app dependency.
const copy = (v) => JSON.parse(JSON.stringify(v));
const LEGACY = 'de.bmw.infotainment.misc.ComfortFunctionIuK';
const PROFILE = 'de.bmw.body.interiorillumination.AmbientLight';
const MODE = 'de.bmw.infotainment.drivingexcitement.FES';
const RELAY = 'de.bmw.infotainment.hmi.inputrelay.InputRelay';

function makeSignals() {
    const proxies = [], writes = [], calls = [];
    const data = {};
    function put(iface, field, value) { (data[iface] || (data[iface] = {}))[field] = value; }
    put(MODE, 'statusFESVehicleDynamicSwitchHMI', { actualValueModeDrivingExperience: 4, displayModeDrivingExperience: 4 });
    put(LEGACY, 'statusAmbientLightInteriorColour', { statusHueInteriorLighting: 120, statusMenuAmbientePanoramicRoofInteriorLighting: 1,
        statusHueValueLayer1IndividualGroup: 12, statusHueValueLayer2IndividualGroup: 20, statusHueValueLayer3IndividualGroup: 30 });
    put(PROFILE, 'currentInteriorLightProfile', { currentLightProfileId: 'COLOUR2' });
    put('de.bmw.infotainment.vehicle.CDS', 'statusEngineSpeed2', { actualValueRPMEngineCrankshaft: 2800 });
    put('de.bmw.infotainment.vehicle.CDS', 'statusEngineTemperature', { temperatureEngineDrive: 140, temperatureEngineOilDrive: 132 });
    put('de.bmw.infotainment.vehicle.CDS', 'statusBattery2', { conditionBatteryChargingCondition: 82 });
    put('de.bmw.infotainment.vehicle.Vehicle2', 'statusCarSpeed2', { speedVehicleCentreOfGravity: 0 });
    put('de.bmw.infotainment.vehicle.Vehicle2', 'statusLightStatus', { statusDippedBeam: 1, statusMainBeam_headlightFlasher: 0 });
    put('de.bmw.infotainment.navigation.positioning.Positioning', 'rawPositionData',
        { fixType: 'FIX_3D', heading: 95, position: { coordinatesValid: true, latitude: 37.42199, longitude: -122.08405 } });
    ['statusRotaryPress', 'statusRotarySteps', 'statusAudioVolumeButton'].forEach((f) => put('de.bmw.infotainment.controlelements.SteeringWheelPushButton', f, { value: 0 }));
    put(RELAY, 'status', 'ACTIVE');
    function emit(iface, field, value) {
        put(iface, field, copy(value));
        proxies.filter((p) => p.iface === iface && !p.closed).forEach((p) => {
            (p.listeners[field] || []).slice().forEach((fn) => fn(copy(value)));
        });
    }
    const signals = {
        hasNative: () => true,
        proxy: async (iface, instance) => {
            const p = { iface, instance, listeners: {}, closed: false, shutdown() { this.closed = true; return Promise.resolve(); } };
            proxies.push(p); return p;
        },
        onAvailable: async (p, fn) => { p.availability = fn; fn(true); },
        on: async (p, field, fn) => { (p.listeners[field] || (p.listeners[field] = [])).push(fn); },
        get: async (p, field) => {
            if (p.closed) throw new Error('Closed');
            const value = data[p.iface] && data[p.iface][field];
            if (value === undefined) throw new Error('Fixture has no ' + field);
            return copy(value);
        },
        set: async (p, field, value) => {
            writes.push({ iface: p.iface, field, value: copy(value) });
            if (p.iface === LEGACY) {
                const before = copy(data[LEGACY].statusAmbientLightInteriorColour);
                const fields = [
                    ['controlHueInteriorLighting', 'statusHueInteriorLighting', 4095],
                    ['controlMenuAmbientePanoramicRoofInteriorLighting', 'statusMenuAmbientePanoramicRoofInteriorLighting', 'SIGNAL_UNBEFUELLT'],
                    ['controlHueValueLayer1IndividualGroup', 'statusHueValueLayer1IndividualGroup', 255],
                    ['controlHueValueLayer2IndividualGroup', 'statusHueValueLayer2IndividualGroup', 255],
                    ['controlHueValueLayer3IndividualGroup', 'statusHueValueLayer3IndividualGroup', 255],
                ];
                fields.forEach((f) => { if (value[f[0]] !== undefined && value[f[0]] !== f[2]) before[f[1]] = value[f[0]]; });
                emit(LEGACY, 'statusAmbientLightInteriorColour', before);
            } else emit(PROFILE, 'currentInteriorLightProfile', value);
        },
        call: async (p, method, args) => {
            calls.push({ method, args });
            return method === 'createInputRelay' ? { InputRelayError: 'STATUS_OK', instanceName: 'InputRelayInst1' } : { InputRelayError: 'STATUS_OK' };
        },
        emit, put, writes, calls, proxies, data,
    };
    return signals;
}
function setup(ctx) { ctx.preview = true; ctx.signals = makeSignals(); }
async function afterStart(ctx, components) {
    // Let the asynchronous provider/subscription setup settle.
    await new Promise((r) => setImmediate(r));
    const bus = ctx.signals, lab = ctx.lab;
    await ctx.labServices.startRelay();
    bus.emit(RELAY, 'onTouchInput', { touchData: { time: 1010, touchSource: 'TOUCH_DISPLAY', proximity: false, fingerData: [
        { xCoordinate: 240, yCoordinate: 180, zCoordinate: 0, eventType: 1, touchId: 1 },
    ] } });
    [[450, 230], [700, 310], [1100, 390], [1500, 420]].forEach((p, i) => bus.emit(RELAY, 'onTouchInput', { touchData: {
        time: 1020 + i * 20, touchSource: 2, fingerData: [{ xCoordinate: p[0], yCoordinate: p[1], zCoordinate: 0, eventType: 2, touchId: 1 }],
    } }));
    bus.emit(RELAY, 'onKeyInput', { KeyInputData: { time: 1040, keyData: [{ keyCode: 6, keyStatus: 1 }, { keyCode: 0, keyStatus: 1 }] } });
    if (components && components.BTN_PRIMARY) components.BTN_PRIMARY.emit('focus', { value: true });
    lab.native('action', 'Test click', { row: 0 });
    for (const pair of [['A', 120, 1, 2], ['B', 720, 2, 3], ['C', 1440, 3, 4]]) {
        bus.emit(LEGACY, 'statusAmbientLightInteriorColour', { statusHueInteriorLighting: pair[1], statusMenuAmbientePanoramicRoofInteriorLighting: pair[2] });
        bus.emit(PROFILE, 'currentInteriorLightProfile', { currentLightProfileId: pair[3] });
        await lab.capture(pair[0]);
    }
    bus.emit(MODE, 'statusFESVehicleDynamicSwitchHMI', { actualValueModeDrivingExperience: 'SPORT_DYNAMIC', displayModeDrivingExperience: 1 });
    lab.assign('A');
    lab.tell('Preview traffic - no live car connection');
}
module.exports = { makeSignals, setup, afterStart, LEGACY, PROFILE, MODE, RELAY };

'use strict';

// These are catalog identities, not a statement that this vehicle offers each provider.
const SERVICES = [
    { key: 'legacy', label: 'Legacy ambient lighting', iface: 'de.bmw.infotainment.misc.ComfortFunctionIuK', instance: '1',
        fields: ['statusAmbientLightInteriorColour', 'statusAmbientLightInteriorUserSetting', 'statusALEV4'], events: [], pollMs: 2000 },
    { key: 'profile', label: 'Profile ambient lighting (unproven)', iface: 'de.bmw.body.interiorillumination.AmbientLight', instance: '1',
        fields: ['currentInteriorLightProfile', 'ambientLightActive', 'brightnessAmbientLight', 'brightnessAmbientContourLine', 'dimmedWhileDrivingAtNight'], events: [], pollMs: 3000 },
    { key: 'exterior', label: 'Exterior switch requests (unproven)', iface: 'de.bmw.body.drivinglight.LightswitchOperation', instance: '1',
        fields: ['mainLightswitchState', 'lightswitchButtonAvailability', 'foglightFront', 'foglightRear'],
        events: ['showLightswitchOperationFeedback'], pollMs: 2000 },
    { key: 'lamps', label: 'Exterior lamp observation only', iface: 'de.bmw.body.Light', instance: '1', fields: ['LowBeam'],
        events: ['LampExterior', 'LampExterior2', 'statusOperationLightExterior', 'IndicatorSteeringColumnComplete'], pollMs: 5000 },
    { key: 'vehicle', label: 'Standstill and lamp status', iface: 'de.bmw.infotainment.vehicle.Vehicle2', instance: '1',
        fields: ['statusCarSpeed2', 'statusLightStatus'], events: [], pollMs: 1000 },
    { key: 'mode', label: 'Driving-mode observation', iface: 'de.bmw.infotainment.drivingexcitement.FES', instance: '1',
        fields: ['statusFESVehicleDynamicSwitchHMI'], events: [], pollMs: 3000 },
];
const menuChoices = [{ value: 'AMBIENTEBELEUCHTUNG_AUS', label: 'Ambient off', wire: 0 }];
for (let n = 1; n <= 12; n++) menuChoices.push({ value: 'FARBAUSWAHL_' + n, label: 'Factory menu ' + n + ' (color not inferred)', wire: n });
menuChoices.push({ value: 'INDIVIDUALMODUS', label: 'Individual mode (experimental)', wire: 13 },
    { value: 'KOPPLUNG_AN_FES', label: 'Native FES coupling (experimental)', wire: 14 });
const modes = [{ value: 'AUS', label: 'Off', wire: 0 }, { value: 'EIN', label: 'On', wire: 1 }];
const buttons = [
    { value: 'DRIVINGLIGHT', label: 'Driving lights / low beam', wire: 0, method: 'pushButtonDrivingLight', availability: 'pushButtonDrivingLight' },
    { value: 'AUTO', label: 'Automatic lighting', wire: 1, method: 'pushButtonAuto', availability: 'pushButtonAUTO' },
    { value: 'POSITIONLIGHT', label: 'Position lights (not independent tail/plate control)', wire: 2, method: 'pushButtonPositionLight', availability: 'pushButtonPositionLight' },
    { value: 'PARKINGLIGHT_LEFT', label: 'Left parking light', wire: 3, method: 'pushButtonParkinglightLeft', availability: 'pushButtonParklightLeft' },
    { value: 'PARKINGLIGHT_RIGHT', label: 'Right parking light', wire: 4, method: 'pushButtonParkinglightRight', availability: 'pushButtonParklightRight' },
    { value: 'LIGHT_OFF', label: 'Lights off', wire: 5, method: 'pushButtonLightOff', availability: 'pushButtonOff' },
];
function legacy(id, label, suffix, options) {
    return Object.assign({ id, label, service: 'legacy', readField: 'statusAmbientLightInteriorColour',
        prop: 'status' + suffix, writeProp: 'control' + suffix, writeField: 'ambientLightInteriorColour', experimental: true,
        help: 'Raw catalog control; physical effect and equipment support are unproven. One setting per trial; restore before another trial.' }, options);
}
function profile(id, label, field, options) {
    return Object.assign({ id, label, service: 'profile', readField: field, writeField: field, experimental: true,
        help: 'Requires a live profile provider and a valid original value. This provider was absent in the saved MGU Lab session.' }, options);
}
function individual(id, label, suffix, max) {
    return legacy(id, label, suffix, { type: 'number', min: 0, max, step: 1, requireIndividual: true,
        help: 'Explicit two-field experiment: request INDIVIDUALMODUS plus this raw value together. Both reported values must match. A valid original menu and field are required; Restore returns all known valid original legacy fields. This does not prove RGB support.' });
}
const CONTROLS = [
    legacy('menu', 'Legacy factory / individual / FES menu', 'MenuAmbientePanoramicRoofInteriorLighting', { type: 'choice', choices: menuChoices,
        help: 'Factory menus 5/8/12 had matching saved readbacks. Other selections, individual mode and native FES coupling need physical validation.' }),
    legacy('hue', 'Legacy overall hue (raw, not degrees or RGB)', 'HueInteriorLighting', { type: 'number', min: 0, max: 4094, step: 1 }),
    legacy('layer1', 'Legacy individual group / layer 1 (raw)', 'HueValueLayer1IndividualGroup', { type: 'number', min: 0, max: 253, step: 1 }),
    legacy('layer2', 'Legacy individual group / layer 2 (raw)', 'HueValueLayer2IndividualGroup', { type: 'number', min: 0, max: 253, step: 1 }),
    legacy('layer3', 'Legacy individual group / layer 3 (raw)', 'HueValueLayer3IndividualGroup', { type: 'number', min: 0, max: 253, step: 1 }),
    legacy('brightness', 'Legacy ambient brightness offset (raw)', 'BrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting',
        { type: 'number', min: 0, max: 253, step: 1, help: 'Not a percent scale. Values 254/255 are withheld; the saved original was 254, so a trial is blocked unless a valid restorable original is reported.' }),
    legacy('enabled', 'Legacy ambient mode', 'ModeAmbientePanoramicRoofInteriorLighting', { type: 'choice', choices: modes }),
    legacy('dynamic', 'Legacy dynamic interior lighting', 'DynamicInteriorLighting', { type: 'choice', choices: modes }),
    legacy('dynamicAmbient', 'Legacy dynamic ambient lighting', 'DynamicAmbienteInteriorLighting',
        { prop: 'statusDynamicAmbienteIinteriorLighting', type: 'choice', choices: modes }),
    individual('individualHue', 'Individual mode + overall hue (raw)', 'HueInteriorLighting', 4094),
    individual('individualLayer1', 'Individual mode + group / layer 1 (raw)', 'HueValueLayer1IndividualGroup', 253),
    individual('individualLayer2', 'Individual mode + group / layer 2 (raw)', 'HueValueLayer2IndividualGroup', 253),
    individual('individualLayer3', 'Individual mode + group / layer 3 (raw)', 'HueValueLayer3IndividualGroup', 253),
    profile('profile', 'Newer ambient profile selection', 'currentInteriorLightProfile', { type: 'choice', prop: 'currentLightProfileId',
        choices: [{ value: 'NONE', label: 'No profile', wire: 0 }].concat(
            Array.from({ length: 50 }, (_, n) => ({ value: 'COLOUR' + (n + 1), label: 'COLOUR' + (n + 1) + ' (name/color unknown)', wire: n + 1 })),
            Array.from({ length: 21 }, (_, n) => ({ value: 'MODE' + n, label: 'MODE' + n + ' (behavior unknown)', wire: n + 80 }))) }),
    profile('profileEnabled', 'Newer ambient active', 'ambientLightActive', { type: 'bool' }),
    profile('profileBrightness', 'Newer ambient brightness (raw)', 'brightnessAmbientLight', { type: 'number', min: 0, max: 253, step: 1 }),
    profile('contourBrightness', 'Newer contour brightness (raw)', 'brightnessAmbientContourLine', { type: 'number', min: 0, max: 253, step: 1 }),
    profile('nightDim', 'Newer night-driving dimming setting', 'dimmedWhileDrivingAtNight', { type: 'bool' }),
    { id: 'exteriorMode', label: 'Exterior switch mode', service: 'exterior', readField: 'mainLightswitchState', type: 'choice', choices: buttons,
        experimental: true, help: 'Normal switch requests, not independent lamp overrides. Requires explicit OPERABLE availability. Restore returns the original switch mode; inspect fog states and physical lamps separately.' },
    { id: 'frontFog', label: 'Front fog request (if fitted/operable)', service: 'exterior', readField: 'foglightFront', writeField: 'foglightFront', type: 'bool',
        button: 6, availability: 'pushButtonFoglightFront', experimental: true, help: 'May be unavailable on this vehicle. No request is sent unless the provider explicitly reports this button OPERABLE.' },
    { id: 'rearFog', label: 'Rear fog request (if fitted/operable)', service: 'exterior', readField: 'foglightRear', writeField: 'foglightRear', type: 'bool',
        button: 7, availability: 'pushButtonFoglightRear', experimental: true, help: 'May be unavailable on this vehicle. Keep the car stationary and verify actual lamps, not just reported state.' },
];
function control(id) { return CONTROLS.find((c) => c.id === id); }
function readKey(c) { return c.service + '.' + c.readField; }
function validValue(c, value) {
    if (!c) return false;
    if (c.type === 'bool') return typeof value === 'boolean';
    if (c.type === 'number') return Number.isInteger(value) && value >= c.min && value <= c.max;
    return c.choices.some((choice) => choice.value === value);
}
function current(c, raw) {
    if (!c) return undefined;
    let value = c.prop ? raw && raw[c.prop] : raw;
    if (c.type === 'choice' && typeof value === 'number') {
        const choice = c.choices.find((item) => item.wire === value);
        value = choice ? choice.value : undefined;
    }
    return validValue(c, value) ? value : undefined;
}
function legacyEmpty() {
    return { controlHueInteriorLighting: 4095, controlMenuAmbientePanoramicRoofInteriorLighting: 'SIGNAL_UNBEFUELLT',
        controlHueValueLayer1IndividualGroup: 255, controlHueValueLayer2IndividualGroup: 255, controlHueValueLayer3IndividualGroup: 255,
        controlBrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting: 255,
        controlModeAmbientePanoramicRoofInteriorLighting: 'SIGNAL_UNBEFUELLT', controlDynamicInteriorLighting: 'SIGNAL_UNBEFUELLT',
        controlDynamicAmbienteInteriorLighting: 'SIGNAL_UNBEFUELLT' };
}
function command(c, value) {
    if (!validValue(c, value)) throw new Error('Unsupported value for ' + (c ? c.label : 'unknown control'));
    if (c.service === 'legacy') {
        const payload = legacyEmpty(); payload[c.writeProp] = value;
        if (c.requireIndividual) payload.controlMenuAmbientePanoramicRoofInteriorLighting = 'INDIVIDUALMODUS';
        return { service: c.service, field: c.writeField, value: payload };
    }
    if (c.id === 'exteriorMode') {
        const choice = c.choices.find((item) => item.value === value);
        return { service: c.service, method: choice.method, params: {}, button: choice.wire, availability: choice.availability };
    }
    const request = { service: c.service, field: c.writeField, value: c.prop ? { [c.prop]: value } : value };
    if (c.service === 'exterior') { request.button = c.button; request.availability = c.availability; }
    return request;
}
function restore(c, raw) {
    const value = current(c, raw);
    if (value === undefined) throw new Error('No valid restorable original for ' + c.label + '; reserved/unfilled values are not replayed');
    if (c.requireIndividual && current(control('menu'), raw) === undefined) throw new Error('Individual-mode trial needs a valid original menu to restore');
    if (c.service !== 'legacy') return { requests: [command(c, value)], checks: [{ controlId: c.id, value }] };
    const payload = legacyEmpty(), checks = [];
    CONTROLS.filter((item) => item.service === 'legacy' && !item.requireIndividual).forEach((item) => {
        const original = current(item, raw);
        if (original !== undefined) { payload[item.writeProp] = original; checks.push({ controlId: item.id, value: original }); }
    });
    return { requests: [{ service: 'legacy', field: c.writeField, value: payload }], checks };
}
function matches(check, raw) {
    const c = control(check.controlId);
    return !!c && validValue(c, check.value) && current(c, raw) === check.value &&
        (!c.requireIndividual || current(control('menu'), raw) === 'INDIVIDUALMODUS');
}
function available(request, raw) {
    if (request.service !== 'exterior') return true;
    if (!request.availability || !raw || typeof raw !== 'object') return false;
    const value = raw[request.availability];
    return value === 'OPERABLE' || value === 2;
}
const buttonNames = buttons.map((b) => b.value).concat(['FOGLIGHT_FRONT', 'FOGLIGHT_REAR']);
function feedbackMatches(request, raw) {
    return !!raw && Number.isInteger(request.button) && (raw.operatedLightswitchButton === request.button ||
        raw.operatedLightswitchButton === buttonNames[request.button]);
}
function speed(raw) {
    // Only exact wire zero is accepted; no guessed scaling is used to admit a write.
    return raw && Number.isInteger(raw.speedVehicleCentreOfGravity) && raw.speedVehicleCentreOfGravity === 0 ? 0 : null;
}
module.exports = { SERVICES, CONTROLS, control, readKey, validValue, current, command, restore, matches, available, feedbackMatches, speed, freshMs: 2000 };

'use strict';

// Wire names are from the unit's SOME/IP catalog. Do not infer colours from enum IDs.
const MODES = {
    0: 'INITIALISIERUNG', 1: 'SPORT_DYNAMIC', 2: 'SPORT_EXPERT', 3: 'SPORT_INDIVIDUAL',
    4: 'COMFORT', 5: 'COMFORT_PLUS', 6: 'COMFORT_INDIVIDUAL',
    7: 'ECO_PRO_EFFICIENT', 8: 'ECO_PRO_PLUS', 9: 'ECO_PRO_INDIVIDUAL', 10: 'ADAPTIVE',
    11: 'OFFROAD_ICE', 12: 'OFFROAD_SMOOTH', 13: 'OFFROAD_GRIP', 14: 'OFFROAD_ROUGH',
    15: 'PHEV_SPORT_STANDARD', 16: 'PHEV_SPORT_INDIVIDUAL', 17: 'PHEV_HYBRID_STANDARD',
    18: 'PHEV_HYBRID_ECO', 19: 'PHEV_HYBRID_COMFORT', 20: 'PHEV_ELECTRIC_STANDARD',
    21: 'PHEV_ELECTRIC_INDIVIDUAL', 22: 'PHEV_BATTERYCONTROL', 23: 'PHEV_SPORT_PLUS',
    24: 'EASE_MODUS', 25: 'RESERVIERT', 26: 'RESERVIERT_1', 27: 'TRACTION_ASSIST',
    28: 'BOOST', 61: 'RESERVIERT_NICHT_VERFUEGBAR', 62: 'RESERVIERT_FEHLER', 63: 'SIGNAL_UNBEFUELLT',
};
const KEYS = { 0: 'PRESS', 1: 'NORTH', 2: 'EAST', 3: 'SOUTH', 4: 'WEST', 5: 'COUNTERCLOCKWISE', 6: 'CLOCKWISE', 7: 'BACK', 100: 'VOICE' };
const KEY_STATES = { 0: 'RELEASED', 1: 'PRESSED', 2: 'TOUCHED', 3: 'LONG PRESS', 7: 'ERROR' };
const KEY_NAMES = { ZBE: 'PRESS', ZBE_NORTH: 'NORTH', ZBE_EAST: 'EAST', ZBE_SOUTH: 'SOUTH', ZBE_WEST: 'WEST',
    ZBE_ROTATE_COUNTERCLOCKWISE: 'COUNTERCLOCKWISE', ZBE_ROTATE_CLOCKWISE: 'CLOCKWISE', ZBE_BACK: 'BACK', MFL_PTT: 'VOICE' };
const COLOURS = [
    ['statusHueInteriorLighting', 'controlHueInteriorLighting', 4095],
    ['statusMenuAmbientePanoramicRoofInteriorLighting', 'controlMenuAmbientePanoramicRoofInteriorLighting', 15],
    ['statusHueValueLayer1IndividualGroup', 'controlHueValueLayer1IndividualGroup', 255],
    ['statusHueValueLayer2IndividualGroup', 'controlHueValueLayer2IndividualGroup', 255],
    ['statusHueValueLayer3IndividualGroup', 'controlHueValueLayer3IndividualGroup', 255],
];
const MENU_NAMES = { AMBIENTEBELEUCHTUNG_AUS: 0, INDIVIDUALMODUS: 13, KOPPLUNG_AN_FES: 14, SIGNAL_UNBEFUELLT: 15 };
for (let i = 1; i <= 12; i++) MENU_NAMES['FARBAUSWAHL_' + i] = i;

function number(x) { return typeof x === 'number' && isFinite(x); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function enumValue(x, names) { return typeof x === 'number' ? x : Object.prototype.hasOwnProperty.call(names, x) ? names[x] : null; }
function modeOf(raw) {
    const name = typeof raw === 'number' ? MODES[raw] : (Object.keys(MODES).some((k) => MODES[k] === raw) ? raw : null);
    let family = null;
    if (name && /SPORT|BOOST/.test(name)) family = 'Sport';
    else if (name && /ECO/.test(name)) family = 'Eco';
    else if (name && /COMFORT/.test(name)) family = 'Comfort';
    const valid = !!name && !/INITIALISIERUNG|RESERVIERT|SIGNAL_UNBEFUELLT/.test(name);
    return { raw, name: name || 'UNKNOWN', label: valid ? name.replace(/_/g, ' ') : 'Waiting for valid mode', family, valid };
}
function colourValue(raw, index) {
    return index === 1 ? enumValue(raw, MENU_NAMES) : (number(raw) ? raw : null);
}
function snapshot(backend, raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (backend === 'profile') {
        let id = raw.currentLightProfileId;
        if (typeof id === 'string') {
            const m = /^(COLOUR|MODE)(\d+)$/.exec(id);
            id = m && ((m[1] === 'COLOUR' && Number(m[2]) >= 1 && Number(m[2]) <= 50) || (m[1] === 'MODE' && Number(m[2]) <= 20))
                ? Number(m[2]) + (m[1] === 'MODE' ? 80 : 0) : id === 'NONE' ? 0 : null;
        }
        if (!number(id) || Math.floor(id) !== id || !((id >= 0 && id <= 50) || (id >= 80 && id <= 100))) return null;
        return { backend, values: { currentLightProfileId: id } };
    }
    if (backend !== 'legacy') return null;
    const values = {};
    COLOURS.forEach((f, i) => {
        const v = colourValue(raw[f[0]], i);
        if (number(v) && Math.floor(v) === v && v >= 0 && v < f[2]) values[f[0]] = v;
    });
    return Object.keys(values).length ? { backend, values } : null;
}
function checkedSnapshot(s) {
    if (!s || !s.values) return null;
    const out = snapshot(s.backend, s.values);
    return out && Object.keys(out.values).length === Object.keys(s.values).length ? out : null;
}
function command(s) {
    s = checkedSnapshot(s);
    if (!s) throw new Error('Preset has no valid captured colour');
    if (s.backend === 'profile') {
        const id = s.values.currentLightProfileId;
        return { currentLightProfileId: id === 0 ? 'NONE' : id >= 80 ? 'MODE' + (id - 80) : 'COLOUR' + id };
    }
    // Catalog defaults mean unfilled fields. Brightness/dynamic-light controls are not changed.
    const out = {
        controlHueInteriorLighting: 4095,
        controlMenuAmbientePanoramicRoofInteriorLighting: 'SIGNAL_UNBEFUELLT',
        controlHueValueLayer1IndividualGroup: 255, controlHueValueLayer2IndividualGroup: 255, controlHueValueLayer3IndividualGroup: 255,
        controlBrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting: 255,
        controlModeAmbientePanoramicRoofInteriorLighting: 'SIGNAL_UNBEFUELLT',
        controlDynamicInteriorLighting: 'SIGNAL_UNBEFUELLT', controlDynamicAmbienteInteriorLighting: 'SIGNAL_UNBEFUELLT',
    };
    COLOURS.forEach((f, i) => {
        const value = s.values[f[0]];
        if (value !== undefined) out[f[1]] = i === 1 ? Object.keys(MENU_NAMES).find((name) => MENU_NAMES[name] === value) : value;
    });
    return out;
}
function matches(expected, raw) {
    const got = snapshot(expected.backend, raw);
    return !!got && Object.keys(expected.values).every((k) => got.values[k] === expected.values[k]);
}
function lightSummary(s) {
    if (!s) return 'No valid lighting data';
    const v = s.values;
    if (s.backend === 'profile') return 'Profile ' + v.currentLightProfileId;
    const parts = [];
    if (v.statusHueInteriorLighting !== undefined) parts.push('Hue ' + v.statusHueInteriorLighting);
    if (v.statusMenuAmbientePanoramicRoofInteriorLighting !== undefined) parts.push('Menu ' + v.statusMenuAmbientePanoramicRoofInteriorLighting);
    const layers = [1, 2, 3].map((i) => v['statusHueValueLayer' + i + 'IndividualGroup']);
    if (layers.some((x) => x !== undefined)) parts.push('Layers ' + layers.map((x) => x === undefined ? '-' : x).join('/'));
    return parts.join('  ');
}
function array(v) { return Array.isArray(v) ? v : []; }
function touchOf(v) {
    const d = v && (v.touchData || v.TouchInputData || v) || {};
    const src = d.touchSource;
    return { source: src === 1 || src === 'TOUCH_PAD' ? 'TOUCH PAD' : src === 2 || src === 'TOUCH_DISPLAY' ? 'TOUCH DISPLAY' : String(src == null ? 'UNKNOWN' : src),
        time: d.time, fingers: array(d.fingerData).filter((f) => number(f.xCoordinate) && number(f.yCoordinate)).map((f) => ({
            x: f.xCoordinate, y: f.yCoordinate, z: f.zCoordinate, id: f.touchId, event: f.eventType,
        })) };
}
const CONTROLLER_TOUCH = {
    ZBETouchFrontSide: { source: 'CONTROLLER FRONT', points: [
        ['touchCoordinatesX1FrontSide', 'touchCoordinatesY1FrontSide', 'touchCoordinatesZ1FrontSide', 1],
        ['touchCcoordinatesX2FrontSide', 'touchCoordinatesY2FrontSide', 'touchCoordinatesZ2FrontSide', 2],
    ] },
    ZBETouchRearSide: { source: 'CONTROLLER REAR', points: [
        ['touchCoordinatesX1RearSide', 'touchCoordinatesY1RearSide', 'touchCoordinatesZ1RearSide', 1],
        ['touchCcoordinatesX2RearSide', 'touchCoordinatesY2RearSide', 'touchCoordinatesZ2RearSide', 2],
    ] },
    operationZBETouch2: { source: 'CONTROLLER TOUCH 2', points: [
        ['touchCoordinatesX3', 'touchCoordinatesY3', 'touchCoordinatesZ3', 3],
        ['touchCoordinatesX4', 'touchCoordinatesY4', 'touchCoordinatesZ4', 4],
    ] },
    operationZBETouch3: { source: 'CONTROLLER TOUCH 3', points: [
        ['touchCoordinatesX5', 'touchCoordinatesY5', 'touchCoordinatesZ5', 5],
    ] },
};
function controllerTouchOf(field, value) {
    const format = CONTROLLER_TOUCH[field];
    if (!format || !value || typeof value !== 'object') return null;
    const fingers = format.points.map((names) => {
        const x = value[names[0]], y = value[names[1]], z = value[names[2]];
        if (!number(x) || !number(y) || x < 0 || y < 0 || x >= 4095 || y >= 4095) return null;
        return { x, y, z: number(z) && z >= 0 && z < 15 ? z : null, id: names[3], event: 'sample' };
    }).filter(Boolean);
    return { source: format.source, fingers };
}
function keysOf(v) {
    const d = v && (v.KeyInputData || v.keyInputData || v) || {};
    return array(d.keyData).map((k) => ({
        key: typeof k.keyCode === 'number' ? KEYS[k.keyCode] || String(k.keyCode) : KEY_NAMES[k.keyCode] || String(k.keyCode),
        state: typeof k.keyStatus === 'number' ? KEY_STATES[k.keyStatus] || String(k.keyStatus) : String(k.keyStatus).replace(/^KEY_LONGPRESSED$/, 'LONG PRESS').replace(/^KEY_/, '').replace(/_/g, ' '),
    }));
}
module.exports = { MODES, COLOURS, number, clone, modeOf, snapshot, checkedSnapshot, command, matches, lightSummary, touchOf, controllerTouchOf, keysOf };

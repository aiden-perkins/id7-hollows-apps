'use strict';

const MENU = 'statusMenuAmbientePanoramicRoofInteriorLighting';
// Only variants observed on this car are offered as mappings.
const MODES = { 1: 'SPORT_DYNAMIC', 2: 'SPORT_EXPERT', 3: 'SPORT_INDIVIDUAL',
    4: 'COMFORT', 5: 'COMFORT_PLUS', 7: 'ECO_PRO_EFFICIENT', 9: 'ECO_PRO_INDIVIDUAL' };
const clone = (v) => JSON.parse(JSON.stringify(v));
function menu(raw) {
    const v = raw && raw[MENU];
    if (Number.isInteger(v) && v >= 1 && v <= 12) return v;
    const m = /^FARBAUSWAHL_([1-9]|1[0-2])$/.exec(v);
    return m ? Number(m[1]) : null;
}
function mode(raw) {
    const v = raw && raw.actualValueModeDrivingExperience;
    return typeof v === 'number' ? MODES[v] || null : Object.keys(MODES).some((k) => MODES[k] === v) ? v : null;
}
function command(value) {
    if (!Number.isInteger(value) || value < 1 || value > 12) throw new Error('Select a factory menu from 1 to 12');
    // Unfilled catalog sentinels leave unproven controls untouched.
    return { controlHueInteriorLighting: 4095,
        controlMenuAmbientePanoramicRoofInteriorLighting: 'FARBAUSWAHL_' + value,
        controlHueValueLayer1IndividualGroup: 255, controlHueValueLayer2IndividualGroup: 255,
        controlHueValueLayer3IndividualGroup: 255,
        controlBrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting: 255,
        controlModeAmbientePanoramicRoofInteriorLighting: 'SIGNAL_UNBEFUELLT',
        controlDynamicInteriorLighting: 'SIGNAL_UNBEFUELLT', controlDynamicAmbienteInteriorLighting: 'SIGNAL_UNBEFUELLT' };
}
function preset(p) {
    return p && typeof p.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(p.id) &&
        typeof p.name === 'string' && p.name.trim().length > 0 && p.name.length <= 24 &&
        p.backend === 'legacy' && menu(p.values) !== null;
}
module.exports = { MENU, MODES, clone, menu, mode, command, preset };

'use strict';
// FES ActualValueModeDrivingExperience2 from bmw-extracted/reference/someip-interfaces.json.
// Initialization, reserved, unavailable and unfilled values are deliberately not modes.
const MODES = [
    [1, 'SPORT_DYNAMIC', 'Sport'],
    [2, 'SPORT_EXPERT', 'Sport Plus'],
    [3, 'SPORT_INDIVIDUAL', 'Sport Individual'],
    [10, 'ADAPTIVE', 'Adaptive'],
    [7, 'ECO_PRO_EFFICIENT', 'Eco Pro'],
    [8, 'ECO_PRO_PLUS', 'Eco Pro Plus'],
    [9, 'ECO_PRO_INDIVIDUAL', 'Eco Pro Individual'],
    [4, 'COMFORT', 'Comfort'],
    [5, 'COMFORT_PLUS', 'Comfort Plus'],
    [6, 'COMFORT_INDIVIDUAL', 'Comfort Individual'],
    [11, 'OFFROAD_ICE', 'Offroad Ice'],
    [12, 'OFFROAD_SMOOTH', 'Offroad Smooth'],
    [13, 'OFFROAD_GRIP', 'Offroad Grip'],
    [14, 'OFFROAD_ROUGH', 'Offroad Rough'],
    [15, 'PHEV_SPORT_STANDARD', 'PHEV Sport'],
    [23, 'PHEV_SPORT_PLUS', 'PHEV Sport Plus'],
    [16, 'PHEV_SPORT_INDIVIDUAL', 'PHEV Sport Individual'],
    [17, 'PHEV_HYBRID_STANDARD', 'PHEV Hybrid'],
    [18, 'PHEV_HYBRID_ECO', 'PHEV Hybrid Eco'],
    [19, 'PHEV_HYBRID_COMFORT', 'PHEV Hybrid Comfort'],
    [20, 'PHEV_ELECTRIC_STANDARD', 'PHEV Electric'],
    [21, 'PHEV_ELECTRIC_INDIVIDUAL', 'PHEV Electric Individual'],
    [22, 'PHEV_BATTERYCONTROL', 'PHEV Battery Control'],
    [24, 'EASE_MODUS', 'Ease'],
    [27, 'TRACTION_ASSIST', 'Traction Assist'],
    [28, 'BOOST', 'Boost']
].map((entry) => ({ value: entry[0], name: entry[1], label: entry[2] }));
const FES = 'de.bmw.infotainment.drivingexcitement.FES';
const MODE_FIELD = 'statusFESVehicleDynamicSwitchHMI';
function drivingMode(raw) {
    const value = raw && raw.actualValueModeDrivingExperience;
    return MODES.find((mode) => mode.name === value || mode.value === value) || null;
}
const LIGHT = 'de.bmw.infotainment.misc.ComfortFunctionIuK';
const COLOR_FIELD = 'statusAmbientLightInteriorColour';
// MenuInteriorLighting contains twelve factory slots; colors are vehicle/coding dependent.
const COLORS = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1, name: 'FARBAUSWAHL_' + (index + 1), label: 'Color ' + (index + 1)
}));
function colorLabel(value) {
    const color = COLORS.find((entry) => entry.value === value);
    return color ? color.label : 'Leave unchanged';
}
function reportedColor(raw) {
    const value = raw && raw.statusMenuAmbientePanoramicRoofInteriorLighting;
    const color = COLORS.find((entry) => entry.name === value || entry.value === value);
    return color ? color.value : null;
}
function colorRequest(value) {
    const color = COLORS.find((entry) => entry.value === value);
    if (!color) throw new Error('Unknown ambient color');
    return {
        controlHueInteriorLighting: 4095,
        controlMenuAmbientePanoramicRoofInteriorLighting: color.name,
        controlHueValueLayer1IndividualGroup: 255,
        controlHueValueLayer2IndividualGroup: 255,
        controlHueValueLayer3IndividualGroup: 255,
        controlBrightnessValueBrightnessOffsetAmbientePanoramicRoofInteriorLighting: 255,
        controlModeAmbientePanoramicRoofInteriorLighting: 'SIGNAL_UNBEFUELLT',
        controlDynamicInteriorLighting: 'SIGNAL_UNBEFUELLT',
        controlDynamicAmbienteInteriorLighting: 'SIGNAL_UNBEFUELLT'
    };
}

module.exports = { MODES, COLORS, FES, LIGHT, MODE_FIELD, COLOR_FIELD,
    drivingMode, colorLabel, reportedColor, colorRequest };

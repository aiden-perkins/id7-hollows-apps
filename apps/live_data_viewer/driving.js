'use strict';
const { RPM_MAX, RPM_REDLINE, rpmColor, temperatureColor, text, get, fmt } = require('./instruments');
const { chassis, gMeter, pedalStatus, physical, liveRaw } = require('./dynamics');

const LITRES_PER_US_GALLON = 3.785411784;
// Display reference requested for this car; not an ECU-reported capacity.
const FUEL_CAPACITY_G = 18;
const M850I_GEAR_RATIOS = [5.500, 3.520, 2.200, 1.720, 1.317, 1.000, 0.823, 0.640];
// Fixed display references, not measured mechanical limits.
const BARS = [
    { id: 'rpm', label: 'RPM', unit: 'rpm', shownUnit: '', max: RPM_MAX, places: 0 },
    { id: 'horsepower', label: 'POWER', unit: 'hp', shownUnit: 'HP', max: 1000, places: 0 },
    { id: 'torque', label: 'TORQUE', unit: 'lb-ft', shownUnit: 'lb-ft', max: 1000, places: 0 },
    { id: 'boost', label: 'BOOST', unit: 'psi', shownUnit: 'PSI', max: 32, places: 1 },
    { id: 'brakePressure', label: 'BRAKE', unit: 'bar', shownUnit: 'bar', max: 84, places: 1,
        color: 'crit', pedal: true, rawId: 'brakeStatus' },
    { id: 'acceleratorNative', label: 'ACCEL', unit: '%', shownUnit: '%', max: 100, places: 0,
        color: 'accel', pedal: true, fallback: 'accelerator' },
];
function rpmRedline(cv, t, x, width, yAt, current) {
    const top = yAt(RPM_MAX), bottom = yAt(RPM_REDLINE);
    const fill = yAt(Math.max(RPM_REDLINE, current.value || 0));
    if (fill > top) cv.fillRect(x + 3, top, width - 6, fill - top, t.crit + '55');
    if (fill < bottom) cv.fillRect(x + 3, fill, width - 6, bottom - fill, current.live ? t.crit : t.dim);
}
function shiftMarkers(cv, t, vm, x, width, yAt, rpm) {
    if (rpm <= 0) return;
    const actual = get(vm, 'gear');
    const gear = actual.state === 'live' ? actual : get(vm, 'gearSelection');
    if (gear.state !== 'live') return;
    const index = gear.value - 1, ratio = M850I_GEAR_RATIOS[index];
    if (!ratio) return;
    const markers = [
        { next: M850I_GEAR_RATIOS[index + 1], from: x - 6, to: x + width - 4, color: t.accent2 },
        { next: M850I_GEAR_RATIOS[index - 1], from: x + 4, to: x + width + 6, color: t.text },
    ];
    for (const { next, from, to, color } of markers) {
        if (!next) continue;
        // Estimate the RPM in the adjacent ratio at the same road speed.
        const predicted = rpm * next / ratio, y = yAt(predicted);
        cv.line(from, y, to, y, 5, t.bg);
        cv.line(from, y, to, y, 2, predicted > RPM_MAX ? t.crit : color);
    }
}
function bars(cv, t, vm, box) {
    const column = box.w / BARS.length, width = 48;
    const top = box.y + 96, bottom = box.y + box.h - 8;
    BARS.forEach((field, index) => {
        const cx = box.x + column * (index + 0.5), x = cx - width / 2;
        const raw = field.rawId ? liveRaw(vm, field.rawId) : null;
        let current = raw === null ? physical(vm, field.id, field.unit) : { value: raw, live: true };
        if (!current.live && field.fallback) {
            const fallback = physical(vm, field.fallback, field.unit);
            if (fallback.live || current.value === null) current = fallback;
        }
        // Preserve signed physical samples in the model, as with the previous performance dials.
        const value = current.value === null || field.pedal ? current.value : Math.max(0, current.value);
        const rpm = field.id === 'rpm';
        const color = current.live ? (t[field.color] || t.accent) : t.dim;
        const readoutColor = rpm && current.live ? rpmColor(t, value) : color;
        const shown = fmt(value, raw === null ? field.places : 0), options = { align: 'center', font: 'num' };
        const size = Math.min(34, 34 * (column - 8) / Math.max(1, cv.textWidth(shown, 34, options)));
        text(cv, field.label, cx, box.y + 22, column - 4, 16, t.dim, { align: 'center', font: 'bold' });
        text(cv, shown, cx, box.y + 60, column - 8, size, readoutColor, options);
        text(cv, raw === null ? field.shownUnit : 'RAW', cx, box.y + 83, column - 8, 17, t.dim, { align: 'center' });
        cv.roundRect(x, top, width, bottom - top, 6, t.track);
        const max = raw === null ? field.max : vm.model.definitions[field.rawId].invalidFrom - 1;
        const yAt = (v) => bottom - 3 - (bottom - top - 6) * Math.max(0, Math.min(1, v / max));
        const y = yAt(value || 0), height = bottom - 3 - y;
        if (height > 0) cv.roundRect(x + 3, y, width - 6, height, Math.min(4, height / 2), color);
        if (rpm) rpmRedline(cv, t, x, width, yAt, current);
        if (height > 4) cv.line(x + 7, y + 2, x + width - 7, y + 2, 2, current.live ? t.text : t.dim);
        cv.strokeRoundRect(x, top, width, bottom - top, 6, 2, t.tick);
        [0, 0.25, 0.5, 0.75, 1].forEach((fraction) => {
            const y = bottom - (bottom - top) * fraction;
            cv.line(x + width + 3, y, x + width + 8, y, 1, t.tick);
        });
        if (rpm && current.live) shiftMarkers(cv, t, vm, x, width, yAt, value);
    });
}
function readout(cv, t, vm, id, label, unit, x, y, width, places) {
    const current = physical(vm, id, unit), shown = fmt(current.value, places) + ' ' + (unit === 'F' ? '°F' : unit);
    const color = unit === 'F' ? temperatureColor(t, id, current) : (current.live ? t.accent : t.dim);
    const options = { align: 'center', font: 'num' }, cx = x + width / 2;
    const size = Math.min(36, 36 * width / Math.max(1, cv.textWidth(shown, 36, options)));
    text(cv, label, cx, y + 22, width, 17, t.dim, { align: 'center', font: 'bold' });
    text(cv, shown, cx, y + 65, width, size, color, options);
}
function fuel(cv, t, vm, x, y, width) {
    const current = physical(vm, 'tankTotal', 'L');
    const gallons = current.value === null ? null : current.value / LITRES_PER_US_GALLON;
    const percent = gallons === null ? null : Math.max(0, Math.min(100, gallons / FUEL_CAPACITY_G * 100));
    const cx = x + width / 2, shown = fmt(gallons, 2) + ' G  ' + fmt(percent, 0) + '%';
    const options = { align: 'center', font: 'num' };
    const size = Math.min(32, 32 * width / Math.max(1, cv.textWidth(shown, 32, options)));
    text(cv, 'FUEL', cx, y + 22, width, 17, t.dim, { align: 'center', font: 'bold' });
    text(cv, shown, cx, y + 65, width, size, current.live ? t.accent : t.dim, options);
}
function exhaust(cv, t, vm, x, y) {
    const cx = x + 64;
    text(cv, 'EXHAUST', cx, y + 22, 120, 16, t.dim, { align: 'center', font: 'bold' });
    cv.roundRect(cx - 22, y + 32, 44, 18, 5, t.panelTop);
    cv.strokeRoundRect(cx - 22, y + 32, 44, 18, 5, 1.5, t.tick);
    cv.line(cx, y + 26, cx, y + 32, 5, t.tick);
    ['Left', 'Right'].forEach((side, index) => {
        const px = cx + (index ? 42 : -42), state = get(vm, 'exhaust' + side);
        const value = state.state === 'live' && !state.retained ? state.value : null;
        const color = value === 'OPEN' || value === 'CLOSED' ? t.accent : t.dim;
        cv.polyline([[cx + (index ? 22 : -22), y + 41], [px, y + 41], [px, y + 52]], 5, t.tick);
        if (value === 'CLOSED') cv.circle(px, y + 64, 9, color);
        else cv.arc(px, y + 64, 6, 9, 0, 360, color);
    });
    [['open', 'Open'], ['closed', 'Closed'], ['oem', 'OEM']].forEach(([mode, label], index) => {
        const bx = x + 144 + index * 168, by = y + 22, selected = vm.exhaustMode === mode;
        cv.roundRect(bx, by, 160, 56, 7, selected ? t.target + '28' : t.panelTop);
        cv.strokeRoundRect(bx, by, 160, 56, 7, 1.5, selected ? t.target : t.tick);
        text(cv, label, bx + 80, by + 36, 148, 25, selected ? t.target : t.text, { align: 'center', font: 'bold' });
        cv.targets.push({ key: 'exhaust' + label, x: bx, y: by, w: 160, h: 56,
            run: () => vm.setExhaust(mode) });
    });
}
module.exports = function driving(cv, t, vm) {
    cv.targets = [];
    const top = vm.contentTop + 4, bottom = vm.contentBottom - 4;
    const footerTop = bottom - 88, height = footerTop - 12 - top;
    gMeter(cv, t, vm, { x: 16, y: top, w: 256, h: height });
    pedalStatus(cv, t, vm, 'parkingBrake', 'PARKING BRAKE', 78, top + height - 32, 124);
    pedalStatus(cv, t, vm, 'kickdown', 'KICKDOWN', 210, top + height - 32, 124);
    chassis(cv, t, vm, { x: 288, y: top, w: 740, h: height });
    bars(cv, t, vm, { x: 1056, y: top, w: 528, h: height });
    cv.line(16, footerTop, 1584, footerTop, 1, t.track);
    readout(cv, t, vm, 'oilCds', 'OIL', 'F', 16, footerTop, 148, 0);
    readout(cv, t, vm, 'coolantCds', 'COOLANT', 'F', 180, footerTop, 148, 0);
    readout(cv, t, vm, 'transmission2', 'TRANS', 'F', 344, footerTop, 148, 0);
    readout(cv, t, vm, 'voltage', 'BATTERY', 'V', 508, footerTop, 148, 2);
    fuel(cv, t, vm, 672, footerTop, 244);
    exhaust(cv, t, vm, 940, footerTop);
};

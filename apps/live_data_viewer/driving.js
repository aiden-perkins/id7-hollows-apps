'use strict';
const { C, text, get, fmt } = require('./instruments');
const { chassis, gMeter, pedalStatus, physical } = require('./dynamics');

const LITRES_PER_US_GALLON = 3.785411784;
// Display reference requested for this car; not an ECU-reported capacity.
const FUEL_CAPACITY_G = 18;
// Fixed display references, not measured mechanical limits.
const BARS = [
    { id: 'rpm', label: 'RPM', unit: 'rpm', shownUnit: '', max: 8000, places: 0 },
    { id: 'horsepower', label: 'POWER', unit: 'hp', shownUnit: 'HP', max: 1000, places: 0 },
    { id: 'torque', label: 'TORQUE', unit: 'lb-ft', shownUnit: 'lb-ft', max: 1000, places: 0 },
    { id: 'boost', label: 'BOOST', unit: 'psi', shownUnit: 'PSI', max: 40, places: 1 },
    { id: 'brakePressure', label: 'BRAKE', unit: 'bar', shownUnit: 'bar', max: 84, places: 1, pedal: true },
    { id: 'accelerator', label: 'ACCEL', unit: '%', shownUnit: '%', max: 100, places: 0, pedal: true },
];
function bars(cv, t, vm, box) {
    const column = box.w / BARS.length, width = 48;
    const top = box.y + 96, bottom = box.y + box.h - 8;
    BARS.forEach((field, index) => {
        const cx = box.x + column * (index + 0.5), x = cx - width / 2;
        const current = physical(vm, field.id, field.unit);
        // Preserve signed physical samples in the model, as with the previous performance dials.
        const value = current.value === null || field.pedal ? current.value : Math.max(0, current.value);
        const color = current.live ? field.pedal ? C.cyan : C.blue : t.dim;
        const shown = fmt(value, field.places), options = { align: 'center', font: 'num' };
        const size = Math.min(34, 34 * (column - 8) / Math.max(1, cv.textWidth(shown, 34, options)));
        text(cv, field.label, cx, box.y + 22, column - 4, 16, t.dim, { align: 'center', font: 'bold' });
        text(cv, shown, cx, box.y + 60, column - 8, size, color, options);
        text(cv, field.shownUnit, cx, box.y + 83, column - 8, 17, t.dim, { align: 'center' });
        cv.roundRect(x, top, width, bottom - top, 6, t.track);
        if (value !== null) {
            const height = (bottom - top - 6) * Math.max(0, Math.min(1, value / field.max));
            if (height > 0) {
                const y = bottom - 3 - height;
                cv.roundRect(x + 3, y, width - 6, height, Math.min(4, height / 2), color);
                if (height > 4) cv.line(x + 7, y + 2, x + width - 7, y + 2, 2, current.live ? t.text : t.dim);
            }
        }
        cv.strokeRoundRect(x, top, width, bottom - top, 6, 2, t.tick);
        [0, 0.25, 0.5, 0.75, 1].forEach((fraction) => {
            const y = bottom - (bottom - top) * fraction;
            cv.line(x + width + 3, y, x + width + 8, y, 1, t.tick);
        });
    });
}
function readout(cv, t, vm, id, label, unit, x, y, width, places) {
    const current = physical(vm, id, unit), shown = fmt(current.value, places) + ' ' + (unit === 'F' ? '°F' : unit);
    const options = { align: 'center', font: 'num' }, cx = x + width / 2;
    const size = Math.min(36, 36 * width / Math.max(1, cv.textWidth(shown, 36, options)));
    text(cv, label, cx, y + 22, width, 17, t.dim, { align: 'center', font: 'bold' });
    text(cv, shown, cx, y + 65, width, size, current.live ? C.blue : t.dim, options);
}
function fuel(cv, t, vm, x, y, width) {
    const current = physical(vm, 'tankTotal', 'L');
    const gallons = current.value === null ? null : current.value / LITRES_PER_US_GALLON;
    const percent = gallons === null ? null : Math.max(0, Math.min(100, gallons / FUEL_CAPACITY_G * 100));
    const cx = x + width / 2, shown = fmt(gallons, 2) + ' G  ' + fmt(percent, 0) + '%';
    const options = { align: 'center', font: 'num' };
    const size = Math.min(32, 32 * width / Math.max(1, cv.textWidth(shown, 32, options)));
    text(cv, 'FUEL', cx, y + 22, width, 17, t.dim, { align: 'center', font: 'bold' });
    text(cv, shown, cx, y + 65, width, size, current.live ? C.blue : t.dim, options);
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
        const color = value === 'OPEN' || value === 'CLOSED' ? C.blue : t.dim;
        cv.polyline([[cx + (index ? 22 : -22), y + 41], [px, y + 41], [px, y + 52]], 5, t.tick);
        if (value === 'CLOSED') cv.circle(px, y + 64, 9, color);
        else cv.arc(px, y + 64, 6, 9, 0, 360, color);
    });
    [['open', 'Open'], ['closed', 'Closed'], ['oem', 'OEM']].forEach(([mode, label], index) => {
        const bx = x + 144 + index * 168, by = y + 22, selected = vm.exhaustMode === mode;
        cv.roundRect(bx, by, 160, 56, 7, selected ? C.blue + '28' : t.panelTop);
        cv.strokeRoundRect(bx, by, 160, 56, 7, 1.5, selected ? C.blue : t.tick);
        text(cv, label, bx + 80, by + 36, 148, 25, selected ? C.blue : t.text, { align: 'center', font: 'bold' });
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
    readout(cv, t, vm, 'transmissionDa12', 'TRANS', 'F', 344, footerTop, 148, 0);
    readout(cv, t, vm, 'voltage', 'BATTERY', 'V', 508, footerTop, 148, 2);
    fuel(cv, t, vm, 672, footerTop, 244);
    exhaust(cv, t, vm, 940, footerTop);
};

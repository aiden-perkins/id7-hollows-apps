'use strict';
const I = require('./instruments');
const M = require('./meters');
const { C, text, get, numeric, fmt, ink } = I;
// October 2018 M850i specification: 68 L graphical reference, not a live capacity.
const FUEL_CAPACITY_L = 68;
const PERFORMANCE = [
    { id: 'boost', label: 'BOOST' },
    { id: 'horsepower', label: 'POWER' },
    { id: 'torque', label: 'TORQUE' },
];
const TEMPERATURES = [
    { id: 'oilCds', label: 'ENGINE OIL' },
    { id: 'coolantCds', label: 'COOLANT' },
    { id: 'transmissionDa12', label: 'TRANS OIL' },
];
function reported(vm, id, values) {
    if (!vm.model.definitions[id]) return null;
    const s = get(vm, id);
    return s.state === 'live' && !s.retained && values.includes(s.value) ? s.value : null;
}
function temperatures(cv, t, vm, box) {
    const width = (box.w - 24) / 3;
    TEMPERATURES.forEach(({ id, label }, index) => {
        const x = box.x + index * (width + 12) + width / 2;
        const state = get(vm, id), value = vm.model.definitions[id].unit === 'F' ? numeric(vm, id) : null;
        text(cv, label, x, box.y + 20, width, 16, t.dim, { align: 'center', font: 'bold' });
        text(cv, fmt(value, 0) + ' °F', x, box.y + 64, width, 40, ink(t, state, C.blue),
            { align: 'center', font: 'num' });
    });
}
function fuel(cv, t, vm, x, y) {
    const width = 280, total = vm.model.definitions.tankTotal.unit === 'L' ? numeric(vm, 'tankTotal') : null;
    const color = ink(t, get(vm, 'tankTotal'), C.blue);
    cv.strokeRoundRect(x, y + 48, width, 100, 7, 2, color);
    cv.polyline([[x + 133, y + 48], [x + 133, y + 34], [x + 182, y + 34], [x + 197, y + 48]], 2, color);
    cv.line(x + 142, y + 41, x + 179, y + 41, 3, color);
    cv.polyline([[x + 245, y + 48], [x + 250, y + 37], [x + 273, y + 41], [x + 268, y + 48]], 3, color);
    if (total !== null) {
        const height = 94 * Math.max(0, Math.min(1, total / FUEL_CAPACITY_L));
        if (height > 0) cv.fillRect(x + 3, y + 145 - height, width - 6, height, color + '20');
    }
    text(cv, fmt(total, 2) + ' L', x + width / 2, y + 81, width - 24, 20, color, { align: 'center', font: 'num' });
    text(cv, fmt(total === null ? null : total / 3.785411784, 2) + ' G', x + width / 2, y + 112, width - 24, 30, color, { align: 'center', font: 'num' });
    const percent = total === null ? null : Math.max(0, Math.min(100, total / FUEL_CAPACITY_L * 100));
    text(cv, fmt(percent, 0) + '%', x + width / 2, y + 137, 58, 15, color, { align: 'center', font: 'num' });
    ['tankLeft', 'tankRight'].forEach((id, index) => {
        const litres = vm.model.definitions[id].unit === 'L' ? numeric(vm, id) : null, anchor = index ? x + width - 12 : x + 12;
        text(cv, (index ? 'R ' : 'L ') + fmt(litres === null ? null : litres / 3.785411784, 2) + ' G',
            anchor, y + 137, 92, 14, ink(t, get(vm, id), C.blue), { align: index ? 'right' : 'left', font: 'num' });
    });
}
function electrical(cv, t, vm, x, y) {
    const width = 250, value = vm.model.definitions.voltage.unit === 'V' ? numeric(vm, 'voltage') : null;
    const reading = vm.model.readings.voltage, color = ink(t, get(vm, 'voltage'), C.blue);
    cv.strokeRoundRect(x, y + 48, width, 100, 7, 2, color);
    cv.fillRect(x + width, y + 80, 9, 32, color);
    cv.line(x + 16, y + 68, x + 34, y + 68, 2, color); cv.line(x + 25, y + 59, x + 25, y + 77, 2, color);
    cv.line(x + width - 34, y + 68, x + width - 16, y + 68, 2, color);
    text(cv, fmt(value, 2) + ' V', x + width / 2, y + 108, width - 28, 32, color, { align: 'center', font: 'num' });
    text(cv, 'MIN ' + fmt(reading.min, 2), x + 14, y + 137, 104, 15, t.dim, { font: 'num' });
    text(cv, 'MAX ' + fmt(reading.max, 2), x + width - 14, y + 137, 104, 15, t.dim, { align: 'right', font: 'num' });
}
function exhaust(cv, t, vm, x, y) {
    const center = x + 128;
    cv.roundRect(center - 46, y + 50, 92, 35, 10, t.panelTop);
    cv.strokeRoundRect(center - 46, y + 50, 92, 35, 10, 2, t.tick);
    cv.line(center, y + 40, center, y + 50, 12, t.tick);
    ['Left', 'Right'].forEach((side, index) => {
        const px = center + (index ? 75 : -75), state = reported(vm, 'exhaust' + side, ['OPEN', 'CLOSED']);
        const color = state === null ? t.dim : C.blue;
        cv.polyline([[center + (index ? 46 : -46), y + 68], [px, y + 68], [px, y + 85]], 11, t.tick);
        if (state === 'CLOSED') cv.circle(px, y + 93, 14, color);
        else cv.arc(px, y + 93, 10, 14, 0, 360, color);
    });
    const labels = ['Open', 'Closed', 'OEM'], modes = ['open', 'closed', 'oem'];
    modes.forEach((mode, index) => {
        const bx = x + 280 + index * 104, by = y + 62, selected = vm.exhaustMode === mode;
        cv.roundRect(bx, by, 96, 48, 7, selected ? C.blue + '28' : t.panelTop);
        cv.strokeRoundRect(bx, by, 96, 48, 7, 1.5, selected ? C.blue : t.tick);
        text(cv, labels[index], bx + 48, by + 30, 88, 18, selected ? C.blue : t.text, { align: 'center', font: 'bold' });
        cv.targets.push({ key: 'exhaust' + labels[index], x: bx, y: by, w: 96, h: 48,
            run: () => vm.setExhaust(mode) });
    });
}
module.exports = function driving(cv, t, vm) {
    cv.targets = [];
    const top = vm.contentTop + 4, bottom = vm.contentBottom - 4, height = bottom - top;
    const leftWidth = 928, right = 960, rightWidth = 624, dialWidth = (leftWidth - 32) / 3;
    cv.roundRect(16, top, leftWidth, height, 10, t.panelBottom);
    cv.strokeRoundRect(16, top, leftWidth, height, 10, 1, t.track);
    cv.roundRect(right, top, rightWidth, height, 10, t.panelBottom);
    cv.strokeRoundRect(right, top, rightWidth, height, 10, 1, t.track);
    PERFORMANCE.forEach(({ id, label }, index) => {
        M.dial(cv, t, vm, id, label,
            { x: 32 + index * dialWidth, y: top + 16, w: dialWidth, h: height - 32 }, C.blue);
    });
    [0.24, 0.67].forEach((fraction) => {
        const y = top + height * fraction;
        cv.line(right + 16, y, right + rightWidth - 16, y, 1, t.track);
    });
    temperatures(cv, t, vm, { x: right + 16, y: top + 12, w: rightWidth - 32 });
    const accessoryTop = top + height * 0.455 - 91;
    electrical(cv, t, vm, right + 24, accessoryTop);
    fuel(cv, t, vm, right + 320, accessoryTop);
    exhaust(cv, t, vm, right + 16, top + height * 0.835 - 75);
};

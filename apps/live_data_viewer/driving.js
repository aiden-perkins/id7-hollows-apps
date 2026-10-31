'use strict';
const I = require('./instruments');
const M = require('./meters');
const { C, text, get, numeric, fmt, ink } = I;
// October 2018 M850i specification: 68 L graphical reference, not a live capacity.
const FUEL_CAPACITY_L = 68;
function reported(vm, id, values) {
    if (!vm.model.definitions[id]) return null;
    const s = get(vm, id);
    return s.state === 'live' && !s.retained && values.includes(s.value) ? s.value : null;
}
function fuel(cv, t, vm, y) {
    const x = 660, width = 280, total = vm.model.definitions.tankTotal.unit === 'L' ? numeric(vm, 'tankTotal') : null;
    const color = ink(t, get(vm, 'tankTotal'), C.blue);
    cv.strokeRoundRect(x, y + 16, width, 132, 7, 2, color);
    cv.polyline([[x + 133, y + 16], [x + 133, y + 2], [x + 182, y + 2], [x + 197, y + 16]], 2, color);
    cv.line(x + 142, y + 9, x + 179, y + 9, 3, color);
    cv.polyline([[x + 245, y + 16], [x + 250, y + 5], [x + 273, y + 9], [x + 268, y + 16]], 3, color);
    if (total !== null) {
        const height = 126 * Math.max(0, Math.min(1, total / FUEL_CAPACITY_L));
        if (height > 0) cv.fillRect(x + 3, y + 145 - height, width - 6, height, color + '20');
    }
    text(cv, fmt(total, 2) + ' L', x + width / 2, y + 54, width - 24, 25, color, { align: 'center', font: 'num' });
    text(cv, fmt(total === null ? null : total / 3.785411784, 2) + ' G', x + width / 2, y + 95, width - 24, 36, color, { align: 'center', font: 'num' });
    const percent = total === null ? null : Math.max(0, Math.min(100, total / FUEL_CAPACITY_L * 100));
    text(cv, fmt(percent, 0) + '%', x + width / 2, y + 131, 58, 16, color, { align: 'center', font: 'num' });
    ['tankLeft', 'tankRight'].forEach((id, index) => {
        const litres = vm.model.definitions[id].unit === 'L' ? numeric(vm, id) : null, anchor = index ? x + width - 12 : x + 12;
        text(cv, (index ? 'R ' : 'L ') + fmt(litres === null ? null : litres / 3.785411784, 2) + ' G',
            anchor, y + 131, 92, 15, ink(t, get(vm, id), C.blue), { align: index ? 'right' : 'left', font: 'num' });
    });
}
function electrical(cv, t, vm, y) {
    const x = 143, width = 250, value = vm.model.definitions.voltage.unit === 'V' ? numeric(vm, 'voltage') : null;
    const reading = vm.model.readings.voltage, color = ink(t, get(vm, 'voltage'), C.blue);
    cv.strokeRoundRect(x, y + 16, width, 132, 7, 2, color);
    cv.fillRect(x + width, y + 57, 9, 48, color);
    cv.line(x + 16, y + 36, x + 34, y + 36, 2, color); cv.line(x + 25, y + 27, x + 25, y + 45, 2, color);
    cv.line(x + width - 34, y + 36, x + width - 16, y + 36, 2, color);
    text(cv, fmt(value, 2) + ' V', x + width / 2, y + 80, width - 28, 37, color, { align: 'center', font: 'num' });
    text(cv, 'MIN ' + fmt(reading.min, 2), x + 14, y + 123, 104, 16, t.dim, { font: 'num' });
    text(cv, 'MAX ' + fmt(reading.max, 2), x + width - 14, y + 123, 104, 16, t.dim, { align: 'right', font: 'num' });
}
function exhaust(cv, t, vm, y) {
    const x = 1197, center = 1332;
    cv.roundRect(center - 46, y + 26, 92, 51, 10, t.panelTop);
    cv.strokeRoundRect(center - 46, y + 26, 92, 51, 10, 2, t.tick);
    cv.line(center, y + 10, center, y + 26, 12, t.tick);
    ['Left', 'Right'].forEach((side, index) => {
        const px = center + (index ? 75 : -75), state = reported(vm, 'exhaust' + side, ['OPEN', 'CLOSED']);
        const color = state === null ? t.dim : C.blue;
        cv.polyline([[center + (index ? 46 : -46), y + 52], [px, y + 52], [px, y + 73]], 11, t.tick);
        if (state === 'CLOSED') cv.circle(px, y + 82, 17, color);
        else cv.arc(px, y + 82, 12, 17, 0, 360, color);
    });
    const labels = ['Open', 'Closed', 'OEM'], modes = ['open', 'closed', 'oem'];
    modes.forEach((mode, index) => {
        const bx = x + index * 92, by = y + 110, selected = vm.exhaustMode === mode;
        cv.roundRect(bx, by, 84, 42, 7, selected ? C.blue + '28' : t.panelTop);
        cv.strokeRoundRect(bx, by, 84, 42, 7, 1.5, selected ? C.blue : t.tick);
        text(cv, labels[index], bx + 42, by + 27, 76, 18, selected ? C.blue : t.text, { align: 'center', font: 'bold' });
        cv.targets.push({ key: 'exhaust' + labels[index], x: bx, y: by, w: 84, h: 42,
            run: () => vm.setExhaust(mode) });
    });
}
module.exports = function driving(cv, t, vm) {
    cv.targets = [];
    M.dial(cv, t, vm, 'boost', 'BOOST', 84, C.blue);
    M.dial(cv, t, vm, 'horsepower', 'POWER', 616, C.blue);
    M.dial(cv, t, vm, 'torque', 'TORQUE', 1148, C.blue);
    const accessoryTop = vm.contentBottom - 156;
    electrical(cv, t, vm, accessoryTop);
    fuel(cv, t, vm, accessoryTop);
    exhaust(cv, t, vm, accessoryTop);
};

'use strict';
const I = require('./instruments');
const M = require('./meters');
const { C, text, get, numeric, fmt, ink } = I;
const wheels = ['FLH', 'FRH', 'RLH', 'RRH'];
// BMW M850i xDrive Coupe, October 2018 specifications: approx. 68 L.
// https://www.press.bmwgroup.com/global/article/attachment/T0285767EN/419601
// Model-specific graphical reference, not live ECU-reported capacity.
const FUEL_CAPACITY_L = 68;
function physical(vm, id, units) { return units.includes(vm.model.definitions[id].unit) ? numeric(vm, id) : null; }
function fresh(s) { return s.state === 'live' && !s.retained; }
function reported(vm, id, values) {
    if (!vm.model.definitions[id]) return { value: null, status: 'UNAVAILABLE' };
    const s = get(vm, id);
    if (!fresh(s)) return { value: null, status: M.status(vm, id) || 'UNKNOWN' };
    return values.includes(s.value) ? { value: s.value, status: '' } : { value: null, status: 'UNKNOWN' };
}
function indicator(cv, t, vm, id, values, x, y) {
    const signal = reported(vm, id, values), active = signal.value === values[0] || signal.value === 'LOCKING';
    const warning = signal.value === null && /HELD|STALE|ERROR|INVALID/.test(signal.status);
    const c = warning || active && id === 'parkingBrake' ? C.amber : active ? C.blue : t.dim;
    if (active) cv.circle(x, y, 11, c + '30');
    cv.arc(x, y, 10, 11.5, 0, 360, c);
    if (signal.value === null) {
        text(cv, warning ? '!' : '?', x, y + 5, 16, 15, c, { align: 'center', font: 'bold' });
    } else {
        if (id === 'parkingBrake') text(cv, ['LOCKING', 'RELEASING'].includes(signal.value) ? '~' : 'P', x, y + 5, 16, 14, c, { align: 'center', font: 'bold' });
        else {
            cv.line(x, y - 6, x, y + 4, 2, c);
            cv.polyline([[x - 4, y], [x, y + 4], [x + 4, y]], 2, c);
            cv.line(x - 5, y + 7, x + 5, y + 7, 2, c);
        }
        if (!active) cv.line(x - 8, y + 8, x + 8, y - 8, 1.5, c);
    }
}
function driverInput(cv, t, vm, id, title, x) {
    const top = vm.contentTop, d = vm.model.definitions[id], s = get(vm, id), accelerator = id === 'accelerator';
    const units = accelerator ? ['%'] : ['bar', 'psi', 'kPa'], supported = units.includes(d.unit);
    const n = physical(vm, id, units), unit = supported ? d.unit : '';
    const c = supported ? ink(t, s, C.blue) : t.dim;
    const reference = accelerator ? 100 : unit === 'psi' ? 1450.3773773 : unit === 'kPa' ? 10000 : 100;
    const range = accelerator || !supported ? [0, reference] : [0, M.bounds(vm, id, [0, reference], reference / 5)[1]];
    text(cv, title, x, top + 20, 128, 14, t.dim, { font: 'bold' });
    indicator(cv, t, vm, accelerator ? 'kickdown' : 'parkingBrake',
        accelerator ? ['ENGAGED', 'RELEASED'] : ['APPLIED', 'RELEASED', 'LOCKING', 'RELEASING'], x + 150, top + 14);
    text(cv, fmt(n, accelerator ? 0 : 1) + (unit ? ' ' + unit : ''), x + 162, top + 49, 162, 27, c, { align: 'right', font: 'num' });
    cv.roundRect(x, top + 57, 162, 20, 4, t.track);
    if (n !== null) {
        const width = 162 * Math.max(0, Math.min(1, (n - range[0]) / (range[1] - range[0])));
        if (width > 0) cv.roundRect(x, top + 57, width, 20, Math.min(4, width / 2), c);
    }
    text(cv, supported ? fmt(range[0], 0) : '--', x, top + 91, 46, 11, t.dim, { font: 'num' });
    text(cv, supported ? fmt(range[1], accelerator || unit === 'kPa' ? 0 : 1) + ' ' + unit : '',
        x + 162, top + 91, 96, 11, t.dim, { align: 'right', font: 'num' });
    text(cv, !supported ? 'Needs mapping' : M.status(vm, id), x, top + 105, 162, 11, c);
}
function wheel(cv, t, vm, i) {
    const defs = vm.model.definitions;
    const w = wheels[i], left = i % 2 === 0, x = left ? 1208 : 1465, y = vm.contentTop + (i < 2 ? 116 : 211), width = 120;
    const pressure = physical(vm, 'pressure' + w, ['bar', 'psi', 'kPa']), temp = physical(vm, 'tyreTemp' + w, ['F', 'C', '°F', '°C', 'deg F', 'deg C']);
    const target = physical(vm, 'target' + w, ['bar', 'psi', 'kPa']), s = get(vm, 'pressure' + w);
    let color = C.blue;
    if (pressure !== null && target > 0 && defs['pressure' + w].unit === defs['target' + w].unit && s.state === 'live' && !s.retained && get(vm, 'target' + w).state === 'live' && !get(vm, 'target' + w).retained) {
        const ratio = pressure / target;
        color = ratio < 0.8 || ratio > 1.25 ? C.red : ratio < 0.9 || ratio > 1.15 ? C.amber : C.blue;
    }
    const c = ink(t, s, color), anchor = left ? x : x + 110, align = left ? 'left' : 'right';
    text(cv, fmt(pressure, 1) + ' psi' + (s.retained ? ' H' : ''), anchor, y + 18, width, 22, c, { align, font: 'num' });
    text(cv, fmt(temp, 0) + ' F' + (get(vm, 'tyreTemp' + w).retained ? ' H' : ''), anchor, y + 40, width, 20, ink(t, get(vm, 'tyreTemp' + w), C.blue), { align, font: 'num' });
    const speedId = 'wheelSpeed' + w, directionId = 'wheelDirection' + w;
    const speed = vm.model.definitions[speedId] ? physical(vm, speedId, ['mph']) : null;
    const direction = reported(vm, directionId, ['FORWARD', 'REVERSE', 'STANDSTILL']);
    text(cv, fmt(speed, 1) + ' mph', anchor, y + 61, width, 17, t.text, { align, font: 'num' });
    text(cv, direction.value || direction.status, anchor, y + 78, width, 10, t.dim, { align });
}
function vehicle(cv, t, vm) {
    driverInput(cv, t, vm, 'brakePressure', 'BRAKE PRESSURE', 1208);
    driverInput(cv, t, vm, 'accelerator', 'ACCELERATOR', 1407);
    const cx = 1395, top = vm.contentTop + 110;
    const pedal = reported(vm, 'brakePedal', ['PRESSED', 'RELEASED']);
    const pressure = physical(vm, 'brakePressure', ['bar', 'psi', 'kPa']);
    const proxy = pedal.value === null && fresh(get(vm, 'brakePressure')) && pressure !== null;
    const applied = pedal.value === 'PRESSED' || proxy && pressure > 0;
    const lampKnown = pedal.value !== null || proxy;
    const lampColor = applied ? C.red : lampKnown ? t.tick : t.track;
    const body = [[cx - 29, top], [cx + 29, top], [cx + 43, top + 18], [cx + 48, top + 42],
        [cx + 43, top + 145], [cx + 31, top + 174], [cx - 31, top + 174], [cx - 43, top + 145],
        [cx - 48, top + 42], [cx - 43, top + 18], [cx - 29, top]];
    cv.quad([[cx - 29, top], [cx + 29, top], [cx + 48, top + 42], [cx - 48, top + 42]], t.panelTop);
    cv.quad([[cx - 48, top + 42], [cx + 48, top + 42], [cx + 43, top + 145], [cx - 43, top + 145]], t.panelTop);
    cv.quad([[cx - 43, top + 145], [cx + 43, top + 145], [cx + 31, top + 174], [cx - 31, top + 174]], t.panelTop);
    cv.polyline(body, 1.5, t.tick);
    cv.line(cx - 29, top + 12, cx + 29, top + 12, 2, C.blue);
    cv.quad([[cx - 36, top + 30], [cx + 36, top + 30], [cx + 30, top + 56], [cx - 30, top + 56]], t.bg);
    cv.quad([[cx - 27, top + 132], [cx + 27, top + 132], [cx + 33, top + 153], [cx - 33, top + 153]], t.bg);
    cv.line(cx - 31, top + 166, cx - 15, top + 169, 3, lampColor);
    cv.line(cx + 15, top + 169, cx + 31, top + 166, 3, lampColor);
    wheels.forEach((w, i) => {
        const wx = i % 2 === 0 ? cx - 55 : cx + 55, wy = i < 2 ? top + 46 : top + 133;
        const id = i < 2 ? 'frontAxle' : 'rearAxle';
        const angle = vm.model.definitions[id] ? physical(vm, id, ['deg', '°']) : null;
        const a = (angle === null ? 0 : angle) * Math.PI / 180;
        const rotate = (x, y) => [wx + x * Math.cos(a) - y * Math.sin(a), wy + x * Math.sin(a) + y * Math.cos(a)];
        const points = [[-10, -21], [10, -21], [10, 21], [-10, 21]].map((p) => rotate(p[0], p[1]));
        const color = angle === null ? t.dim : ink(t, get(vm, id), C.blue);
        cv.quad(points, t.bg); cv.polyline(points.concat([points[0]]), 1.5, color);
        const start = rotate(0, -17), end = rotate(0, 17);
        cv.line(start[0], start[1], end[0], end[1], 2, color);
        if (angle === null) text(cv, '?', wx, wy + 5, 16, 12, t.dim, { align: 'center' });
        wheel(cv, t, vm, i);
    });
    ['frontPower', 'rearPower'].forEach((id, i) => {
        const value = vm.model.definitions[id] ? physical(vm, id, ['hp', 'kW']) : null;
        const unit = vm.model.definitions[id] && vm.model.definitions[id].unit || 'hp';
        text(cv, i ? 'REAR' : 'FRONT', cx, top + 77 + i * 33, 80, 10, t.dim, { align: 'center' });
        text(cv, fmt(value, 0) + ' ' + unit, cx, top + 94 + i * 33, 84, 17, C.blue, { align: 'center', font: 'num' });
    });
}
function gmeter(cv, t, vm) {
    const bottom = vm.contentBottom, cx = 1252, cy = bottom - 42, r = 36;
    [0.5, 1].forEach((f) => cv.arc(cx, cy, r * f - 0.6, r * f + 0.6, 0, 360, t.tick));
    cv.line(cx - r, cy, cx + r, cy, 1, t.track); cv.line(cx, cy - r, cx, cy + r, 1, t.track);
    text(cv, '1g', cx + r + 4, cy + 5, 28, 11, t.dim);
    const lat = physical(vm, 'gLat', ['g']), lon = physical(vm, 'gLong', ['g']);
    if (lat !== null && lon !== null) {
        const scale = Math.max(1, Math.hypot(lat, lon)), px = cx + lat / scale * r, py = cy - lon / scale * r;
        const fresh = get(vm, 'gLat').state === 'live' && !get(vm, 'gLat').retained && get(vm, 'gLong').state === 'live' && !get(vm, 'gLong').retained;
        const c = fresh ? Math.hypot(lat, lon) >= 0.8 ? C.red : C.blue : C.amber;
        cv.line(cx, cy, px, py, 1.5, c); cv.circle(px, py, 5, c); cv.circle(px, py, 2, t.text);
    } else text(cv, '--', cx, cy + 7, 50, 24, t.dim, { align: 'center' });
    ['gLat', 'gLong'].forEach((id, i) => {
        const x = 1347, y = bottom - 73 + i * 36, n = i ? lon : lat, range = M.bounds(vm, id, [-1, 1], 0.5);
        text(cv, i ? 'LONG' : 'LAT', x, y + 10, 55, 14, t.dim);
        text(cv, fmt(n, 2) + ' g' + (get(vm, id).retained ? ' HELD' : ''), x + 214, y + 13, 150, 24, ink(t, get(vm, id), C.blue), { align: 'right', font: 'num' });
        M.rangeRail(cv, t, vm, id, x, y + 22, 214, range, C.blue);
        const zero = x + 214 * (0 - range[0]) / (range[1] - range[0]);
        cv.line(zero, y + 18, zero, y + 26, 1, t.tick);
    });
}
function fuel(cv, t, vm) {
    const x = 28, y = vm.contentTop + 16, width = 268;
    const total = physical(vm, 'tankTotal', ['L']), s = get(vm, 'tankTotal'), c = ink(t, s, C.blue);
    cv.strokeRoundRect(x, y, width, 132, 8, 1.5, c);
    if (total !== null) cv.fillRect(x + 2, y + 130 - 126 * Math.max(0, Math.min(1, total / FUEL_CAPACITY_L)),
        width - 4, 126 * Math.max(0, Math.min(1, total / FUEL_CAPACITY_L)), c + '18');
    text(cv, 'FUEL', x + width / 2, y + 18, width - 16, 12, t.dim, { align: 'center', font: 'bold' });
    text(cv, fmt(total, 3) + ' L', x + width / 2, y + 40, width - 16, 18, c, { align: 'center', font: 'num' });
    text(cv, fmt(total === null ? null : total / 3.785411784, 3), x + width / 2, y + 77, width - 20, 38, c, { align: 'center', font: 'num' });
    text(cv, 'US GAL TOTAL', x + width / 2, y + 93, width - 16, 10, t.dim, { align: 'center' });
    ['tankLeft', 'tankRight'].forEach((id, i) => {
        const n = physical(vm, id, ['L']), anchor = x + (i ? width - 10 : 10), align = i ? 'right' : 'left';
        text(cv, (i ? 'R ' : 'L ') + fmt(n === null ? null : n / 3.785411784, 3) + ' G', anchor, y + 113,
            118, 16, ink(t, get(vm, id), C.blue), { align, font: 'num' });
        text(cv, M.status(vm, id), anchor, y + 126, 118, 9, t.dim, { align });
    });
}
function electrical(cv, t, vm) {
    const x = 28, y = vm.contentTop + 166, v = physical(vm, 'voltage', ['V']);
    const c = ink(t, get(vm, 'voltage'), C.blue), r = vm.model.readings.voltage;
    text(cv, fmt(v, 2) + ' V', x + 134, y + 24, 260, 30, c, { align: 'center', font: 'num' });
    text(cv, 'MIN ' + fmt(r.min, 2), x, y + 48, 130, 14, t.dim, { font: 'num' });
    text(cv, 'MAX ' + fmt(r.max, 2), x + 268, y + 48, 130, 14, t.dim, { align: 'right', font: 'num' });
    cv.strokeRoundRect(x + 91, y + 60, 80, 35, 4, 1.5, c);
    cv.fillRect(x + 171, y + 70, 5, 15, c);
    cv.line(x + 101, y + 70, x + 113, y + 70, 1.5, c);
    cv.line(x + 107, y + 64, x + 107, y + 76, 1.5, c);
    cv.line(x + 151, y + 70, x + 163, y + 70, 1.5, c);
    if (v !== null) cv.fillRect(x + 95, y + 81, 72 * Math.max(0, Math.min(1, (v - 10) / 6)), 9, c + '60');
    text(cv, M.status(vm, 'voltage'), x + 134, y + 112, 260, 10, c, { align: 'center' });
}
function exhaust(cv, t, vm) {
    const x = 28, y = vm.contentBottom - 61;
    const state = reported(vm, 'exhaust', ['OPEN', 'CLOSED', 'MIXED']);
    text(cv, 'EXHAUST COMMAND', x, y, 268, 13, t.dim, { font: 'bold' });
    text(cv, state.value || state.status, x, y + 27, 268, 23, state.value ? C.blue : t.dim, { font: 'bold' });
    const right = reported(vm, 'exhaustRight', ['OPEN', 'CLOSED']), left = reported(vm, 'exhaustLeft', ['OPEN', 'CLOSED']);
    text(cv, 'R ' + (right.value || '--') + ' / L ' + (left.value || '--') + ' / not position', x, y + 45, 268, 11, t.dim);
}
module.exports = function driving(cv, t, vm) {
    cv.polyline([[315, vm.contentTop + 10], [315, vm.contentBottom - 13], [326, vm.contentBottom]], 1, t.panelEdge);
    cv.polyline([[1189, vm.contentTop + 10], [1189, vm.contentBottom - 13], [1178, vm.contentBottom]], 1, t.panelEdge);
    exhaust(cv, t, vm);
    M.dial(cv, t, vm, 'boost', 'BOOST', 326, C.blue);
    M.dial(cv, t, vm, 'horsepower', 'POWER', 611, C.cyan);
    M.dial(cv, t, vm, 'torque', 'TORQUE', 896, C.blue);
    const legendY = vm.contentBottom - 10;
    cv.circle(341, legendY - 5, 3, C.blue); M.diamond(cv, 416, legendY - 5, 4, C.blue);
    text(cv, 'MIN', 351, legendY, 50, 13, t.dim); text(cv, 'MAX / OBSERVED RANGE', 428, legendY, 260, 13, t.dim);
    fuel(cv, t, vm);
    electrical(cv, t, vm); vehicle(cv, t, vm); gmeter(cv, t, vm);
};

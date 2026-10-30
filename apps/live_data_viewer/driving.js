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
function quality(cv, t, vm, id, x, y, width) { text(cv, M.status(vm, id), x, y, width, 14, ink(t, get(vm, id), C.blue)); }
function fresh(s) { return s.state === 'live' && !s.retained; }
function reported(vm, id, values) {
    if (!vm.model.definitions[id]) return { value: null, status: 'UNAVAILABLE' };
    const s = get(vm, id);
    if (!fresh(s)) return { value: null, status: M.status(vm, id) || 'UNKNOWN' };
    return values.includes(s.value) ? { value: s.value, status: '' } : { value: null, status: 'UNKNOWN' };
}
function indicator(cv, t, vm, id, values, x, y) {
    const signal = reported(vm, id, values), active = signal.value === values[0];
    const warning = signal.value === null && /HELD|STALE|ERROR|INVALID/.test(signal.status);
    const c = warning || active && id === 'parkingBrake' ? C.amber : active ? C.blue : t.dim;
    if (active) cv.circle(x, y, 11, c + '30');
    cv.arc(x, y, 10, 11.5, 0, 360, c);
    if (signal.value === null) {
        text(cv, warning ? '!' : '?', x, y + 5, 16, 15, c, { align: 'center', font: 'bold' });
    } else {
        if (id === 'parkingBrake') text(cv, 'P', x, y + 5, 16, 14, c, { align: 'center', font: 'bold' });
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
        accelerator ? ['ENGAGED', 'RELEASED'] : ['APPLIED', 'RELEASED'], x + 150, top + 14);
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
function motion(cv, t, vm) {
    const defs = vm.model.definitions;
    const bottom = vm.contentBottom, contentTop = vm.contentTop;
    const rpm = physical(vm, 'rpm', ['rpm', 'RPM']), rpmState = get(vm, 'rpm');
    const range = M.bounds(vm, 'rpm', [0, 7000], 1000), top = contentTop + 38, end = bottom - 32, height = end - top;
    const max = Math.max(7000, range[1]), rpmY = (v) => end - height * Math.max(0, Math.min(1, v / max));
    // Provisional display references only: neither a tuned limiter nor a shift target.
    const rpmColor = (v) => v >= 6500 ? C.red : v >= 6000 ? C.amber : C.blue;
    text(cv, 'RPM', 28, contentTop + 20, 64, 16, t.dim, { font: 'bold' });
    for (let v = 0; v < max; v += 250) {
        const low = rpmY(v), high = rpmY(Math.min(max, v + 250)), gap = Math.min(2, (low - high) / 3);
        cv.fillRect(30, high + gap, 26, low - high - gap, v >= 6000 ? rpmColor(v) + '50' : t.track);
        if (v >= 6000) cv.fillRect(26, high + gap, 3, low - high - gap, rpmColor(v));
        if (rpm !== null && rpm > v) {
            const fillTop = Math.max(high + gap, rpmY(rpm));
            if (low > fillTop) cv.fillRect(30, fillTop, 26, low - fillTop, ink(t, rpmState, rpmColor(v)));
        }
    }
    // The current edge is colored at the exact value, including 6,000 and 6,500.
    if (rpm !== null && rpm > 0) cv.fillRect(28, Math.max(top, rpmY(rpm) - 1), 30, 2, ink(t, rpmState, rpmColor(rpm)));
    for (let v = 0; v <= max; v += 1000) {
        const y = rpmY(v);
        cv.line(59, y, 65, y, 1, t.tick);
        text(cv, v ? fmt(v / 1000, 0) + 'k' : '0', 70, y + 5, 32, 13, t.dim, { font: 'num' });
    }
    const observed = vm.model.readings.rpm, calibrated = ['rpm', 'RPM'].includes(defs.rpm.unit) && defs.rpm.decoder !== 'unscaled';
    if (calibrated && Number.isFinite(observed.min)) cv.circle(24, rpmY(observed.min), 3, C.blue);
    if (calibrated && Number.isFinite(observed.max)) M.diamond(cv, 24, rpmY(observed.max), 4, C.blue);
    if (rpm === null) text(cv, '--', 43, top + height / 2, 30, 20, t.dim, { align: 'center' });
    text(cv, '6/6.5k PROV.', 28, bottom - 26, 90, 11, t.dim);
    text(cv, calibrated ? M.status(vm, 'rpm') : 'Needs mapping', 28, bottom - 8, 100, 12, ink(t, rpmState, C.blue));
    const gear = get(vm, 'gear'), program = get(vm, 'gearProgram'), mode = get(vm, 'driveMode');
    const known = (s) => s.state === 'live' || s.retained;
    const g = known(gear) ? String(gear.value == null ? '--' : gear.value) : '--';
    const p = known(program) && /^[DSM]$/.test(program.value) ? program.value : '';
    const combined = /^[1-9]$/.test(g) ? p + g : g;
    const modeText = known(mode) && typeof mode.value === 'string' ? mode.value : '';
    const sport = /^SPORT/.test(modeText), eco = /^ECO/.test(modeText), accent = ink(t, mode, C.blue);
    const pretty = modeText === 'SPORT EXPERT' ? 'SPORT PLUS' : sport ? 'SPORT' : eco ? 'ECO PRO' : modeText ? modeText.split(' ')[0] : 'MODE --';
    const columnScale = Math.min(1, (bottom - contentTop - 238) / 196), gearY = contentTop + 122 * columnScale;
    text(cv, pretty, 207, contentTop + 24 * columnScale, 178, 23 * columnScale, accent, { align: 'center', font: 'bold' });
    if (mode.retained || mode.state !== 'live') text(cv, M.status(vm, 'driveMode'), 207, contentTop + 42 * columnScale, 178, 11, mode.retained ? C.amber : t.dim, { align: 'center' });
    text(cv, combined, 207, gearY, 178, (combined.length > 1 ? 66 : 74) * columnScale, ink(t, p && program.retained ? program : gear, t.text), { align: 'center', font: 'gear' });
    quality(cv, t, vm, 'gear', 118, contentTop + 142 * columnScale, 178);
    const traction = get(vm, 'traction'), tc = ink(t, traction, traction.value === 'DSC ON' ? C.blue : C.amber);
    text(cv, known(traction) ? traction.value : 'DSC --', 207, contentTop + 180 * columnScale, 178, 18 * columnScale, tc, { align: 'center', font: 'bold' });
    if (traction.retained || traction.state !== 'live') text(cv, M.status(vm, 'traction'), 207, contentTop + 196 * columnScale, 178, 11, tc, { align: 'center' });
    if (p && M.status(vm, 'gearProgram')) text(cv, 'PROGRAM ' + p + ' / ' + M.status(vm, 'gearProgram'), 118, contentTop + 158 * columnScale, 178, 10, ink(t, program, C.blue));
}
function wheel(cv, t, vm, i) {
    const defs = vm.model.definitions;
    const w = wheels[i], left = i % 2 === 0, x = left ? 1208 : 1465, y = vm.contentTop + (i < 2 ? 126 : 194), width = 136;
    const pressure = physical(vm, 'pressure' + w, ['bar', 'psi', 'kPa']), temp = physical(vm, 'tyreTemp' + w, ['F', 'C', '°F', '°C', 'deg F', 'deg C']);
    const target = physical(vm, 'target' + w, ['bar', 'psi', 'kPa']), s = get(vm, 'pressure' + w);
    let color = C.blue;
    if (pressure !== null && target > 0 && defs['pressure' + w].unit === defs['target' + w].unit && s.state === 'live' && !s.retained && get(vm, 'target' + w).state === 'live' && !get(vm, 'target' + w).retained) {
        const ratio = pressure / target;
        color = ratio < 0.8 || ratio > 1.25 ? C.red : ratio < 0.9 || ratio > 1.15 ? C.amber : C.blue;
    }
    const c = ink(t, s, color), anchor = left ? x : x + 110, align = left ? 'left' : 'right';
    text(cv, fmt(pressure, 1) + (pressure !== null ? ' ' + (defs['pressure' + w].unit || '') : '') + (s.retained ? ' H' : ''), anchor, y + 24, width, 26, c, { align, font: 'num' });
    text(cv, fmt(temp, 0) + (temp !== null ? ' ' + (defs['tyreTemp' + w].unit || '') : ' TEMP') + (get(vm, 'tyreTemp' + w).retained ? ' H' : ''), anchor, y + 51, width, 26, ink(t, get(vm, 'tyreTemp' + w), C.blue), { align, font: 'num' });
    const statuses = [M.status(vm, 'pressure' + w), M.status(vm, 'tyreTemp' + w)].filter(Boolean);
    text(cv, statuses.filter((s, index) => statuses.indexOf(s) === index).join(' / '), anchor, y + 67, width, 11, c, { align });
    cv.line(left ? x + 72 : x + 35, y - 2, left ? 1340 : 1450, y - 2, 1, t.panelEdge);
}
function vehicle(cv, t, vm) {
    driverInput(cv, t, vm, 'brakePressure', 'BRAKE PRESSURE', 1208);
    driverInput(cv, t, vm, 'accelerator', 'ACCELERATOR', 1407);
    const cx = 1395, top = vm.contentTop + 116;
    const pedal = reported(vm, 'brakePedal', ['PRESSED', 'RELEASED']);
    const pressure = physical(vm, 'brakePressure', ['bar', 'psi', 'kPa']);
    const proxy = pedal.value === null && fresh(get(vm, 'brakePressure')) && pressure !== null;
    const applied = pedal.value === 'PRESSED' || proxy && pressure > 0;
    const lampKnown = pedal.value !== null || proxy;
    const lampColor = applied ? C.red : lampKnown ? t.tick : t.track;
    const body = [[cx - 23, top], [cx + 23, top], [cx + 34, top + 12], [cx + 38, top + 35], [cx + 34, top + 118], [cx + 25, top + 144], [cx - 25, top + 144], [cx - 34, top + 118], [cx - 38, top + 35], [cx - 34, top + 12], [cx - 23, top]];
    cv.quad([[cx - 23, top], [cx + 23, top], [cx + 38, top + 35], [cx - 38, top + 35]], t.panelTop);
    cv.quad([[cx - 38, top + 35], [cx + 38, top + 35], [cx + 34, top + 118], [cx - 34, top + 118]], t.panelTop);
    cv.quad([[cx - 34, top + 118], [cx + 34, top + 118], [cx + 25, top + 144], [cx - 25, top + 144]], t.panelTop);
    cv.polyline(body, 1.5, t.tick);
    cv.polyline([[cx - 25, top + 10], [cx - 14, top + 7], [cx + 14, top + 7], [cx + 25, top + 10]], 2, C.blue);
    cv.quad([[cx - 29, top + 26], [cx + 29, top + 26], [cx + 24, top + 44], [cx - 24, top + 44]], t.bg);
    cv.polyline([[cx - 30, top + 35], [cx - 28, top + 118], [cx - 20, top + 129], [cx + 20, top + 129], [cx + 28, top + 118], [cx + 30, top + 35]], 1, t.tick);
    cv.quad([[cx - 21, top + 109], [cx + 21, top + 109], [cx + 26, top + 125], [cx - 26, top + 125]], t.bg);
    cv.line(cx - 25, top + 138, cx - 12, top + 140, 3, lampColor); cv.line(cx + 12, top + 140, cx + 25, top + 138, 3, lampColor);
    wheels.forEach((w, i) => {
        const wx = i % 2 === 0 ? cx - 46 : cx + 46, wy = i < 2 ? top + 40 : top + 108;
        const angle = i < 2 ? physical(vm, 'frontAxle', ['deg', '°']) || 0 : 0, a = angle * Math.PI / 180;
        const points = [[-11, -18], [11, -18], [11, 18], [-11, 18]].map((p) => [wx + p[0] * Math.cos(a) - p[1] * Math.sin(a), wy + p[0] * Math.sin(a) + p[1] * Math.cos(a)]);
        cv.quad(points, t.bg); cv.polyline(points.concat([points[0]]), 1.5, t.tick);
        cv.line(wx, wy - 10, wx, wy + 10, 2, t.panelEdge);
        wheel(cv, t, vm, i);
    });
    const angle = physical(vm, 'steering', ['deg', '°']), s = get(vm, 'steering'), c = ink(t, s, C.blue), sy = top + 70;
    cv.arc(cx, sy, 18, 22, 0, 360, c); cv.circle(cx, sy, 5, c);
    const a = -(angle === null ? 0 : angle) * Math.PI / 180;
    [[-19, -4], [19, -4], [0, 19]].forEach((p) => cv.line(cx, sy, cx + p[0] * Math.cos(a) - p[1] * Math.sin(a), sy + p[0] * Math.sin(a) + p[1] * Math.cos(a), 3, c));
    text(cv, fmt(angle, 0) + (angle !== null ? ' deg' : '') + (s.retained ? ' H' : ''),
        cx, sy + 39, 112, 13, c, { align: 'center' });
}
function gmeter(cv, t, vm) {
    const bottom = vm.contentBottom, cx = 1265, cy = bottom - 58, r = 54;
    [0.5, 1].forEach((f) => cv.arc(cx, cy, r * f - 0.6, r * f + 0.6, 0, 360, t.tick));
    cv.line(cx - r, cy, cx + r, cy, 1, t.track); cv.line(cx, cy - r, cx, cy + r, 1, t.track);
    text(cv, '1g', cx + r + 4, cy + 5, 28, 13, t.dim);
    const lat = physical(vm, 'gLat', ['g']), lon = physical(vm, 'gLong', ['g']);
    if (lat !== null && lon !== null) {
        const scale = Math.max(1, Math.hypot(lat, lon)), px = cx + lat / scale * r, py = cy - lon / scale * r;
        const fresh = get(vm, 'gLat').state === 'live' && !get(vm, 'gLat').retained && get(vm, 'gLong').state === 'live' && !get(vm, 'gLong').retained;
        const c = fresh ? Math.hypot(lat, lon) >= 0.8 ? C.red : C.blue : C.amber;
        cv.line(cx, cy, px, py, 1.5, c); cv.circle(px, py, 5, c); cv.circle(px, py, 2, t.text);
    } else text(cv, '--', cx, cy + 7, 50, 24, t.dim, { align: 'center' });
    ['gLat', 'gLong'].forEach((id, i) => {
        const x = 1347, y = bottom - 104 + i * 49, n = i ? lon : lat, range = M.bounds(vm, id, [-1, 1], 0.5);
        text(cv, i ? 'LONG' : 'LAT', x, y + 10, 55, 14, t.dim);
        text(cv, fmt(n, 2) + ' g' + (get(vm, id).retained ? ' HELD' : ''), x + 214, y + 13, 150, 24, ink(t, get(vm, id), C.blue), { align: 'right', font: 'num' });
        M.rangeRail(cv, t, vm, id, x, y + 27, 214, range, C.blue);
        const zero = x + 214 * (0 - range[0]) / (range[1] - range[0]);
        cv.line(zero, y + 23, zero, y + 31, 1, t.tick);
        const state = M.status(vm, id);
        if (state) text(cv, state, x, y + 45, 214, 11, ink(t, get(vm, id), C.blue));
    });
}
function fuel(cv, t, vm) {
    const defs = vm.model.definitions;
    const x = 118, y = vm.contentBottom - 222, total = physical(vm, 'tankTotal', ['L']);
    const left = physical(vm, 'tankLeft', ['L']), right = physical(vm, 'tankRight', ['L']), s = get(vm, 'tankTotal'), c = ink(t, s, C.blue);
    if (total !== null) {
        const height = 94 * Math.max(0, Math.min(1, total / FUEL_CAPACITY_L));
        if (height > 0) cv.fillRect(x + 3, y + 109 - height, 172, height, (s.retained ? C.amber : C.blue) + '20');
    }
    cv.strokeRoundRect(x, y + 12, 178, 100, 6, 2, c);
    cv.polyline([[x + 97, y + 12], [x + 97, y + 2], [x + 125, y + 2], [x + 134, y + 12]], 2, c);
    cv.line(x + 104, y + 7, x + 122, y + 7, 2, c);
    cv.polyline([[x + 149, y + 12], [x + 156, y + 4], [x + 170, y + 8], [x + 167, y + 12]], 2, c);
    text(cv, 'FUEL', x + 9, y + 27, 50, 11, t.dim, { font: 'bold' });
    text(cv, fmt(total === null ? null : total / 3.785411784, 3) + ' G', x + 9, y + 48, 78, 14, c, { font: 'num' });
    text(cv, fmt(total, 3) + ' L', x + 95, y + 48, 76, 14, c, { font: 'num' });
    const totalStatus = defs.tankTotal.unit !== 'L' ? 'Needs quantity mapping' : M.status(vm, 'tankTotal');
    text(cv, totalStatus, x + 9, y + 60, 160, 9, c);
    ['tankLeft', 'tankRight'].forEach((id, index) => {
        const column = x + (index ? 95 : 9), value = index ? right : left, state = get(vm, id), color = ink(t, state, C.blue);
        text(cv, index ? 'RIGHT' : 'LEFT', column, y + 74, 76, 10, t.dim);
        text(cv, fmt(value, 3) + ' L', column, y + 91, 76, 15, color, { font: 'num' });
        text(cv, defs[id].unit !== 'L' ? 'Needs mapping' : M.status(vm, id), column, y + 104, 76, 8, color);
    });
}
function electrical(cv, t, vm) {
    const defs = vm.model.definitions;
    const x = 118, y = vm.contentBottom - 100, voltage = get(vm, 'voltage');
    const v = physical(vm, 'voltage', ['V']), c = ink(t, voltage, C.blue), r = vm.model.readings.voltage;
    if (v !== null) {
        const height = 90 * Math.max(0, Math.min(1, (v - 10) / 6));
        if (height > 0) cv.fillRect(x + 3, y + 93 - height, 168, height, (voltage.retained ? C.amber : C.blue) + '20');
    }
    cv.strokeRoundRect(x, y, 174, 96, 6, 2, c); cv.fillRect(x + 174, y + 33, 8, 30, c);
    cv.line(x + 9, y + 14, x + 21, y + 14, 1.5, c); cv.line(x + 15, y + 8, x + 15, y + 20, 1.5, c);
    cv.line(x + 153, y + 14, x + 165, y + 14, 1.5, c);
    text(cv, 'VOLTAGE', x + 87, y + 17, 110, 10, t.dim, { align: 'center', font: 'bold' });
    text(cv, fmt(v, 2) + ' V', x + 87, y + 45, 156, 28, c, { align: 'center', font: 'num' });
    const calibrated = defs.voltage.unit === 'V' && defs.voltage.numeric && defs.voltage.decoder !== 'unscaled';
    cv.circle(x + 10, y + 59, 2.5, C.blue);
    text(cv, fmt(calibrated ? r.min : null, 2) + ' V', x + 17, y + 63, 66, 11, c, { font: 'num' });
    text(cv, fmt(calibrated ? r.max : null, 2) + ' V', x + 157, y + 63, 66, 11, c, { align: 'right', font: 'num' });
    M.diamond(cv, x + 164, y + 59, 3, C.blue);
    text(cv, defs.voltage.unit !== 'V' ? 'Needs voltage mapping' : M.status(vm, 'voltage'), x + 87, y + 91, 158, 10, c, { align: 'center' });
}
module.exports = function driving(cv, t, vm) {
    cv.polyline([[315, vm.contentTop + 10], [315, vm.contentBottom - 13], [326, vm.contentBottom]], 1, t.panelEdge);
    cv.polyline([[1189, vm.contentTop + 10], [1189, vm.contentBottom - 13], [1178, vm.contentBottom]], 1, t.panelEdge);
    motion(cv, t, vm);
    M.dial(cv, t, vm, 'boost', 'BOOST', 326, C.blue);
    M.dial(cv, t, vm, 'horsepower', 'POWER', 611, C.blue);
    M.dial(cv, t, vm, 'torque', 'TORQUE', 896, C.blue);
    const legendY = vm.contentBottom - 10;
    cv.circle(341, legendY - 5, 3, C.blue); M.diamond(cv, 416, legendY - 5, 4, C.blue);
    text(cv, 'MIN', 351, legendY, 50, 13, t.dim); text(cv, 'MAX / OBSERVED RANGE', 428, legendY, 260, 13, t.dim);
    fuel(cv, t, vm);
    electrical(cv, t, vm); vehicle(cv, t, vm); gmeter(cv, t, vm);
};

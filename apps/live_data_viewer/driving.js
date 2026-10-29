'use strict';
const D = require('./definitions');
const I = require('./instruments');
const M = require('./meters');
const { C, text, get, numeric, fmt, ink } = I;
const wheels = ['FLH', 'FRH', 'RLH', 'RRH'];
const defs = {};
D.definitions.forEach((d) => { defs[d.id] = d; });
function physical(vm, id, units) { return units.includes(defs[id].unit) ? numeric(vm, id) : null; }
function quality(cv, t, vm, id, x, y, width) { text(cv, M.status(vm, id), x, y, width, 14, ink(t, get(vm, id), C.blue)); }
function driverInput(cv, t, vm, id, title, x, color) {
    const top = vm.contentTop, d = defs[id], s = get(vm, id), units = id === 'accelerator' ? ['%'] : ['bar', 'psi', 'kPa'];
    const n = physical(vm, id, units), unit = units.includes(d.unit) ? d.unit : units[0];
    const c = units.includes(d.unit) ? ink(t, s, color) : t.dim;
    text(cv, title, x, top + 20, 162, 16, t.dim, { font: 'bold' });
    text(cv, fmt(n, unit === '%' ? 0 : 1) + ' ' + unit, x + 162, top + 52, 162, 28, c, { align: 'right', font: 'num' });
    if (n === null && !units.includes(d.unit)) text(cv, 'Needs mapping', x, top + 76, 162, 13, t.dim);
    else if (s.retained || s.state !== 'live') text(cv, M.status(vm, id), x, top + 76, 162, 13, c);
    if (unit === '%' && n !== null) {
        cv.roundRect(x, top + 62, 162, 5, 2, t.track);
        if (n > 0) cv.roundRect(x, top + 62, 162 * Math.min(100, n) / 100, 5, 2, c);
    }
}
function motion(cv, t, vm) {
    const bottom = vm.contentBottom, contentTop = vm.contentTop;
    const rpm = physical(vm, 'rpm', ['rpm', 'RPM']), rpmState = get(vm, 'rpm');
    const range = M.bounds(vm, 'rpm', [0, 7000], 1000), top = contentTop + 38, end = bottom - 32, height = end - top;
    const max = Math.max(7000, range[1]), rpmY = (v) => end - height * Math.max(0, Math.min(1, v / max));
    // 6,500 RPM is a provisional stock reference, not a tuned limiter or shift target.
    const rpmColor = (v) => v >= 6500 ? C.red : v >= 6000 ? '#ffdf70' : C.blue;
    text(cv, 'RPM', 28, contentTop + 20, 64, 16, t.dim, { font: 'bold' });
    for (let v = 0; v < max; v += 250) {
        const low = rpmY(v), high = rpmY(Math.min(max, v + 250)), gap = Math.min(2, (low - high) / 3);
        cv.fillRect(30, high + gap, 26, low - high - gap, t.track);
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
    text(cv, calibrated ? M.status(vm, 'rpm') : 'Needs mapping', 28, bottom - 8, 100, 12, ink(t, rpmState, C.blue));
    const gear = get(vm, 'gear'), program = get(vm, 'gearProgram'), mode = get(vm, 'driveMode');
    const known = (s) => s.state === 'live' || s.retained;
    const g = known(gear) ? String(gear.value == null ? '--' : gear.value) : '--';
    const p = known(program) && /^[DSM]$/.test(program.value) ? program.value : '';
    const combined = /^[1-9]$/.test(g) ? p + g : g;
    const modeText = known(mode) && typeof mode.value === 'string' ? mode.value : '';
    const sport = /^SPORT/.test(modeText), eco = /^ECO/.test(modeText), accent = ink(t, mode, sport ? C.red : eco ? C.cyan : C.blue);
    const pretty = modeText === 'SPORT EXPERT' ? 'SPORT PLUS' : sport ? 'SPORT' : eco ? 'ECO PRO' : modeText ? modeText.split(' ')[0] : 'MODE --';
    const gearY = contentTop + (bottom - contentTop) * 0.47;
    text(cv, pretty, 118, contentTop + 30, 178, 26, accent, { font: 'bold' });
    const variant = modeText === 'SPORT EXPERT' ? 'REPORTED: SPORT EXPERT' : modeText.replace(/^(SPORT|ECO PRO|COMFORT)\s*/, '');
    text(cv, mode.retained || mode.state !== 'live' ? M.status(vm, 'driveMode') : variant, 118, contentTop + 54, 178, 13, mode.retained ? C.amber : t.dim);
    text(cv, combined, 207, gearY, 178, combined.length > 1 ? 100 : 118, ink(t, p && program.retained ? program : gear, t.text), { align: 'center', font: 'gear' });
    quality(cv, t, vm, 'gear', 118, gearY + 28, 178);
    const traction = get(vm, 'traction'), tc = ink(t, traction, traction.value === 'DSC ON' ? C.blue : C.amber);
    text(cv, known(traction) ? traction.value : 'DSC --', 118, gearY + 82, 178, 20, tc, { font: 'bold' });
    if (traction.retained || traction.state !== 'live') text(cv, M.status(vm, 'traction'), 118, gearY + 106, 178, 13, tc);
    if (p) text(cv, 'PROGRAM ' + p + (M.status(vm, 'gearProgram') ? ' / ' + M.status(vm, 'gearProgram') : ''), 118, bottom - 24, 178, 13, ink(t, program, C.blue));
}
function wheel(cv, t, vm, i) {
    const w = wheels[i], left = i % 2 === 0, x = left ? 1208 : 1465, y = vm.contentTop + (i < 2 ? 108 : 190), width = 110;
    const pressure = physical(vm, 'pressure' + w, ['bar', 'psi', 'kPa']), temp = physical(vm, 'tyreTemp' + w, ['F', 'C', '°F', '°C', 'deg F', 'deg C']);
    const target = physical(vm, 'target' + w, ['bar', 'psi', 'kPa']), s = get(vm, 'pressure' + w);
    let color = C.blue;
    if (pressure !== null && target > 0 && defs['pressure' + w].unit === defs['target' + w].unit && s.state === 'live' && !s.retained && get(vm, 'target' + w).state === 'live' && !get(vm, 'target' + w).retained) {
        const ratio = pressure / target;
        color = ratio < 0.8 || ratio > 1.25 ? C.red : ratio < 0.9 || ratio > 1.15 ? C.amber : C.green;
    }
    const c = ink(t, s, color), anchor = left ? x : x + width, align = left ? 'left' : 'right';
    text(cv, ['FL', 'FR', 'RL', 'RR'][i], anchor, y, width, 14, t.dim, { align, font: 'bold' });
    text(cv, fmt(pressure, 1) + (pressure !== null ? ' ' + (defs['pressure' + w].unit || '') : '') + (s.retained ? ' H' : ''), anchor, y + 27, width, 24, c, { align, font: 'num' });
    text(cv, fmt(temp, 0) + (temp !== null ? ' ' + (defs['tyreTemp' + w].unit || '') : ' TEMP') + (get(vm, 'tyreTemp' + w).retained ? ' H' : ''), anchor, y + 51, width, 16, ink(t, get(vm, 'tyreTemp' + w), C.cyan), { align });
    const statuses = [M.status(vm, 'pressure' + w), M.status(vm, 'tyreTemp' + w)].filter(Boolean);
    text(cv, statuses.filter((s, index) => statuses.indexOf(s) === index).join(' / '), anchor, y + 67, width, 11, c, { align });
    cv.line(left ? x + 72 : x + 35, y - 2, left ? 1340 : 1450, y - 2, 1, t.panelEdge);
}
function vehicle(cv, t, vm) {
    driverInput(cv, t, vm, 'brakePressure', 'BRAKE PRESSURE', 1208, C.red);
    driverInput(cv, t, vm, 'accelerator', 'ACCELERATOR', 1407, C.cyan);
    const cx = 1395, top = vm.contentTop + 102;
    const body = [[cx - 23, top], [cx + 23, top], [cx + 34, top + 12], [cx + 38, top + 35], [cx + 34, top + 118], [cx + 25, top + 144], [cx - 25, top + 144], [cx - 34, top + 118], [cx - 38, top + 35], [cx - 34, top + 12], [cx - 23, top]];
    cv.quad([[cx - 23, top], [cx + 23, top], [cx + 38, top + 35], [cx - 38, top + 35]], t.panelTop);
    cv.quad([[cx - 38, top + 35], [cx + 38, top + 35], [cx + 34, top + 118], [cx - 34, top + 118]], t.panelTop);
    cv.quad([[cx - 34, top + 118], [cx + 34, top + 118], [cx + 25, top + 144], [cx - 25, top + 144]], t.panelTop);
    cv.polyline(body, 1.5, '#54657b');
    cv.polyline([[cx - 25, top + 10], [cx - 14, top + 7], [cx + 14, top + 7], [cx + 25, top + 10]], 2, C.blue);
    cv.quad([[cx - 29, top + 26], [cx + 29, top + 26], [cx + 24, top + 44], [cx - 24, top + 44]], '#1c3449');
    cv.polyline([[cx - 30, top + 35], [cx - 28, top + 118], [cx - 20, top + 129], [cx + 20, top + 129], [cx + 28, top + 118], [cx + 30, top + 35]], 1, t.tick);
    cv.quad([[cx - 21, top + 109], [cx + 21, top + 109], [cx + 26, top + 125], [cx - 26, top + 125]], '#142535');
    cv.line(cx - 25, top + 138, cx - 12, top + 140, 3, C.red); cv.line(cx + 12, top + 140, cx + 25, top + 138, 3, C.red);
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
    text(cv, 'TPMS / H = HELD', 1208, vm.contentTop + 278, 353, 13, t.dim);
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
        const c = fresh ? Math.hypot(lat, lon) >= 0.8 ? C.red : C.cyan : C.amber;
        cv.line(cx, cy, px, py, 1.5, c); cv.circle(px, py, 5, c); cv.circle(px, py, 2, t.text);
    } else text(cv, '--', cx, cy + 7, 50, 24, t.dim, { align: 'center' });
    ['gLat', 'gLong'].forEach((id, i) => {
        const x = 1347, y = bottom - 104 + i * 49, n = i ? lon : lat, range = M.bounds(vm, id, [-1, 1], 0.5);
        text(cv, i ? 'LONG' : 'LAT', x, y + 10, 55, 14, t.dim);
        text(cv, fmt(n, 2) + ' g' + (get(vm, id).retained ? ' HELD' : ''), x + 214, y + 13, 150, 24, ink(t, get(vm, id), C.cyan), { align: 'right', font: 'num' });
        M.rangeRail(cv, t, vm, id, x, y + 27, 214, range, C.cyan);
        const zero = x + 214 * (0 - range[0]) / (range[1] - range[0]);
        cv.line(zero, y + 23, zero, y + 31, 1, t.tick);
        const state = M.status(vm, id);
        if (state) text(cv, state, x, y + 45, 214, 11, ink(t, get(vm, id), C.cyan));
    });
}
function fuel(cv, t, vm) {
    const x = 334, y = vm.contentBottom - 128, total = physical(vm, 'tankTotal', ['L']);
    const left = physical(vm, 'tankLeft', ['L']), right = physical(vm, 'tankRight', ['L']), s = get(vm, 'tankTotal'), c = ink(t, s, C.blue);
    text(cv, 'FUEL', x, y + 18, 341, 17, t.dim, { font: 'bold' });
    text(cv, fmt(total === null ? null : total / 3.785411784, 1), x, y + 65, 164, 44, c, { font: 'num' });
    text(cv, 'US gal', x, y + 87, 164, 16, t.dim);
    text(cv, fmt(total, 1) + ' L', x + 174, y + 65, 167, 30, c, { font: 'num' });
    text(cv, 'LEFT ' + fmt(left, 1) + ' L   RIGHT ' + fmt(right, 1) + ' L', x, y + 110, 341, 16, t.text);
    const ids = ['tankTotal', 'tankLeft', 'tankRight'], labels = ['TOTAL', 'LEFT', 'RIGHT'];
    const states = ids.map((id, i) => M.status(vm, id) ? labels[i] + ' ' + M.status(vm, id) : '').filter(Boolean);
    text(cv, ids.some((id) => defs[id].unit !== 'L') ? 'Needs fuel-quantity mapping' : states.join(' / '),
        x, y + 126, 341, 13, ids.some((id) => get(vm, id).retained || get(vm, id).state === 'stale') ? C.amber : t.dim);
}
function electrical(cv, t, vm) {
    const x = 902, y = vm.contentBottom - 128, voltage = get(vm, 'voltage');
    const v = physical(vm, 'voltage', ['V']), c = ink(t, voltage, C.blue), r = vm.model.readings.voltage;
    cv.strokeRoundRect(x + 4, y + 17, 244, 80, 8, 2, c); cv.fillRect(x + 248, y + 41, 10, 32, c);
    cv.line(x + 17, y + 34, x + 33, y + 34, 2, c); cv.line(x + 25, y + 26, x + 25, y + 42, 2, c);
    cv.line(x + 218, y + 34, x + 234, y + 34, 2, c);
    text(cv, fmt(v, 2) + ' V', x + 126, y + 76, 204, 40, c, { align: 'center', font: 'num' });
    M.rangeRail(cv, t, vm, 'voltage', x, y + 109, 264, M.bounds(vm, 'voltage', [10, 16], 1), C.blue);
    text(cv, defs.voltage.unit !== 'V' ? 'Needs voltage mapping' : voltage.retained || voltage.state !== 'live' ? M.status(vm, 'voltage') :
        'MIN ' + fmt(r.min, 2) + '  MAX ' + fmt(r.max, 2) + ' V', x, y + 126, 264, 13, c);
}
module.exports = function driving(cv, t, vm) {
    cv.polyline([[315, vm.contentTop + 10], [315, vm.contentBottom - 13], [326, vm.contentBottom]], 1, t.panelEdge);
    cv.polyline([[1189, vm.contentTop + 10], [1189, vm.contentBottom - 13], [1178, vm.contentBottom]], 1, t.panelEdge);
    motion(cv, t, vm);
    M.dial(cv, t, vm, 'boost', 'BOOST', 326, C.blue);
    M.dial(cv, t, vm, 'horsepower', 'POWER', 611, C.red);
    M.dial(cv, t, vm, 'torque', 'TORQUE', 896, C.purple);
    const legendY = vm.contentBottom - 136;
    cv.circle(341, legendY - 5, 3, C.blue); M.diamond(cv, 416, legendY - 5, 4, C.blue);
    text(cv, 'MIN', 351, legendY, 50, 13, t.dim); text(cv, 'MAX / OBSERVED RANGE', 428, legendY, 260, 13, t.dim);
    fuel(cv, t, vm);
    const tp = defs.transmissionPressure.unit, transRef = tp === 'bar' ? [0, 10] : tp === 'kPa' ? [0, 1000] : [0, 150];
    M.linear(cv, t, vm, 'transmissionPressure', 'TRANS. PRESSURE', { x: 695, y: vm.contentBottom - 128, w: 179, h: 126 }, transRef, C.cyan, 1);
    electrical(cv, t, vm); vehicle(cv, t, vm); gmeter(cv, t, vm);
};

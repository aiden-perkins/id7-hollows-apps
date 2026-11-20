'use strict';
const { C, text, get, numeric, fmt, ink } = require('./instruments');

const temperatures = [
    ['Oil', 'oil'], ['Coolant', 'coolant'], ['Transmission', 'transmission2'],
    ['Rear differential', 'rearDifferential'], ['Outside', 'outsideStatus'],
];
const air = [
    ['Charge air', 'preThrottleAir', 'chargeAirBank2'],
    ['Intake air', 'iatBank1', 'iatBank2'],
];
const pressures = [
    ['LPFP', 'fuelLowActual', 'fuelLowTarget'], ['HPFP abs.', 'statusFuelHighActual', 'fuelHighTarget'],
    ['Boost', 'statusBoostActual', 'statusBoostTarget'], ['Oil', 'oilPressure'],
];
// Viewed from above, with the front of the engine at the top.
const cylinderRows = [[5, 1], [6, 2], [7, 3], [8, 4]];
const misfireIds = [].concat(...cylinderRows).map((cylinder) => 'misfire' + cylinder);
const knockIds = ['knockDme2', 'knockDme1'];
const ids = temperatures.concat(air, pressures).reduce((all, row) => all.concat(row.slice(1)), misfireIds.concat(knockIds));
const right = { align: 'right', font: 'num' }, centered = { align: 'center', font: 'num' };

function reading(cv, t, vm, id, x, y, width, options, accent, places = 0) {
    const state = get(vm, id);
    const value = numeric(vm, id);
    text(cv, fmt(value, places), x, y, width, 28, value === null ? t.dim : ink(t, state, accent), options);
}
function panel(cv, t, x, y, w, h, title) {
    cv.roundRect(x, y, w, h, 8, t.panelBottom);
    text(cv, title, x + 18, y + 33, w - 36, 19, t.text, { font: 'bold' });
    cv.line(x + 18, y + 47, x + w - 18, y + 47, 1, t.panelEdge);
}
function header(cv, t, label, x, y, width, color = t.dim) {
    text(cv, label, x, y, width, 15, color, { align: 'right', font: 'bold' });
}
function temperaturePanel(cv, t, vm, x, y, w, h) {
    panel(cv, t, x, y, w, h, 'TEMPERATURES · °F');
    const step = (h - 58) / 8, end = x + w - 18;
    const trace = x + w * 0.70, traceHeight = Math.min(25, step * 0.6);
    const bank2 = trace - 16, bank1 = bank2 - 66;
    const bankColors = [C.blue, C.cyan];
    header(cv, t, vm.model.settings.trendSeconds + ' s', end, y + 33, 70);
    temperatures.forEach(([label, id], index) => {
        const row = y + 49 + (index + 0.75) * step;
        text(cv, label, x + 18, row, bank2 - x - 92, 22, t.text);
        reading(cv, t, vm, id, bank2, row, 62, right);
        sparkline(cv, t, vm, [id], bankColors, trace, row - 11 - traceHeight / 2, end - trace, traceHeight);
    });
    cv.line(x + 18, y + 49 + step * 5, end, y + 49 + step * 5, 1, t.panelEdge);
    header(cv, t, 'BANK 1', bank1, y + 49 + step * 5.55, 64, C.blue);
    header(cv, t, 'BANK 2', bank2, y + 49 + step * 5.55, 64, C.cyan);
    air.forEach(([label, first, second], index) => {
        const row = y + 49 + (index + 6.67) * step;
        text(cv, label, x + 18, row, bank1 - x - 92, 22, t.text);
        reading(cv, t, vm, first, bank1, row, 62, right, C.blue);
        reading(cv, t, vm, second, bank2, row, 62, right, C.cyan);
        sparkline(cv, t, vm, [first, second], bankColors,
            trace, row - 11 - traceHeight / 2, end - trace, traceHeight);
    });
}
function sparkline(cv, t, vm, ids, colors, x, y, w, h) {
    const now = Date.now(), window = vm.model.settings.trendSeconds * 1000, start = now - window;
    let low = Infinity, high = -Infinity;
    const lines = ids.map((id) => {
        const history = vm.model.readings[id].history;
        let first = history.length;
        while (first > 0 && history[first - 1].at >= start) first--;
        for (let i = first; i < history.length; i++) {
            const value = history[i].value;
            if (!Number.isFinite(value)) continue;
            low = Math.min(low, value); high = Math.max(high, value);
        }
        return { history, first, staleMs: vm.model.definitions[id].staleMs };
    });
    cv.line(x, y + h / 2, x + w, y + h / 2, 1, t.panelEdge);
    if (!Number.isFinite(low)) return;
    const span = Math.max(high - low, 1), base = (high + low - span) / 2;
    lines.forEach(({ history, first, staleMs }, series) => {
        let prior = null;
        for (let i = first; i < history.length; i++) {
            const point = history[i];
            if (!Number.isFinite(point.value) || point.at > now) { prior = null; continue; }
            const px = x + w * (point.at - start) / window, py = y + h * (1 - (point.value - base) / span);
            if (prior && point.at - prior.at <= staleMs) cv.line(prior.x, prior.y, px, py, 2, colors[series]);
            else cv.circle(px, py, 2, colors[series]);
            prior = { x: px, y: py, at: point.at };
        }
    });
}
function pressurePanel(cv, t, vm, x, y, w, h) {
    panel(cv, t, x, y, w, h, 'PRESSURES · PSI');
    const actual = x + w * 0.40, target = x + w * 0.61, trace = x + w * 0.65;
    const step = (h - 82) / pressures.length;
    header(cv, t, 'ACTUAL', actual, y + 71, 98, C.blue);
    header(cv, t, 'TARGET', target, y + 71, 98, C.cyan);
    header(cv, t, vm.model.settings.trendSeconds + ' s', x + w - 18, y + 71, w - (trace - x) - 18);
    pressures.forEach(([label, live, setpoint], index) => {
        const row = y + 79 + (index + 0.55) * step, places = label === 'HPFP abs.' ? 0 : 1;
        text(cv, label, x + 18, row + 7, actual - x - 109, 23, t.text);
        reading(cv, t, vm, live, actual, row + 8, 97, right, C.blue, places);
        if (setpoint) reading(cv, t, vm, setpoint, target, row + 8, 97, right, C.cyan, places);
        sparkline(cv, t, vm, setpoint ? [live, setpoint] : [live], [C.blue, C.cyan],
            trace, row - 16, x + w - 18 - trace, 32);
        if (index + 1 < pressures.length) cv.line(x + 18, y + 79 + (index + 1) * step, x + w - 18,
            y + 79 + (index + 1) * step, 1, t.panelEdge);
    });
}
function demoCorrection(vm, cylinder) {
    const { min, max } = vm.model.readings['timingCorrection' + cylinder];
    return Number.isFinite(min) && Number.isFinite(max) ? Math.max(Math.abs(min), Math.abs(max)) : null;
}
function combustionPanel(cv, t, vm, x, y, w, h) {
    panel(cv, t, x, y, w, h, 'COMBUSTION');
    const left = x + 18, end = x + w - 18, gap = 14, cell = (end - left - gap) / 2;
    const top = y + 82, bottom = y + h - 70, step = (bottom - top) / cylinderRows.length;
    const misfires = cell * 0.57, correction = cell - 12;
    const now = Date.now(), engine = vm.model.settings.bm3Engine;
    cylinderRows[0].forEach((_, bank) => {
        const start = left + bank * (cell + gap);
        header(cv, t, 'MISFIRES', start + misfires, top - 10, 75);
        header(cv, t, 'PEAK CORR. °', start + correction, top - 10, 99);
    });
    cylinderRows.forEach((cylinders, index) => {
        const row = top + index * step, baseline = row + (step - 6) / 2 + 10;
        cylinders.forEach((cylinder, bank) => {
            const start = left + bank * (cell + gap), id = 'misfire' + cylinder;
            const timing = vm.demo ? { peak: demoCorrection(vm, cylinder), fresh: true } :
                vm.bm3.cylinderTiming(cylinder, engine, now);
            cv.roundRect(start, row, cell, step - 6, 5, t.panelTop);
            text(cv, 'C' + cylinder, start + 12, baseline, 46, 23, t.text, { font: 'bold' });
            reading(cv, t, vm, id, start + misfires, baseline, 90, right,
                numeric(vm, id) > 0 ? C.amber : C.blue);
            text(cv, fmt(timing.peak, 1), start + correction, baseline, 75, 28,
                timing.fresh && timing.peak !== null ? C.blue : t.dim, right);
        });
    });
    cv.line(left, bottom + 3, end, bottom + 3, 1, t.panelEdge);
    text(cv, 'KNOCK FLAGS', (left + end) / 2, bottom + 23, end - left, 15, t.dim,
        { align: 'center', font: 'bold' });
    knockIds.forEach((id, bank) => {
        const cx = left + (cell + gap) * bank + cell / 2;
        text(cv, 'DME ' + (2 - bank), cx - 10, bottom + 52, 65, 15, t.dim, { align: 'right' });
        reading(cv, t, vm, id, cx + 15, bottom + 54, 42, centered, numeric(vm, id) > 0 ? C.amber : C.blue);
    });
}

function draw(cv, t, vm) {
    const pad = 16, gap = 12, y = vm.contentTop, h = vm.contentBottom - y;
    const room = cv.w - pad * 2 - gap * 2, left = Math.round(room * 0.30), middle = Math.round(room * 0.37);
    temperaturePanel(cv, t, vm, pad, y, left, h);
    pressurePanel(cv, t, vm, pad + left + gap, y, middle, h);
    combustionPanel(cv, t, vm, pad + left + middle + 2 * gap, y, room - left - middle, h);
}
module.exports = { draw, ids };

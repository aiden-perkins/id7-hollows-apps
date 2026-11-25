'use strict';
const { withAlpha } = require('./kit/canvas');
const { text, get, calibrated, numeric, fmt, ink } = require('./instruments');

const temperatures = [
    ['Outside air', ['outsideStatus']], ['Oil', ['oil']], ['Coolant', ['coolant']],
    ['Transmission', ['transmission2']], ['Rear differential', ['rearDifferential']],
    ['Charge air', ['preThrottleAir', 'chargeAirBank2']], ['IAT', ['iatBank1', 'iatBank2']],
];
const pressures = [
    ['HPFP', ['statusFuelHighActual', 'fuelHighTarget']],
    ['Boost', ['statusBoostActual', 'statusBoostTarget'], 1], ['Oil', ['oilPressure'], 1],
];
// Viewed from above, with the front of the engine at the top.
const cylinderRows = [[5, 1], [6, 2], [7, 3], [8, 4]];
const misfireIds = [].concat(...cylinderRows).map((cylinder) => 'misfire' + cylinder);
const knockIds = ['knockDme2', 'knockDme1'];
const ids = temperatures.concat(pressures).reduce((all, [, series]) => all.concat(series), misfireIds.concat(knockIds));
const number = { font: 'num' };
const right = { align: 'right', font: 'num' }, centered = { align: 'center', font: 'num' };

function reading(cv, t, vm, id, x, y, width, options, accent, places = 0, size = 28) {
    const state = get(vm, id);
    const lastValid = vm.model.readings[id].lastValid;
    let value = state.state === 'live' || state.retained ? state.value : lastValid && lastValid.value;
    if (!calibrated(vm.model.definitions[id])) value = null;
    text(cv, fmt(value, places), x, y, width, size, Number.isFinite(value) ? ink(t, state, accent) : t.dim, options);
}
function panel(cv, t, x, y, w, h, title) {
    cv.roundRect(x, y, w, h, 8, t.panelBottom);
    text(cv, title, x + 18, y + 33, w - 36, 19, t.text, { font: 'bold' });
    cv.line(x + 18, y + 47, x + w - 18, y + 47, 1, t.panelEdge);
}
function header(cv, t, label, x, y, width, color = t.dim) {
    text(cv, label, x, y, width, 15, color, { align: 'right', font: 'bold' });
}
function trendPanel(cv, t, vm, x, y, w, h, title, rows, [firstLabel, secondLabel], colors) {
    panel(cv, t, x, y, w, h, title);
    const left = x + 18, end = x + w - 18;
    const top = 54, bottom = 12, gap = 6;
    const step = (h - top - bottom + gap) / rows.length, plotHeight = step - gap;
    const readoutX = left + 12, valueWidth = 70, labelSize = 18;
    const readoutHeight = Math.min(46, plotHeight - 6), readoutBg = withAlpha(t.panelBottom, 0.75);
    header(cv, t, firstLabel, end - 144, y + 33, 64, colors[0]);
    header(cv, t, secondLabel, end - 72, y + 33, 64, colors[1]);
    header(cv, t, vm.model.settings.trendSeconds + ' s', end, y + 33, 64);
    rows.forEach(([label, series, places], index) => {
        const plotY = y + top + index * step, mid = plotY + plotHeight / 2;
        sparkline(cv, t, vm, series, colors, left, plotY, end - left, plotHeight);
        const labelWidth = Math.min(cv.textWidth(label, labelSize), valueWidth * 2);
        const readoutWidth = Math.max(labelWidth, series.length * valueWidth - 4);
        cv.roundRect(readoutX - 6, mid - readoutHeight / 2, readoutWidth + 12, readoutHeight, 5, readoutBg);
        text(cv, label, readoutX, mid - 4, readoutWidth, labelSize, t.text);
        series.forEach((id, i) => {
            reading(cv, t, vm, id, readoutX + i * valueWidth, mid + 20, valueWidth - 4, number, colors[i], places, 24);
        });
    });
}
function sparkline(cv, t, vm, ids, colors, x, y, w, h) {
    const now = Date.now(), windowMs = vm.model.settings.trendSeconds * 1000, start = now - windowMs;
    cv.roundRect(x, y, w, h, 5, t.panelTop);
    const left = x + 6, top = y + 6, width = w - 12, height = h - 12;
    cv.line(left, top + height / 2, left + width, top + height / 2, 1, t.panelEdge);
    for (let i = 1; i < 4; i++) {
        const tick = left + width * i / 4;
        cv.line(tick, top, tick, top + height, 1, t.panelEdge);
    }
    let low = Infinity, high = -Infinity;
    const lines = ids.map((id) => {
        const history = vm.model.readings[id].history;
        let first = history.length;
        while (first > 0 && history[first - 1].at >= start) first--;
        for (let i = first; i < history.length; i++) {
            const { value, at } = history[i];
            if (!Number.isFinite(value) || at > now) continue;
            low = Math.min(low, value); high = Math.max(high, value);
        }
        return { history, first, staleMs: vm.model.definitions[id].staleMs };
    });
    if (!Number.isFinite(low)) return;
    const span = Math.max(high - low, 1), base = (high + low - span) / 2;
    lines.forEach(({ history, first, staleMs }, series) => {
        const primary = lines.length > 1 && series === 0;
        let prior = null;
        for (let i = first; i < history.length; i++) {
            const point = history[i];
            if (!Number.isFinite(point.value) || point.at > now) { prior = null; continue; }
            const px = left + width * (point.at - start) / windowMs;
            const py = top + height * (1 - (point.value - base) / span);
            if (prior && point.at - prior.at <= staleMs) cv.line(prior.x, prior.y, px, py, primary ? 4 : 2, colors[series]);
            else cv.circle(px, py, primary ? 3 : 2, colors[series]);
            prior = { x: px, y: py, at: point.at };
        }
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
                numeric(vm, id) > 0 ? t.warn : t.accent);
            text(cv, fmt(timing.peak, 1), start + correction, baseline, 75, 28,
                timing.fresh && timing.peak !== null ? t.accent : t.dim, right);
        });
    });
    cv.line(left, bottom + 3, end, bottom + 3, 1, t.panelEdge);
    text(cv, 'KNOCK FLAGS', (left + end) / 2, bottom + 23, end - left, 15, t.dim,
        { align: 'center', font: 'bold' });
    knockIds.forEach((id, bank) => {
        const cx = left + (cell + gap) * bank + cell / 2;
        text(cv, 'DME ' + (2 - bank), cx - 10, bottom + 52, 65, 15, t.dim, { align: 'right' });
        reading(cv, t, vm, id, cx + 15, bottom + 54, 42, centered, numeric(vm, id) > 0 ? t.warn : t.accent);
    });
}

function draw(cv, t, vm) {
    const pad = 16, gap = 12, y = vm.contentTop, h = vm.contentBottom - y;
    const room = cv.w - pad * 2 - gap * 2, left = Math.round(room * 0.30), middle = Math.round(room * 0.37);
    trendPanel(cv, t, vm, pad, y, left, h, 'TEMPERATURES · °F', temperatures, ['BANK 1', 'BANK 2'], [t.accent, t.accent2]);
    trendPanel(cv, t, vm, pad + left + gap, y, middle, h, 'PRESSURES · PSI', pressures, ['ACTUAL', 'TARGET'], [t.accent, t.target]);
    combustionPanel(cv, t, vm, pad + left + middle + 2 * gap, y, room - left - middle, h);
}
module.exports = { draw, ids };

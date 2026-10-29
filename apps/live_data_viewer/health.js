'use strict';
const I = require('./instruments');
const { C, text, get, numeric, fmt, ink, plot } = I;

const oilSeries = [{ id: 'oilPressure', label: 'Actual', color: C.amber }];
const highSeries = [
    { id: 'fuelHighActual', label: 'Actual', color: C.cyan },
    { id: 'fuelHighTarget', label: 'Target', color: C.purple },
];
const lowSeries = [
    { id: 'fuelLowActual', label: 'Actual', color: C.cyan },
    { id: 'fuelLowTarget', label: 'Target', color: C.purple },
];
const rows = [
    { prefix: 'timingCorrection', label: 'TIMING |CORR|', detail: 'Max absolute / deg', color: C.blue, magnitude: true, places: 1 },
    { prefix: 'knock', label: 'KNOCK MAX', detail: 'Quantity / units unknown', color: C.purple, places: 1 },
    { prefix: 'misfire', label: 'MISFIRE MAX', detail: 'Count / period unverified', color: C.cyan, places: 0 },
];

function observation(vm, row, cylinder) {
    const id = row.prefix + cylinder, state = get(vm, id), current = numeric(vm, id);
    const reading = vm.model.readings[id];
    // Model extrema contain validated numeric samples only, and reset with the observation session.
    const min = reading.min, max = reading.max;
    let peak = Number.isFinite(max) ? max : null;
    if (row.magnitude) {
        peak = Number.isFinite(min) || Number.isFinite(max) ?
            Math.max(Number.isFinite(min) ? Math.abs(min) : 0, Number.isFinite(max) ? Math.abs(max) : 0) : null;
    }
    return { id, state, current, peak };
}

function availability(state) {
    if (state.retained) return state.state === 'live' ? 'HELD' : String(state.state).toUpperCase() + ' / HELD';
    return state.state === 'live' ? '' : String(state.state || 'unknown').toUpperCase();
}

function comparisonCell(cv, t, vm, row, item, x, y, h, scale, worst) {
    const w = 102, n = item.current, peak = item.peak;
    const c = ink(t, item.state, row.color);
    const peakColor = item.state.state === 'live' && !item.state.retained ? row.color : C.amber;
    cv.roundRect(x, y, w, h, 5, t.panelTop);
    if (peak !== null && peak > 0 && peak === worst) {
        // Bright outline means largest observed value in this row, never a fault threshold.
        cv.strokeRoundRect(x + 1, y + 1, w - 2, h - 2, 5, 1, peakColor);
        cv.circle(x + w - 10, y + 10, 2.5, peakColor);
    }
    
    text(cv, peak === null ? '--' : fmt(peak, row.places), x + 9, y + h * 0.32, w - 20, 30,
        peak === null ? t.dim : peakColor, { font: 'num' });
    text(cv, n === null ? 'NOW --' : 'NOW ' + fmt(n, row.places), x + 9, y + h * 0.56, w - 16, 16, c, { font: 'num' });
    const left = x + 9, right = x + w - 9, barY = y + h * 0.72, width = right - left;
    cv.line(left, barY, right, barY, 5, t.track);
    if (scale !== null && scale > 0) {
        const magnitude = row.magnitude && n !== null ? Math.abs(n) : n;
        if (magnitude !== null) {
            const fill = Math.max(0, Math.min(1, magnitude / scale));
            if (fill > 0) cv.line(left, barY, left + width * fill, barY, 5, c);
        }
        if (peak !== null) {
            const marker = left + width * Math.max(0, Math.min(1, peak / scale));
            cv.line(marker, barY - 5, marker, barY + 5, 2, peakColor);
        }
    } else if (peak === 0) {
        cv.line(left, barY - 5, left, barY + 5, 2, peakColor);
    }
    if (peak === null && n === null) {
        cv.line(x + w / 2 - 3, barY - 3, x + w / 2 + 3, barY + 3, 1, t.dim);
        cv.line(x + w / 2 - 3, barY + 3, x + w / 2 + 3, barY - 3, 1, t.dim);
    }
    text(cv, availability(item.state), x + w / 2, y + h - 8, w - 8, 12, c, { align: 'center' });
}

function cylinderRow(cv, t, vm, row, y, height) {
    const items = [];
    let worst = null;
    for (let cylinder = 1; cylinder <= 8; cylinder++) {
        const item = observation(vm, row, cylinder);
        items.push(item);
        if (item.peak !== null) worst = worst === null ? item.peak : Math.max(worst, item.peak);
    }
    // Auto-range is a comparison reference: 15% headroom, with no acceptable/unsafe band.
    const scale = worst !== null ? worst > 0 ? worst * 1.15 : 0 : null;
    text(cv, row.label, 528, y + height * 0.29, 166, 17, row.color, { font: 'bold' });
    text(cv, row.detail, 528, y + height * 0.53, 166, 13, t.dim);
    text(cv, scale === null ? 'Scale: no samples' : scale === 0 ? 'Observed zero / no range' :
        '0-' + fmt(scale, row.places === 0 ? 1 : row.places) + ' / +15%', 528, y + height * 0.79, 166, 13, t.dim, { font: 'num' });
    items.forEach((item, i) => comparisonCell(cv, t, vm, row, item, 708 + i * 106, y, height, scale, worst));
}

module.exports = function(cv, t, vm) {
    const bottom = Number.isFinite(vm.contentBottom) ? vm.contentBottom : 452;
    const height = bottom - 44, plotHeight = (height - 20) / 3;
    plot(cv, t, vm, { x: 24, y: 44, w: 476, h: plotHeight }, oilSeries,
        { title: 'OIL PRESSURE', unit: '' });
    plot(cv, t, vm, { x: 24, y: 44 + plotHeight + 10, w: 476, h: plotHeight }, highSeries,
        { title: 'HIGH-PRESSURE FUEL', unit: '' });
    plot(cv, t, vm, { x: 24, y: 44 + 2 * (plotHeight + 10), w: 476, h: plotHeight }, lowSeries,
        { title: 'LOW-PRESSURE FUEL', unit: '' });

    cv.roundRect(512, 44, 1064, height, 8, t.panelBottom);
    text(cv, 'CYLINDER COMPARISON / OBSERVATION PEAKS', 528, 72, 1028, 22, t.text, { font: 'bold' });
    text(cv, 'Bar = current magnitude   | = session peak   Outline = row maximum', 528, 96, 1028, 15, t.dim);
    for (let cylinder = 1; cylinder <= 8; cylinder++) {
        text(cv, 'C' + cylinder, 759 + (cylinder - 1) * 106, 126, 96, 20, t.text, { align: 'center', font: 'bold' });
    }
    const rowHeight = (bottom - 140 - 52 - 16) / 3;
    rows.forEach((row, index) => cylinderRow(cv, t, vm, row, 140 + index * (rowHeight + 8), rowHeight));
    text(cv, 'No validated C1-C8 sources: correction calibration, both-DME coverage and physical mapping unconfirmed.',
        528, bottom - 30, 1028, 14, t.dim);
    text(cv, 'Peaks since app start / not ECU trip totals. Count periods unverified. Auto-scales are display references, not tuner limits.',
        528, bottom - 10, 1028, 13, t.dim);
};

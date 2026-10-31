'use strict';
const I = require('./instruments');
const { C, text, get, numeric, fmt, ink, plot } = I;

const oilSeries = [{ id: 'oilPressure', label: 'Actual', color: C.blue }];
const highSeries = [
    { id: 'fuelHighActual', label: 'Actual', color: C.blue },
    { id: 'fuelHighTarget', label: 'Target', color: C.cyan },
];
const lowSeries = [
    { id: 'fuelLowActual', label: 'Actual', color: C.blue },
    { id: 'fuelLowTarget', label: 'Target', color: C.cyan },
];
const metrics = [
    { prefix: 'timingCorrection', label: 'TIM deg', magnitude: true, places: 1, color: C.blue },
    { prefix: 'misfire', label: 'MISS', places: 0, color: C.cyan },
    { prefix: 'knock', label: 'KNOCK V*ms', places: 3, color: C.series[2] },
];
// Requested display numbering only; these positions do not establish physical/DME mapping.
const cylinders = [[5, 1], [6, 2], [7, 3], [8, 4]];

function observation(vm, metric, cylinder) {
    const id = metric.prefix + cylinder, state = get(vm, id), definition = vm.model.definitions[id];
    const reading = vm.model.readings[id];
    const calibrated = definition.numeric && definition.decoder !== 'unscaled' && !!definition.unit &&
        !/^raw\b/i.test(definition.unit);
    const current = calibrated ? numeric(vm, id) : null;
    // Extrema contain validated numeric samples only and reset with the observation session.
    const min = calibrated ? reading.min : null, max = calibrated ? reading.max : null;
    let peak = Number.isFinite(max) ? max : null;
    if (metric.magnitude) {
        peak = Number.isFinite(min) || Number.isFinite(max) ?
            Math.max(Number.isFinite(min) ? Math.abs(min) : 0, Number.isFinite(max) ? Math.abs(max) : 0) : null;
    }
    return { state, current, peak };
}

function availability(state) {
    if (state.retained) return state.state === 'live' ? 'HELD' : String(state.state).toUpperCase() + ' / HELD';
    return state.state === 'live' ? '' : String(state.state || 'unknown').toUpperCase();
}

function counterTotal(vm, metric) {
    let total = 0, period = null, fresh = 0, held = false, stale = false;
    for (let cylinder = 1; cylinder <= 8; cylinder++) {
        const id = metric.prefix + cylinder, d = vm.model.definitions[id], state = get(vm, id);
        if (!d.source) return { value: null, status: 'UNMAPPED', detail: 'C1-C8 source required' };
        if (!d.numeric || d.decoder === 'unscaled' || d.unit !== 'count') {
            return { value: null, status: 'COUNT UNCONFIRMED', detail: 'Validated counts required' };
        }
        if (typeof d.counterPeriod !== 'string' || !d.counterPeriod.trim()) {
            return { value: null, status: 'PERIOD UNKNOWN', detail: 'Shared window required' };
        }
        if (period !== null && period !== d.counterPeriod) {
            return { value: null, status: 'PERIOD MISMATCH', detail: 'Different counter windows' };
        }
        period = d.counterPeriod;
        held = held || !!state.retained;
        stale = stale || state.state === 'stale';
        if (state.state !== 'live' || state.retained) continue;
        if (state.unit !== 'count') {
            return { value: null, status: 'UNITS UNCONFIRMED', detail: 'Count readings required' };
        }
        if (!Number.isSafeInteger(state.value) || state.value < 0) {
            return { value: null, status: 'INVALID COUNT', detail: 'Nonnegative integer only' };
        }
        fresh++;
        total += state.value;
    }
    if (fresh !== 8) {
        return { value: null, status: 'INCOMPLETE',
            detail: held ? (stale ? 'STALE / HELD' : 'HELD READINGS') : stale ? 'STALE COVERAGE' : 'WAITING / UNKNOWN',
            held: held || stale };
    }
    if (!Number.isSafeInteger(total)) return { value: null, status: 'COUNT RANGE', detail: 'Exact total unavailable' };
    return { value: total, status: 'LIVE', detail: 'Validated cylinder counts' };
}

function timingMaximum(vm) {
    let maximum = null, covered = 0, fresh = 0, held = false, stale = false;
    for (let cylinder = 1; cylinder <= 8; cylinder++) {
        const id = 'timingCorrection' + cylinder, d = vm.model.definitions[id], item = observation(vm, metrics[0], cylinder);
        held = held || !!item.state.retained;
        stale = stale || item.state.state === 'stale';
        if (!d.source || !d.numeric || d.decoder === 'unscaled' || d.unit !== 'deg' || item.peak === null) continue;
        covered++;
        maximum = maximum === null ? item.peak : Math.max(maximum, item.peak);
        if (item.state.state === 'live' && !item.state.retained && item.state.unit === 'deg') fresh++;
    }
    if (!covered) return { value: null, status: 'UNKNOWN', detail: 'No eligible session data' };
    return { value: maximum,
        status: covered < 8 ? 'PARTIAL SESSION' : 'SESSION PEAK',
        detail: stale ? 'STALE READINGS' : held || fresh < covered ? 'HELD READINGS' : 'LIVE READINGS',
        held: held || stale || covered < 8 || fresh < 8 };
}

function aggregateCard(cv, t, x, y, w, h, label, metric, result, detail) {
    cv.roundRect(x, y, w, h, 8, t.panelBottom);
    cv.line(x + 12, y + 11, x + 34, y + 11, 3, metric.color);
    text(cv, label, x + 12, y + 31, w - 24, 12, metric.color, { font: 'bold' });
    const color = result.held ? C.amber : result.value === null ? t.dim : metric.color;
    text(cv, result.value === null ? '--' : fmt(result.value, metric.magnitude ? metric.places : 0),
        x + 12, y + h * 0.57, w - 24, 29, color, { font: 'num' });
    text(cv, result.status, x + 12, y + h - 34, w - 24, 10, color, { font: 'bold' });
    text(cv, result.detail, x + 12, y + h - 20, w - 24, 10, t.dim);
    if (detail) text(cv, detail, x + 12, y + h - 7, w - 24, 9, t.dim);
}

function knockExplanation(cv, t, x, y, w, h) {
    cv.roundRect(x, y, w, h, 8, t.panelBottom);
    cv.line(x + 12, y + 11, x + 34, y + 11, 3, metrics[2].color);
    text(cv, 'KNOCK SIGNAL', x + 12, y + 31, w - 24, 12, metrics[2].color, { font: 'bold' });
    text(cv, 'V*ms', x + 12, y + h * 0.57, w - 24, 29, metrics[2].color, { font: 'num' });
    text(cv, 'Decimal signal, not a count', x + 12, y + h - 34, w - 24, 10, t.dim);
    text(cv, 'Cylinder mapping unknown', x + 12, y + h - 20, w - 24, 10, t.dim);
}

function aggregateColumn(cv, t, vm, x, y, w, h) {
    const gap = 8, cardHeight = (h - 2 * gap) / 3;
    aggregateCard(cv, t, x, y, w, cardHeight, 'TOTAL MISFIRES', metrics[1], counterTotal(vm, metrics[1]));
    knockExplanation(cv, t, x, y + cardHeight + gap, w, cardHeight);
    aggregateCard(cv, t, x, y + 2 * (cardHeight + gap), w, cardHeight,
        'MAX TIMING CORR.', metrics[0], timingMaximum(vm), 'Session maximum |deg|');
}

function metricCenter(x, w, index) {
    return x + 44 + (w - 50) * (index + 0.5) / metrics.length;
}

function cylinderCell(cv, t, vm, cylinder, x, y, w, h) {
    cv.roundRect(x, y, w, h, 6, t.panelTop);
    text(cv, 'C' + cylinder, x + 23, y + h / 2 + 10, 40, 27, t.text,
        { align: 'center', font: 'bold' });
    const columnWidth = (w - 50) / metrics.length;
    metrics.forEach((metric, index) => {
        const item = observation(vm, metric, cylinder), cx = metricCenter(x, w, index);
        const color = ink(t, item.state, metric.color);
        text(cv, item.current === null ? '--' : fmt(item.current, metric.places),
            cx, y + h * 0.43, columnWidth - 4, 27, color, { align: 'center', font: 'num' });
        text(cv, item.peak === null ? '--' : fmt(item.peak, metric.places),
            cx, y + h * 0.75, columnWidth - 4, 20, item.peak === null ? t.dim : color,
            { align: 'center', font: 'num' });
        text(cv, availability(item.state), cx, y + h - 5, columnWidth - 4, 8, color,
            { align: 'center' });
    });
}

function cylinderGrid(cv, t, vm, x, y, w, h) {
    cv.roundRect(x, y, w, h, 8, t.panelBottom);
    text(cv, 'CYLINDER HEALTH', x + 12, y + 22, 175, 14, t.text, { font: 'bold' });
    text(cv, 'NOW / SESSION PEAK', x + w - 12, y + 21, w - 210, 10, t.dim,
        { align: 'right' });
    const gap = 5, headerHeight = 52, footerHeight = 30, cellWidth = (w - 16 - gap) / 2;
    const cellHeight = (h - headerHeight - footerHeight - 3 * gap) / 4;
    for (let column = 0; column < 2; column++) {
        const cellX = x + 8 + column * (cellWidth + gap);
        metrics.forEach((metric, index) => text(cv, metric.label,
            metricCenter(cellX, cellWidth, index), y + 43, (cellWidth - 50) / metrics.length - 4,
            10, metric.color, { align: 'center', font: 'bold' }));
    }
    cylinders.forEach((pair, row) => {
        pair.forEach((cylinder, column) => {
            cylinderCell(cv, t, vm, cylinder,
                x + 8 + column * (cellWidth + gap), y + headerHeight + row * (cellHeight + gap),
                cellWidth, cellHeight);
        });
    });
    text(cv, 'Knock: voltage-time signal, not an event count. C1-C8 mapping unverified.',
        x + 10, y + h - 15, w - 20, 11, t.dim);
}

module.exports = function(cv, t, vm) {
    oilSeries[0].color = highSeries[0].color = lowSeries[0].color = metrics[0].color = C.blue;
    highSeries[1].color = lowSeries[1].color = metrics[1].color = C.cyan;
    metrics[2].color = C.series[2];
    const top = Number.isFinite(vm.contentTop) ? vm.contentTop : 44;
    const bottom = Number.isFinite(vm.contentBottom) ? vm.contentBottom : 452;
    const height = bottom - top, plotTop = top + 26, plotHeight = (height - 46) / 3;
    cv.line(40, top + 11, 59, top + 11, 3, C.blue);
    text(cv, 'Actual', 67, top + 16, 78, 13, t.text);
    cv.line(154, top + 11, 173, top + 11, 3, C.cyan);
    text(cv, 'Target', 181, top + 16, 78, 13, t.text);
    plot(cv, t, vm, { x: 24, y: plotTop, w: 688, h: plotHeight }, oilSeries,
        { title: 'OIL PRESSURE', unit: '', compactLegend: true, sessionExtrema: false });
    plot(cv, t, vm, { x: 24, y: plotTop + plotHeight + 10, w: 688, h: plotHeight }, highSeries,
        { title: 'HIGH-PRESSURE FUEL', unit: '', compactLegend: true, sessionExtrema: false });
    plot(cv, t, vm, { x: 24, y: plotTop + 2 * (plotHeight + 10), w: 688, h: plotHeight }, lowSeries,
        { title: 'LOW-PRESSURE FUEL', unit: '', compactLegend: true, sessionExtrema: false });
    cylinderGrid(cv, t, vm, 724, top, 660, height);
    aggregateColumn(cv, t, vm, 1396, top, 180, height);
};

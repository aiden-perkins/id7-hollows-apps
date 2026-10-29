'use strict';
const D = require('./definitions');
const C = { blue: '#81c4ff', cyan: '#50dfd4', green: '#74df9b', amber: '#ffbd69', red: '#ff565c', purple: '#b6a1ff' };
const defs = {};
D.definitions.forEach((d) => { defs[d.id] = d; });
function text(cv, str, x, y, width, size, color, options) {
    let s = String(str == null ? '' : str);
    const opts = options || {};
    if (cv.textWidth(s, size, opts) > width) {
        while (s && cv.textWidth(s + '...', size, opts) > width) s = s.slice(0, -1);
        s += '...';
    }
    cv.text(s, x, y, size, color, opts);
}
function get(vm, id) { return vm.model.state(defs[id]); }
function calibrated(d) { return d.numeric && d.decoder !== 'unscaled' && !/^raw\b/i.test(d.unit || ''); }
function numeric(vm, id) {
    const s = get(vm, id);
    return calibrated(defs[id]) && (s.state === 'live' || s.retained) && Number.isFinite(s.value) ? s.value : null;
}
function fmt(n, places) { return Number.isFinite(n) ? n.toFixed(places === undefined ? 1 : places) : '--'; }
function ink(t, s, normal) {
    return s.retained || ['stale', 'error', 'invalid'].includes(s.state) ? C.amber : s.state === 'live' ? normal || C.blue : t.dim;
}
function thermalColor(id, n, unit, normal) {
    if (!Number.isFinite(n) || !/^(°?F|°?C|deg F|deg C)$/.test(unit || '')) return normal;
    const c = /F/.test(unit) ? (n - 32) * 5 / 9 : n;
    const thresholds = { oil: [70, 120, 130], coolant: [60, 105, 112], transmission1: [50, 110, 120],
        transmission2: [50, 110, 120], converter: [50, 110, 120], iat: [-100, 50, 65], chargeAir: [-100, 50, 65] };
    const r = thresholds[id];
    return r ? c >= r[2] ? C.red : c >= r[1] ? C.amber : c < r[0] ? C.blue : normal : normal;
}
// OBS rulers are session-wide; hollow trace markers identify actual rolling-window extrema.
function plot(cv, t, vm, box, series, options) {
    const o = options || {}, x = box.x, y = box.y, w = box.w, h = box.h;
    const compact = h < 130;
    cv.roundRect(x, y, w, h, 8, t.panelBottom);
    cv.line(x + 14, y + 1, x + w - 14, y + 1, 1, t.panelEdge);
    text(cv, o.title || '', x + 16, y + 22, w - 142, 18, t.text, { font: 'bold' });
    const seconds = vm.model.settings.trendSeconds, now = Date.now(), start = now - seconds * 1000;
    text(cv, seconds + 's WIN', x + w - 16, y + 22, 94, 13, t.dim, { align: 'right' });
    const legend = Math.min(344, w * 0.48);
    const left = x + legend + 48, top = y + 44, width = w - legend - 64, height = h - 72;
    const traceWidth = Math.max(16, width - Math.max(40, 18 + series.length * 9));
    let low = Infinity, high = -Infinity, hasPoints = false, hasSession = false;
    const requestedUnit = o.unit || series.map((s) => calibrated(defs[s.id]) && defs[s.id].unit).find(Boolean) || '';
    const unit = /^raw\b/i.test(requestedUnit) ? '' : requestedUnit;
    const observations = series.map((s) => {
        const d = defs[s.id], r = vm.model.readings[s.id];
        const observation = { minimum: null, maximum: null };
        if (!calibrated(d) || unit && d.unit !== unit) return observation;
        [r.min, r.max].forEach((n) => {
            if (!Number.isFinite(n)) return;
            low = Math.min(low, n); high = Math.max(high, n); hasSession = true;
        });
        r.history.forEach((p) => {
            if (p.at < start || p.at > now || !Number.isFinite(p.value)) return;
            low = Math.min(low, p.value); high = Math.max(high, p.value); hasPoints = true;
            if (!observation.minimum || p.value < observation.minimum.value) observation.minimum = p;
            if (!observation.maximum || p.value > observation.maximum.value) observation.maximum = p;
        });
        return observation;
    });
    const hasDomain = hasPoints || hasSession;
    if (hasDomain && o.range) { low = Math.min(low, o.range[0]); high = Math.max(high, o.range[1]); }
    if (!hasDomain) { low = 0; high = 1; }
    else {
        // Keep the largest concentric marker inside even a 32px-high compact trace.
        const margin = Math.min(7, height / 4);
        const pad = Math.max((high - low) * Math.max(0.12, margin / (height - margin * 2)), 0.5);
        low -= pad; high += pad;
    }
    const pointY = (n) => top + height * (high - n) / (high - low);
    for (let i = 0; i <= 2; i++) {
        const gy = top + height * i / 2;
        cv.line(left, gy, left + traceWidth, gy, 1, t.track);
        if (hasDomain) text(cv, fmt(high - (high - low) * i / 2, 0), left - 6, gy + 4, 40, 13, t.dim, { align: 'right', font: 'num' });
    }
    for (let i = 1; i <= 3; i++) cv.line(left + traceWidth * i / 4, top, left + traceWidth * i / 4, top + height, 1, t.panelEdge);
    text(cv, 'OBS', left + traceWidth + 12, top - 7, width - traceWidth - 10, 12, t.dim);
    const rowHeight = (h - 42) / series.length;
    series.forEach((s, i) => {
        const d = defs[s.id], r = vm.model.readings[s.id], state = get(vm, s.id), n = numeric(vm, s.id);
        const seriesColor = s.color || C.blue;
        const c = ink(t, state, thermalColor(s.id, n, d.unit, seriesColor));
        const row = y + 38 + i * rowHeight;
        const status = state.retained ? state.state === 'live' ? 'HELD' : 'HELD / ' + state.state.toUpperCase() :
            state.state !== 'live' ? state.state.toUpperCase() : '';
        cv.circle(x + 19, row + 8, 3, seriesColor);
        text(cv, s.label || d.name, x + 29, row + 13, legend - 140, 16, t.text);
        text(cv, fmt(n, 0) + (n !== null && d.unit ? ' ' + d.unit : ''), x + legend - 5, row + 13, 98, 24, c, { align: 'right', font: 'num' });
        const physical = calibrated(d);
        const extrema = physical ? 'OBS ' + fmt(r.min, 0) + ' .. ' + fmt(r.max, 0) :
            d.decoder === 'unscaled' || /^raw\b/i.test(d.unit || '') ? 'CALIBRATION REQUIRED' : '';
        text(cv, status ? status + (extrema ? ' / ' + extrema : '') : extrema,
            x + 29, row + (rowHeight < 43 ? 30 : 31), legend - 34, rowHeight < 43 ? 13 : 14, status ? C.amber : t.dim);
        if (!physical || unit && d.unit !== unit) return;
        const ruler = left + traceWidth + 12 + i * 9;
        const minimum = Number.isFinite(r.min), maximum = Number.isFinite(r.max);
        if (minimum && maximum) cv.line(ruler, pointY(r.max), ruler, pointY(r.min), 2, seriesColor);
        [r.min, r.max].forEach((n, index) => {
            if (!Number.isFinite(n) || index && n === r.min) return;
            const py = pointY(n);
            cv.line(ruler - 3, py, ruler + 3, py, 2, seriesColor);
        });
        let previous = null;
        r.history.forEach((p) => {
            if (p.at < start || p.at > now || !Number.isFinite(p.value)) { previous = null; return; }
            const px = left + traceWidth * (p.at - start) / (seconds * 1000), py = pointY(p.value);
            if (previous && p.at > previous.at && p.at - previous.at <= d.staleMs) {
                cv.line(previous.x, previous.y, px, py, 2, thermalColor(s.id, p.value, d.unit, seriesColor));
            } else cv.circle(px, py, 2, seriesColor);
            previous = { x: px, y: py, at: p.at };
        });
    });
    // Draw larger rings first so coincident series retain separate, color-keyed rings.
    for (let i = series.length - 1; i >= 0; i--) {
        const observation = observations[i], s = series[i], radius = 3 + i;
        [observation.minimum, observation.maximum].forEach((p, index) => {
            if (!p || index && p === observation.minimum) return;
            const px = left + traceWidth * (p.at - start) / (seconds * 1000), py = pointY(p.value);
            cv.circle(px, py, radius, s.color || C.blue);
            cv.circle(px, py, radius - 1, t.panelBottom);
        });
    }
    if (!hasPoints) {
        const unconfirmed = series.some((s) => defs[s.id].source && !calibrated(defs[s.id]));
        const message = hasSession ? 'NO SAMPLES IN WINDOW' : 'NO VALIDATED SAMPLES';
        if (compact) {
            text(cv, hasSession ? 'NO WINDOW DATA' : 'NO VALID DATA', left + traceWidth / 2, top + height / 2 + (unconfirmed ? -3 : 4),
                traceWidth - 8, 13, t.dim, { align: 'center' });
            if (unconfirmed) text(cv, 'SCALE UNCONFIRMED', left + traceWidth / 2, top + height / 2 + 13,
                traceWidth - 8, 12, t.dim, { align: 'center' });
        } else {
            text(cv, message, left + traceWidth / 2, top + height / 2, traceWidth - 16, 14, t.dim, { align: 'center' });
            text(cv, hasSession ? 'OBS limits span the observation session' : unconfirmed ? 'Physical scale unconfirmed' : 'Waiting for a validated source',
                left + traceWidth / 2, top + height / 2 + 20, traceWidth - 16, 13, t.dim, { align: 'center' });
        }
    }
    text(cv, '-' + seconds + 's', left, y + h - 9, traceWidth / 2, 13, t.dim);
    text(cv, 'NOW' + (unit ? ' / ' + unit : ''), left + traceWidth, y + h - 9, traceWidth / 2 - 4, 13, t.dim, { align: 'right' });
}
module.exports = { C, text, get, numeric, fmt, ink, plot, thermalColor };

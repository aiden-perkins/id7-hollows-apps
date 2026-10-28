'use strict';
const { Canvas } = require('./kit/canvas');

function value(v, unit) {
    if (v === null || v === undefined) return '--';
    return (typeof v === 'number' ? v.toFixed(3) : String(v)) + (unit ? ' ' + unit : '');
}
function date(at) {
    if (!at) return 'Never';
    const d = new Date(at), h = d.getHours(), pad = (v) => String(v).padStart(2, '0');
    return (h % 12 || 12) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
        (h >= 12 ? ' PM ' : ' AM ') + (d.getMonth() + 1) + '-' + d.getDate() + '-' + d.getFullYear();
}
function summary(model, d) {
    const r = model.readings[d.id], s = model.state(d);
    let label = s.state.toUpperCase() + ' | ' + (s.value !== undefined && s.value !== null ? value(s.value, d.unit) + (s.retained ? ' (last valid)' : '') : '--');
    if (d.numeric && r.min !== null) label += ' | Min ' + value(r.min, d.unit) + ' / Max ' + value(r.max, d.unit);
    if (!s.value && s.value !== 0 && s.note) label += ' | ' + s.note;
    return label;
}
function graph(model, d) {
    const cv = new Canvas(900, 260).clear('#10151d');
    const now = Date.now(), seconds = model.settings.trendSeconds, start = now - seconds * 1000;
    const r = model.readings[d.id], points = r.history.filter((p) => p.at >= start);
    const nums = points.filter((p) => Number.isFinite(p.value));
    cv.text(d.name + ' | recent ' + seconds + ' s', 18, 15, 20, '#edf3fa');
    if (!d.numeric || !nums.length) {
        cv.text(d.numeric ? 'No valid numeric samples yet' : 'Graph unavailable: no validated numeric conversion', 18, 100, 19, '#a9b5c7');
        return cv;
    }
    let low = Math.min.apply(null, nums.map((p) => p.value)), high = Math.max.apply(null, nums.map((p) => p.value));
    if (low === high) { low -= 0.5; high += 0.5; }
    cv.line(95, 55, 95, 215, 1, '#657287'); cv.line(95, 215, 875, 215, 1, '#657287');
    cv.text(high.toFixed(3), 5, 50, 15, '#a9b5c7'); cv.text(low.toFixed(3), 5, 195, 15, '#a9b5c7');
    cv.text('-' + seconds + ' s', 95, 230, 15, '#a9b5c7'); cv.text('Now', 825, 230, 15, '#a9b5c7');
    const xy = (p) => [95 + 780 * (p.at - start) / (seconds * 1000), 215 - 160 * (p.value - low) / (high - low)];
    let previous = null;
    points.forEach((p) => {
        if (p.value === null) { previous = null; return; }
        const pos = xy(p);
        if (previous && p.at - previous.at <= d.staleMs) {
            const last = xy(previous); cv.line(last[0], last[1], pos[0], pos[1], 2, '#57c7ff');
        } else cv.line(pos[0] - 1, pos[1], pos[0] + 1, pos[1], 2, '#57c7ff');
        previous = p;
    });
    return cv;
}
module.exports = { value, date, summary, graph };

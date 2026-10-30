'use strict';
const I = require('./instruments');
const { C, text, get, numeric, fmt, ink } = I;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function bounds(vm, id, base, step) {
    const defs = vm.model.definitions;
    const r = vm.model.readings[id], n = numeric(vm, id);
    let lo = base[0], hi = base[1];
    if (defs[id].numeric && defs[id].decoder !== 'unscaled' && !/^raw\b/i.test(defs[id].unit || '')) [n, r.min, r.max].forEach((v) => {
        if (!Number.isFinite(v)) return;
        if (v < lo) lo = Math.floor((v - step * 0.1) / step) * step;
        if (v > hi) hi = Math.ceil((v + step * 0.1) / step) * step;
    });
    return [lo, hi];
}
function point(cx, cy, radius, angle) {
    const a = angle * Math.PI / 180;
    return [cx + Math.sin(a) * radius, cy - Math.cos(a) * radius];
}
function diamond(cv, x, y, size, color) {
    cv.quad([[x, y - size], [x + size, y], [x, y + size], [x - size, y]], color);
}
function status(vm, id) {
    const defs = vm.model.definitions;
    const s = get(vm, id);
    if (s.retained) return s.state === 'live' ? 'HELD' : 'HELD / ' + s.state.toUpperCase();
    if (s.state !== 'live') return s.state.toUpperCase();
    return defs[id].decoder === 'unscaled' || /^raw\b/i.test(defs[id].unit || '') ? 'CALIBRATION REQUIRED' : '';
}
function rangeRail(cv, t, vm, id, x, y, w, range, color) {
    const r = vm.model.readings[id], d = vm.model.definitions[id], s = get(vm, id), n = numeric(vm, id);
    const px = (v) => x + w * clamp((v - range[0]) / (range[1] - range[0]), 0, 1);
    cv.roundRect(x, y - 2, w, 4, 2, t.track);
    if (!d.numeric || d.decoder === 'unscaled' || /^raw\b/i.test(d.unit || '')) return;
    if (Number.isFinite(r.min) && Number.isFinite(r.max)) {
        cv.line(px(r.min), y, px(r.max), y, 4, color + '60');
        cv.circle(px(r.min), y, 3, color);
        diamond(cv, px(r.max), y, 4, color);
    }
    if (n !== null) {
        const p = px(n), c = ink(t, s, color);
        cv.line(p, y - 7, p, y + 7, 2, c);
        cv.circle(p, y, 2, t.text);
    }
}
const references = {
    boost: { psi: [0, 40, 10], bar: [0, 3, 1], kPa: [0, 300, 100] },
    horsepower: { hp: [0, 1000, 200], kW: [0, 750, 150], PS: [0, 1000, 200] },
    torque: { 'lb-ft': [0, 1000, 200], Nm: [0, 1400, 250], 'N m': [0, 1400, 250] },
};
const defaults = { boost: 'psi', horsepower: 'hp', torque: 'lb-ft' };
function dial(cv, t, vm, id, title, x, color) {
    const d = vm.model.definitions[id], unit = d.unit || defaults[id], spec = references[id][unit];
    const supported = !!d.unit && !!spec && d.numeric && d.decoder !== 'unscaled' && !/^raw\b/i.test(d.unit);
    const nonnegative = id === 'horsepower' || id === 'torque';
    // Clamp presentation only: decoding, samples, and session extrema stay untouched.
    const displayed = (v) => Number.isFinite(v) ? nonnegative ? Math.max(0, v) : v : null;
    const n = displayed(supported ? numeric(vm, id) : null), s = get(vm, id), r = vm.model.readings[id];
    const ref = spec || references[id][defaults[id]];
    const range = supported && !nonnegative ? bounds(vm, id, ref.slice(0, 2), ref[2]) : ref;
    const top = vm.contentTop, bottom = vm.contentBottom, cx = x + 142, cy = top + (bottom - top - 40) / 2;
    const angle = (v) => -130 + 260 * clamp((v - range[0]) / (range[1] - range[0]), 0, 1);
    text(cv, title, cx, top + 27, 250, 28, t.text, { align: 'center', font: 'bold' });
    cv.arc(cx, cy, 118, 130, -130, 130, t.track);
    cv.arc(cx, cy, 108, 113, -130, 130, t.track);
    for (let i = 0; i <= 20; i++) {
        const a = -130 + 13 * i, major = i % 5 === 0;
        const p = point(cx, cy, 134, a), q = point(cx, cy, major ? 140 : 137, a);
        cv.line(p[0], p[1], q[0], q[1], major ? 2 : 1.5, t.tick);
        if (major) {
            const z = point(cx, cy, 92, a);
            text(cv, fmt(range[0] + (range[1] - range[0]) * i / 20, range[1] <= 3 ? 1 : 0), z[0], z[1] + 5, 48, 15, t.dim, { align: 'center', font: 'num' });
        }
    }
    const min = displayed(supported ? r.min : null), max = displayed(supported ? r.max : null);
    if (min !== null && max !== null) cv.arc(cx, cy, 108, 113, angle(min), Math.max(angle(min) + 0.8, angle(max)), color + '70');
    if (min !== null) { const p = point(cx, cy, 136, angle(min)); cv.circle(p[0], p[1], 4, color); }
    if (max !== null) { const p = point(cx, cy, 136, angle(max)); diamond(cv, p[0], p[1], 5, color); }
    if (n !== null) {
        const c = ink(t, s, color), a = angle(n), p = point(cx, cy, 115, a), q = point(cx, cy, 132, a);
        if (a > -130) cv.arc(cx, cy, 118, 130, -130, a, c);
        cv.line(p[0], p[1], q[0], q[1], 3, t.text);
    }
    const readout = fmt(n, id === 'boost' ? 1 : 0), readoutOptions = { align: 'center', font: 'num' };
    // Values above the graphical reference remain fully readable, not truncated.
    const readoutSize = Math.min(74, 74 * 248 / Math.max(1, cv.textWidth(readout, 74, readoutOptions)));
    cv.text(readout, cx, cy + 43, readoutSize, ink(t, s, color), readoutOptions);
    text(cv, supported ? unit : d.unit ? 'UNIT UNCONFIRMED' : defaults[id] + ' / SCALE', cx, cy + 91, 248, 22, t.dim, { align: 'center' });
    const signalStatus = status(vm, id), scaleStatus = n !== null && n > range[1] ? 'ABOVE SCALE' : '';
    text(cv, [scaleStatus, signalStatus].filter(Boolean).join(' / '), cx, cy + 136, 268, 14, ink(t, s, color), { align: 'center' });
    const extrema = 'MIN ' + fmt(min, id === 'boost' ? 1 : 0) + '   MAX ' + fmt(max, id === 'boost' ? 1 : 0);
    const extremaSize = Math.min(17, 17 * 268 / Math.max(1, cv.textWidth(extrema, 17, readoutOptions)));
    cv.text(extrema, cx, bottom - 34, extremaSize, t.dim, readoutOptions);
}
function linear(cv, t, vm, id, title, box, reference, color, places) {
    const d = vm.model.definitions[id], s = get(vm, id), x = box.x, y = box.y, w = box.w;
    const h = box.h === undefined ? 122 : box.h;
    const calibrated = d.decoder !== 'unscaled' && !/^raw\b/i.test(d.unit || '');
    const n = calibrated ? numeric(vm, id) : null;
    const range = bounds(vm, id, reference, Math.max((reference[1] - reference[0]) / 5, 1));
    text(cv, title, x, y + 18, w, 16, t.dim, { font: 'bold' });
    text(cv, fmt(n, places === undefined ? 0 : places) + (n !== null && d.unit ? ' ' + d.unit : ''), x, y + h * 0.42, w, 30, ink(t, s, color), { font: 'num' });
    rangeRail(cv, t, vm, id, x + 2, y + h * 0.62, w - 4, range, color);
    text(cv, fmt(range[0], 0), x, y + h * 0.79, w / 2, 14, t.dim);
    text(cv, fmt(range[1], 0) + (calibrated && d.unit ? ' ' + d.unit : ' / scale'), x + w, y + h * 0.79, w, 14, t.dim, { align: 'right' });
    text(cv, status(vm, id), x, y + h - 8, w, 14, ink(t, s, color));
}
module.exports = { bounds, diamond, rangeRail, dial, linear, status };

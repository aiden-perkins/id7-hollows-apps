'use strict';
const D = require('./definitions');
const I = require('./instruments');
const { C, text, get, numeric, fmt, ink } = I;
const defs = {};
D.definitions.forEach((d) => { defs[d.id] = d; });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function bounds(vm, id, base, step) {
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
    const s = get(vm, id);
    if (s.retained) return s.state === 'live' ? 'HELD' : 'HELD / ' + s.state.toUpperCase();
    if (s.state !== 'live') return s.state.toUpperCase();
    return defs[id].decoder === 'unscaled' || /^raw\b/i.test(defs[id].unit || '') ? 'CALIBRATION REQUIRED' : '';
}
function rangeRail(cv, t, vm, id, x, y, w, range, color) {
    const r = vm.model.readings[id], d = defs[id], s = get(vm, id), n = numeric(vm, id);
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
    torque: { 'lb-ft': [-200, 1000, 200], Nm: [-250, 1400, 250], 'N m': [-250, 1400, 250] },
};
const defaults = { boost: 'psi', horsepower: 'hp', torque: 'lb-ft' };
function dial(cv, t, vm, id, title, x, color) {
    const d = defs[id], unit = d.unit || defaults[id], spec = references[id][unit];
    const supported = !!d.unit && !!spec && d.numeric && d.decoder !== 'unscaled' && !/^raw\b/i.test(d.unit);
    const n = supported ? numeric(vm, id) : null, s = get(vm, id), r = vm.model.readings[id];
    const ref = spec || references[id][defaults[id]], range = supported ? bounds(vm, id, ref.slice(0, 2), ref[2]) : ref;
    const dy = (vm.contentBottom - 464 + (vm.page === 'driving' ? vm.contentTop - 44 : 0)) / 2;
    const cx = x + 136, cy = 194 + dy, angle = (v) => -130 + 260 * clamp((v - range[0]) / (range[1] - range[0]), 0, 1);
    text(cv, title, cx, 143 + dy, 184, 26, t.text, { align: 'center', font: 'bold' });
    cv.arc(cx, cy, 104, 116, -130, 130, t.track);
    cv.arc(cx, cy, 90, 95, -130, 130, t.track);
    for (let i = 0; i <= 20; i++) {
        const a = -130 + 13 * i, major = i % 5 === 0;
        const p = point(cx, cy, 120, a), q = point(cx, cy, major ? 128 : 124, a);
        cv.line(p[0], p[1], q[0], q[1], major ? 2 : 1.5, t.tick);
        if (major) {
            const z = point(cx, cy, 134, a);
            text(cv, fmt(range[0] + (range[1] - range[0]) * i / 20, range[1] <= 3 ? 1 : 0), z[0], z[1] + (i === 0 || i === 20 ? -10 : 5), 44, 16, t.dim, { align: 'center', font: 'num' });
        }
    }
    if (supported && d.numeric && d.decoder !== 'unscaled' && !/^raw\b/i.test(d.unit || '')) {
        const min = Number.isFinite(r.min) ? r.min : null, max = Number.isFinite(r.max) ? r.max : null;
        if (min !== null && max !== null) cv.arc(cx, cy, 90, 95, angle(min), Math.max(angle(min) + 0.8, angle(max)), color + '70');
        if (min !== null) { const p = point(cx, cy, 130, angle(min)); cv.circle(p[0], p[1], 4, color); }
        if (max !== null) { const p = point(cx, cy, 130, angle(max)); diamond(cv, p[0], p[1], 5, color); }
    }
    if (n !== null) {
        const c = ink(t, s, color), a = angle(n), p = point(cx, cy, 100, a), q = point(cx, cy, 118, a);
        if (angle(n) > -130) cv.arc(cx, cy, 104, 116, -130, angle(n), c);
        cv.line(p[0], p[1], q[0], q[1], 3, t.text);
    }
    text(cv, fmt(n, id === 'boost' ? 1 : 0), cx, 214 + dy, 184, 76, ink(t, s, color), { align: 'center', font: 'num' });
    text(cv, supported ? unit : d.unit ? 'UNIT UNCONFIRMED' : defaults[id] + ' / SCALE', cx, 250 + dy, 184, 21, t.dim, { align: 'center' });
    text(cv, status(vm, id), cx, 285 + dy, 184, 15, ink(t, s, color), { align: 'center' });
    text(cv, 'MIN ' + fmt(d.numeric && supported ? r.min : null, id === 'boost' ? 1 : 0) + '   MAX ' + fmt(d.numeric && supported ? r.max : null, id === 'boost' ? 1 : 0),
        cx, vm.contentBottom - 155, 268, 16, t.dim, { align: 'center' });
}
function linear(cv, t, vm, id, title, box, reference, color, places) {
    const d = defs[id], s = get(vm, id), x = box.x, y = box.y, w = box.w;
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

'use strict';
const G = require('./kit/gauges');
const { FULL } = require('./kit/display');
const { MODES, colorLabel } = require('./catalog');

function text(cv, value, x, y, width, size, color, options) {
    let label = String(value);
    const opts = options || {};
    if (cv.textWidth(label, size, opts) > width) {
        while (label && cv.textWidth(label + '...', size, opts) > width) label = label.slice(0, -1);
        label += '...';
    }
    cv.text(label, x, y, size, color, opts);
}

function draw(ctx, lighting) {
    const cv = ctx.canvas(1600, 520), t = ctx.theme(), targets = [];
    cv.clear(t.bg);
    G.frame(cv, t, ['Ambient Lighting'], 0, ctx.preview ? [{ text: 'PREVIEW', color: t.accent }] : []);
    const full = cv.chrome && cv.place && cv.place.full;
    const top = full ? (FULL.headH - cv.place.oy) / cv.place.scale + 8 : G.TOP;
    const bottom = full ? (cv.place.h - FULL.barH - cv.place.oy) / cv.place.scale - 8 : cv.h - FULL.barH - 8;
    const current = lighting.mode ? lighting.mode.label : 'Waiting for vehicle';
    const color = lighting.color === null ? 'Unknown / custom / off' : colorLabel(lighting.color);
    text(cv, current + ' / Vehicle color: ' + color, 24, top + 27, 1260, 26, t.text, { font: 'bold' });
    text(cv, lighting.enabled ? 'FOLLOWING ON' : 'FOLLOWING OFF', 1576, top + 27, 280, 20,
        lighting.enabled ? t.accent : t.dim, { align: 'right', font: 'bold' });
    const words = lighting.status().split(' '), lines = [''];
    words.forEach((word) => {
        const index = lines.length - 1, next = lines[index] ? lines[index] + ' ' + word : word;
        if (lines[index] && cv.textWidth(next, 20) > 1552) lines.push(word);
        else lines[index] = next;
    });
    lines.slice(0, 2).forEach((line, i) => text(cv, line, 24, top + 57 + i * 24, 1552, 20,
        lighting.notice ? t.warn : t.dim));
    text(cv, 'Tap a mode or use Assign colors. Only driving modes fitted to your vehicle can occur.',
        24, top + 108, 1552, 17, t.dim);
    const columns = 3, rows = Math.ceil(MODES.length / columns), gap = 24;
    const width = (1552 - gap * (columns - 1)) / columns, y0 = top + 122;
    const height = (bottom - y0 - 28) / rows;
    MODES.forEach((mode, index) => {
        const x = 24 + Math.floor(index / rows) * (width + gap), y = y0 + index % rows * height;
        const active = lighting.mode === mode;
        cv.roundRect(x, y, width, height - 3, 4, active ? t.panelTop : t.panelBottom);
        if (active) cv.fillRect(x, y + 3, 3, height - 9, t.accent);
        text(cv, mode.label, x + 12, y + height / 2 + 6, width - 180, 18, t.text);
        text(cv, colorLabel(lighting.mappings[mode.name]), x + width - 12, y + height / 2 + 6,
            160, 17, t.dim, { align: 'right' });
        targets.push({ x, y, w: width, h: height - 3, mode });
    });
    text(cv, 'Factory slots 1-12; colors depend on vehicle coding. Following continues while this app is running.',
        24, bottom - 3, 1552, 16, t.dim);
    return { canvas: cv, targets };
}

module.exports = { draw, text };

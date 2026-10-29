'use strict';
const G = require('./kit/gauges');
const { HMI, FULL } = require('./kit/display');
const { text } = require('./instruments');
const driving = require('./driving');
const temperatures = require('./temperatures');
const health = require('./health');

const blue = '#81c4ff';
const titles = { driving: 'Driving', temperatures: 'Temperatures', health: 'Engine health' };

function draw(ctx, vm) {
    const cv = ctx.canvas(1600, 520), t = ctx.theme(), model = vm.model;
    cv.clear(t.bg);
    G.frame(cv, t, model.settings.order.map((id) => titles[id]), model.settings.order.indexOf(vm.page),
        ctx.preview ? [{ text: 'PREVIEW', color: blue }] : []);
    const full = cv.chrome && cv.place && cv.place.full;
    const headH = cv.chrome ? FULL.headH : 0;
    const contentTop = full ? (headH - cv.place.oy) / cv.place.scale + 8 : G.TOP;
    const contentBottom = full ? (cv.place.h - FULL.barH - cv.place.oy) / cv.place.scale - 8 :
        cv.h - FULL.barH - 8;
    const page = Object.assign({}, vm, { contentTop, contentBottom });
    if (vm.page === 'driving') driving(cv, t, page);
    else if (vm.page === 'temperatures') temperatures(cv, t, page);
    else health(cv, t, page);

    const width = full ? cv.place.w : cv.w, height = full ? cv.place.h : cv.h;
    const buttonWidth = full ? 224 : 200, leftEdge = full ? HMI.left - cv.place.x : 0;
    const left = leftEdge + (width - leftEdge - buttonWidth * vm.actions.length) / 2;
    const buttons = vm.actions.map((action, i) => ({ label: action.label, x: left + i * buttonWidth, w: buttonWidth }));
    if (full) cv.xf(1, 0, 0);
    G.menuBar(cv, Object.assign({}, t, { dim: t.text }), 0, height - FULL.barH, width, FULL.barH, buttons, -1, 'slim', -1);
    const selected = vm.actions.findIndex((action) => action.id === vm.focused);
    if (selected >= 0) cv.fillRect(buttons[selected].x + 12, height - 3, buttonWidth - 24, 3, blue);
    if (vm.notice) text(cv, vm.notice, leftEdge + 16, height - FULL.barH / 2 + 5,
        Math.max(0, left - leftEdge - 32), 14, t.warn);
    if (full) cv.xf();
    return cv;
}
module.exports = { titles, draw };

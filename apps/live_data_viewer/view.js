'use strict';
const G = require('./kit/gauges');
const { HMI, FULL } = require('./kit/display');
const { C, palette, text, get } = require('./instruments');
const driving = require('./driving');
const temperatures = require('./temperatures');
const health = require('./health');

const titles = { driving: 'Driving', temperatures: 'Temperatures', health: 'Engine health' };

function draw(ctx, vm) {
    palette(get(vm, 'driveMode'));
    const cv = ctx.canvas(1600, 520), model = vm.model;
    const t = Object.assign({}, ctx.theme(), { accent: C.blue, accent2: C.cyan, sel: C.blue, stripes: C.series });
    cv.clear(t.bg);
    G.frame(cv, t, model.settings.order.map((id) => titles[id]), model.settings.order.indexOf(vm.page),
        vm.demo ? [{ text: 'DEMO', color: C.blue }] : ctx.preview ? [{ text: 'PREVIEW', color: C.blue }] : []);
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
    const leftEdge = full ? HMI.left - cv.place.x : 0;
    const buttonWidth = Math.min(full ? 224 : 200, (width - leftEdge) / vm.actions.length);
    const left = leftEdge + (width - leftEdge - buttonWidth * vm.actions.length) / 2;
    const buttons = vm.actions.map((action, i) => ({ label: action.label, x: left + i * buttonWidth, w: buttonWidth }));
    if (full) cv.xf(1, 0, 0);
    G.menuBar(cv, Object.assign({}, t, { dim: t.text }), 0, height - FULL.barH, width, FULL.barH, buttons, -1, 'slim', -1);
    const scale = full ? cv.place.scale : 1, ox = full ? cv.place.ox : 0, oy = full ? cv.place.oy : 0;
    cv.targets = buttons.map((button, i) => ({ key: vm.actions[i].id, x: (button.x - ox) / scale,
        y: (height - FULL.barH - oy) / scale, w: button.w / scale, h: FULL.barH / scale, run: vm.actions[i].run }));
    const selected = vm.actions.findIndex((action) => action.id === vm.focused);
    if (selected >= 0) cv.fillRect(buttons[selected].x + 12, height - 3, buttonWidth - 24, 3, C.blue);
    if (full) cv.xf();
    if (vm.notice) {
        cv.roundRect(330, contentBottom - 31, 850, 28, 5, t.panelTop);
        text(cv, vm.notice, 755, contentBottom - 12, 830, 14, t.warn, { align: 'center' });
    }
    return cv;
}
module.exports = { titles, draw };

'use strict';
const G = require('./kit/gauges');
const { FULL } = require('./kit/display');
const { C, palette, text } = require('./instruments');
const driving = require('./driving');
const { draw: status } = require('./status');
const bm3 = require('./bm3_view');

const titles = { driving: 'Driving', status: 'Car Status', bm3: 'BM3 channels' };

function draw(ctx, vm) {
    const cv = ctx.canvas(1600, 520), model = vm.model;
    palette(vm);
    const t = Object.assign({}, ctx.theme(), { accent: C.blue, accent2: C.cyan, sel: C.blue, stripes: C.series });
    cv.clear(t.bg);
    const tabs = model.settings.order.map((id) => titles[id]);
    if (!(cv.chrome && ctx.display && ctx.display.own && ctx.display.own())) tabs.push('Settings');
    G.frame(cv, t, tabs, model.settings.order.indexOf(vm.page),
        vm.demo ? [{ text: 'DEMO', color: C.blue }] : ctx.preview ? [{ text: 'PREVIEW', color: C.blue }] : []);
    const full = cv.chrome && cv.place && cv.place.full;
    const headH = cv.chrome ? FULL.headH : 0;
    const contentTop = full ? (headH - cv.place.oy) / cv.place.scale + 8 : G.TOP;
    const contentBottom = full ? (cv.place.h - cv.place.oy) / cv.place.scale - 8 : cv.h - 8;
    const page = Object.assign({}, vm, { contentTop, contentBottom });
    if (vm.page === 'driving') driving(cv, t, page);
    else if (vm.page === 'status') status(cv, t, page);
    else if (vm.page === 'bm3') bm3(cv, t, page);

    if (vm.notice) {
        cv.roundRect(330, contentBottom - 31, 850, 28, 5, t.panelTop);
        text(cv, vm.notice, 755, contentBottom - 12, 830, 14, t.warn, { align: 'center' });
    }
    return cv;
}
module.exports = { titles, draw };

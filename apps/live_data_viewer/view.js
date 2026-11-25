'use strict';
const G = require('./kit/gauges');
const { FULL } = require('./kit/display');
const { text } = require('./instruments');
const driving = require('./driving');
const { draw: status } = require('./status');
const bm3 = require('./bm3_view');

const titles = { driving: 'Driving', status: 'Car Status', bm3: 'BM3 channels' };
const pages = Object.keys(titles);

function draw(ctx, vm) {
    const cv = ctx.canvas(1600, 520), t = ctx.theme();
    cv.clear(t.bg);
    const tabs = pages.map((id) => titles[id]);
    if (!(cv.chrome && ctx.display && ctx.display.own && ctx.display.own())) tabs.push('Settings');
    G.frame(cv, t, tabs, pages.indexOf(vm.page),
        vm.demo ? [{ text: 'DEMO', color: t.accent }] : ctx.preview ? [{ text: 'PREVIEW', color: t.accent }] : []);
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
module.exports = { titles, pages, draw };

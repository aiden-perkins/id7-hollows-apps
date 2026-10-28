'use strict';
const G = require('./kit/gauges');
const V = require('./view');

const W = 1600, H = 520, X = 24, RIGHT = 1576;
const numeric = (value) => Number.isFinite(value);
const amount = (value) => numeric(value) ? value.toFixed(3) : '--';
const blue = '#81c4ff', red = '#ef2b2d', green = '#56d99b';
function label(cv, text, x, y, width, size, color, options) {
    text = String(text == null ? '' : text);
    const opts = options || {};
    if (cv.textWidth(text, size, opts) > width) {
        while (text && cv.textWidth(text + '...', size, opts) > width) text = text.slice(0, -1);
        text += '...';
    }
    cv.text(text, x, y, size, color, opts);
}
function panel(cv, t, x, y, w, h, heading) {
    cv.roundRect(x, y, w, h, 9, t.panelBottom);
    cv.strokeRoundRect(x, y, w, h, 9, 1, t.panelEdge);
    cv.fillRect(x + 16, y + 14, 26, 3, blue);
    cv.fillRect(x + 45, y + 14, 26, 3, '#16588e');
    cv.fillRect(x + 74, y + 14, 26, 3, red);
    if (heading) label(cv, heading, x + 16, y + 43, w - 32, 20, t.dim);
}
function metric(cv, t, x, y, w, h, name, value, unit, sub, color) {
    panel(cv, t, x, y, w, h);
    label(cv, name.toUpperCase(), x + 16, y + 42, w - 32, 17, t.dim, { font: 'bold', spacing: 1 });
    label(cv, typeof value === 'string' ? value : amount(value), x + 16, y + Math.min(98, h - 32), w - 32, h >= 140 ? 43 : 30, color || t.text, { font: typeof value === 'string' && !/^[0-9:.+-]+$/.test(value) ? 'label' : 'num' });
    if (unit) label(cv, unit, x + w - 18, y + 43, w - 32, 16, blue, { align: 'right' });
    if (sub) label(cv, sub, x + 16, y + h - 13, w - 32, 15, t.dim);
}
function chip(cv, t, action, rect, focused) {
    const { x, y, w, h } = rect;
    cv.roundRect(x, y, w, h, 7, focused ? '#24344a' : t.panelTop);
    cv.strokeRoundRect(x, y, w, h, 7, focused ? 2 : 1, focused ? blue : t.panelEdge);
    if (focused) cv.fillRect(x + 12, y + h - 5, w - 24, 3, red);
    label(cv, action.label, x + w / 2, y + h / 2 + 7, w - 26, 20, action.enabled === false ? t.dim : t.text, { align: 'center', font: 'bold' });
}
function actions(cv, t, vm, y) {
    const all = vm.actions, perPage = 6, page = Math.floor(vm.focus / perPage), start = page * perPage;
    const shown = all.slice(start, start + perPage), gap = 12, width = (1552 - gap * (shown.length - 1)) / Math.max(1, shown.length);
    shown.forEach((a, i) => chip(cv, t, a, { x: X + i * (width + gap), y: y || 428, w: width, h: 52 }, vm.focus === start + i));
}
function coverageBar(cv, t, x, y, w, name, ms, total) {
    const fraction = total > 0 ? Math.min(1, Math.max(0, ms / total)) : null;
    label(cv, name, x, y, w, 16, t.dim);
    label(cv, fraction === null ? '--' : (fraction * 100).toFixed(3) + '%', x + w, y, w, 16, blue, { align: 'right' });
    cv.roundRect(x, y + 9, w, 4, 2, t.track);
    if (fraction > 0) cv.roundRect(x, y + 9, Math.max(2, w * fraction), 4, 2, blue);
}
function empty(cv, t, x, y, w, h, title, explanation) {
    panel(cv, t, x, y, w, h);
    cv.line(x + 30, y + h - 44, x + w - 30, y + h - 44, 1, t.track);
    label(cv, title, x + w / 2, y + h / 2 - 6, w - 64, 30, t.text, { align: 'center', font: 'bold' });
    label(cv, explanation, x + w / 2, y + h / 2 + 31, w - 64, 20, t.dim, { align: 'center' });
}
function chart(cv, t, vm, box, metricName, axis, controls) {
    const config = Object.assign({}, vm.graph, { metric: metricName || vm.graph.metric, axis: axis || vm.graph.axis });
    panel(cv, t, box.x, box.y, box.w, box.h);
    const xkey = config.axis === 'distance' ? 'distance' : 'elapsedMs', key = config.metric;
    const points = V.windowPoints(vm.projection, config);
    const valid = points.filter((p) => numeric(p[key]) && numeric(p[xkey]) && !p.gaps[key] && !(xkey === 'distance' && p.gaps.distance));
    const left = box.x + 86, top = box.y + (box.compact ? 39 : 31);
    const width = box.w - (box.compact ? 106 : 112), height = box.h - (box.compact ? 84 : 76);
    const caption = box.compact && key === 'mpg' ? 'US MPG / 60 s' :
        (key === 'altitude' ? 'ELEVATION' : key === 'mpg' ? 'ROLLING ECONOMY / 60 s' : 'VEHICLE SPEED') + ' / ' + V.unit(key);
    if (box.compact) {
        const summaryWidth = box.summary ? Math.min(cv.textWidth(box.summary, 15, { font: 'bold' }) + 12, box.w * 0.65) : 0;
        label(cv, caption, box.x + 114, box.y + 24, box.w - 146 - summaryWidth, 15, t.dim);
        if (box.summary) label(cv, box.summary, box.x + box.w - 18, box.y + 24, summaryWidth, 15, t.text, { align: 'right', font: 'bold' });
    } else label(cv, caption, left, box.y + 21, width, 15, t.dim);
    for (let i = 0; i < 5; i++) cv.line(left, top + height * i / 4, left + width, top + height * i / 4, 1, t.track);
    if (!valid.length || vm.graphLoading || !vm.trip) {
        const why = vm.graphLoading ? 'Loading recorded samples' : !vm.trip ? 'Start a trip to record this view' :
            xkey === 'distance' ? 'Distance alignment unavailable' : key === 'altitude' ? 'Waiting for valid altitude' :
                key === 'mpg' ? (vm.trip.stats.fuelMs && vm.trip.stats.matchedGallons === 0 ? 'No finite MPG / zero matched fuel' : 'Fuel consumption is unavailable') : 'Speed calibration is unavailable';
        label(cv, why, left + width / 2, top + height / 2, width - 30, box.compact ? 19 : 25, t.dim, { align: 'center' });
    } else {
        let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
        valid.forEach((p) => { xmin = Math.min(xmin, p[xkey]); xmax = Math.max(xmax, p[xkey]); ymin = Math.min(ymin, p[key]); ymax = Math.max(ymax, p[key]); });
        if (xmin === xmax) xmax = xmin + (xkey === 'distance' ? 1 : 60000);
        if (ymin === ymax) { ymin -= 0.5; ymax += 0.5; }
        const xy = (p, value) => [left + (p[xkey] - xmin) / (xmax - xmin) * width, top + height - (value - ymin) / (ymax - ymin) * height];
        let previous = null, smooth = null;
        points.forEach((p) => {
            if (!numeric(p[key]) || !numeric(p[xkey]) || p.gaps[key] || xkey === 'distance' && p.gaps.distance) { previous = null; smooth = null; return; }
            if (previous && p.segment !== previous.segment) { previous = null; smooth = null; }
            smooth = vm.smoothing && smooth !== null ? (smooth + p[key]) / 2 : p[key];
            const pos = xy(p, smooth);
            if (previous) cv.line(previous.x, previous.y, pos[0], pos[1], 2.5, key === 'mpg' ? green : blue);
            else cv.circle(pos[0], pos[1], 2.2, blue);
            previous = { x: pos[0], y: pos[1], segment: p.segment };
        });
        [0, 0.5, 1].forEach((fraction) => {
            const value = ymax - (ymax - ymin) * fraction;
            label(cv, value.toFixed(3), left - 12, top + height * fraction + 6, 70, 15, t.dim, { align: 'right', font: 'num' });
        });
        const divisor = xkey === 'distance' ? 1 : 60000;
        label(cv, (xmin / divisor).toFixed(3), left, top + height + 24, width / 2, 15, t.dim, { font: 'num' });
        label(cv, (xmax / divisor).toFixed(3), left + width, top + height + 24, width / 2, 15, t.dim, { align: 'right', font: 'num' });
        if (controls) {
            const p = V.selectedPoint(vm.projection, config);
            if (p && numeric(p[xkey])) {
                const pos = xy(p, numeric(p[key]) ? p[key] : ymin);
                if (pos[0] >= left && pos[0] <= left + width) {
                    cv.line(pos[0], top, pos[0], top + height, 1.5, red);
                    if (numeric(p[key]) && !p.gaps[key]) cv.circle(pos[0], pos[1], 4, t.text);
                }
            }
        }
    }
    label(cv, xkey === 'distance' ? 'Observed distance / mi' : box.compact ? 'Time / min' : 'Elapsed timeline / min', box.x + box.w / 2, box.y + box.h - 7, box.w - 40, 14, t.dim, { align: 'center' });
}
function trip(cv, t, vm) {
    const s = vm.trip, a = s && s.stats, live = vm.saved ? null : vm.live;
    const economy = a && a.matchedMs && a.matchedGallons > 0 ? amount(a.matchedMiles / a.matchedGallons) :
        a && a.matchedMs && a.matchedMiles > 0 ? 'Coasting' : '--';
    const averageSpeed = a && a.speedMs && a.durationMs ? amount(a.distanceMiles * 3600000 / a.durationMs) : '--';
    const movingSpeed = a && a.movingMs ? amount(a.movingMiles * 3600000 / a.movingMs) : '--';
    panel(cv, t, 24, 93, 420, 322, vm.saved ? 'SAVED TRIP' : 'LIVE VEHICLE');
    label(cv, amount(live && live.speed.state === 'live' ? live.speed.value : null), 42, 197, 285, 73, t.text, { font: 'num' });
    cv.text('mph', 423, 196, 23, blue, { align: 'right' });
    label(cv, 'Gear ' + (live && live.gear.state === 'live' ? live.gear.value : '--'), 423, 136, 160, 23, t.text, { align: 'right' });
    const cells = [
        ['Distance / mi', a && a.speedMs ? amount(a.distanceMiles) : '--'],
        ['Timer', V.duration(a && a.durationMs)],
        ['Altitude / ft', amount(vm.saved ? a && a.altitude.end : live && live.gps.state === 'live' ? live.gps.altitudeFt : null)],
        ['Top speed / mph', amount(a && a.topSpeed)],
        ['Fuel used / US gal', a && a.fuelMs ? amount(a.fuelGallons) : '--'],
        ['Moving time', a && a.speedMs ? V.duration(a.movingMs) : '--:--:--'],
    ];
    cells.forEach((cell, i) => {
        const x = 42 + i % 2 * 201, y = 225 + Math.floor(i / 2) * 54;
        label(cv, cell[0], x, y, 181, 16, t.dim);
        label(cv, cell[1], x, y + 28, 181, 27, t.text, { font: 'num' });
    });
    label(cv, 'Speed ' + (a ? V.coverage(a.speedMs, a.durationMs) : '--') + ' / fuel ' +
        (a ? V.coverage(a.fuelMs, a.durationMs) : '--'), 42, 400, 382, 14, t.dim);
    chart(cv, t, vm, { x: 460, y: 93, w: 1116, h: 155, compact: true,
        summary: 'Avg ' + averageSpeed + ' mph / Moving avg ' + movingSpeed + ' mph' }, 'speed', 'time', false);
    chart(cv, t, vm, { x: 460, y: 260, w: 550, h: 155, compact: true,
        summary: 'Avg ' + economy }, 'mpg', 'time', false);
    chart(cv, t, vm, { x: 1026, y: 260, w: 550, h: 155, compact: true }, 'altitude', 'time', false);
    actions(cv, t, vm);
}
function elevation(cv, t, vm) {
    chart(cv, t, vm, { x: 24, y: 93, w: 1090, h: 262 }, 'altitude', 'time', false);
    const a = vm.trip && vm.trip.stats.altitude;
    const values = [['First', a && a.start], ['Last', a && a.end], ['Net', a && a.start !== null && a.end !== null ? a.end - a.start : null], ['Minimum', a && a.min], ['Maximum', a && a.max]];
    values.forEach((v, i) => {
        const x = 24 + i * 221;
        cv.roundRect(x, 368, 205, 47, 5, t.panelBottom);
        cv.text(v[0], x + 10, 385, 15, t.dim);
        label(cv, amount(v[1]) + ' ft', x + 10, 407, 185, 21, t.text, { font: 'num' });
    });
    panel(cv, t, 1130, 93, 446, 322, 'CLIMBING ESTIMATES');
    [['Ascent', a && a.coverageMs ? a.ascent : null, 'ft'], ['Descent', a && a.coverageMs ? a.descent : null, 'ft'],
        ['Vertical speed', a && a.verticalFpm, 'ft/min']].forEach((v, i) => {
        const y = 172 + i * 67;
        cv.text(v[0], 1148, y, 18, t.dim);
        label(cv, amount(v[1]) + ' ' + v[2], 1556, y + 3, 240, 28, i === 1 ? t.text : blue, { align: 'right', font: 'num' });
    });
    coverageBar(cv, t, 1148, 365, 408, 'Valid height coverage', a ? a.coverageMs : 0, vm.trip ? vm.trip.stats.durationMs : 0);
    label(cv, vm.trip ? 'Noise deadband ' + vm.trip.policy.altitudeThresholdFt + ' ft / GPS reference unconfirmed' : 'Waiting for a recorded trip', 1148, 400, 410, 15, t.dim);
    actions(cv, t, vm);
}
function table(cv, t, columns, rows, x, y, w, rowHeight, size) {
    let px = x;
    columns.forEach((c) => { label(cv, c[0], px + 9, y + 21, w * c[1] - 18, 16, t.dim, { font: 'bold' }); px += w * c[1]; });
    cv.fillRect(x, y + 31, w, 1, t.panelEdge);
    rows.forEach((row, i) => {
        const py = y + 34 + i * rowHeight;
        if (i % 2 === 0) cv.fillRect(x, py, w, rowHeight, t.panelBottom);
        let cellX = x;
        row.forEach((value, j) => { label(cv, value, cellX + 9, py + rowHeight / 2 + 7, w * columns[j][1] - 18, size || 20, j === 0 ? blue : t.text, { font: j === 0 ? 'label' : 'num' }); cellX += w * columns[j][1]; });
    });
}
function fuel(cv, t, vm) {
    const s = vm.trip, a = s && s.stats;
    panel(cv, t, 24, 93, 348, 322, 'FUEL SUMMARY');
    label(cv, 'FUEL USED / US GAL', 42, 174, 310, 17, t.dim, { font: 'bold' });
    label(cv, a && a.fuelMs ? amount(a.fuelGallons) : '--', 42, 227, 310, 44, t.text, { font: 'num' });
    label(cv, 'AVERAGE / US MPG', 42, 278, 310, 17, t.dim, { font: 'bold' });
    const economy = a && a.matchedMs && a.matchedGallons > 0 ? amount(a.matchedMiles / a.matchedGallons) :
        a && a.matchedMs && a.matchedMiles > 0 ? 'Coasting' : '--';
    label(cv, economy, 42, 329, 310, 42, green, { font: economy === 'Coasting' ? 'label' : 'num' });
    coverageBar(cv, t, 42, 368, 310, 'Matched coverage', a ? a.matchedMs : 0, a ? a.durationMs : 0);
    label(cv, 'Rolling graph: 60-second MPG', 42, 402, 310, 16, t.dim);
    chart(cv, t, vm, { x: 388, y: 93, w: 680, h: 322 }, 'mpg', 'time', false);
    panel(cv, t, 1084, 93, 492, 322);
    const bands = s ? s.policy.speedBands : vm.speedBands;
    const names = bands.map((limit, i) => (i ? bands[i - 1] + '-' : '<') + limit).concat([bands[bands.length - 1] + '+', 'Unknown']);
    const start = vm.tablePage * 8;
    label(cv, 'Speed bands ' + (start + 1) + '-' + Math.min(start + 8, names.length) + ' / ' + names.length, 1100, 132, 458, 17, t.dim);
    const rows = names.slice(start, start + 8).map((name, i) => {
        const b = a && a.bands[start + i];
        if (vm.tableCoverage) return [name, b ? amount(b.durationMs / 1000) : '--',
            b && b.durationMs ? amount(b.distanceMs / b.durationMs * 100) : '--',
            b && b.durationMs ? amount(b.fuelMs / b.durationMs * 100) : '--',
            b && b.durationMs ? amount(b.matchedMs / b.durationMs * 100) : '--'];
        return [name, b ? amount(b.durationMs / 1000) : '--', b && b.distanceMs ? amount(b.distanceMiles) : '--',
            b && b.fuelMs ? amount(b.fuelGallons) : '--',
            b && b.matchedMs && b.matchedGallons > 0 ? amount(b.matchedMiles / b.matchedGallons) :
                b && b.matchedMs ? (b.matchedMiles > 0 ? 'Coast' : 'N/A') : '--'];
    });
    const columns = vm.tableCoverage ? [['mph', 0.2], ['Time s', 0.2], ['Speed %', 0.2], ['Fuel %', 0.2], ['Match %', 0.2]] :
        [['mph', 0.2], ['Time s', 0.2], ['Miles', 0.2], ['US gal', 0.2], ['MPG', 0.2]];
    table(cv, t, columns, rows, 1092, 137, 476, 30, 16);
    actions(cv, t, vm);
}
function gears(cv, t, vm) {
    const a = vm.trip && vm.trip.stats, r = a && a.rpm;
    panel(cv, t, 24, 93, 1108, 322);
    const rows = ['1', '2', '3', '4', '5', '6', '7', '8'].map((name) => {
        const b = a && a.gears[name];
        if (vm.tableCoverage) return [name, b ? amount(b.durationMs / 1000) : '--',
            b && b.durationMs ? amount(b.distanceMs / b.durationMs * 100) + '%' : '--',
            b && b.durationMs ? amount(b.fuelMs / b.durationMs * 100) + '%' : '--',
            b && b.durationMs ? amount(b.matchedMs / b.durationMs * 100) + '%' : '--', b ? String(b.shifts) : '--'];
        return [name, b ? amount(b.durationMs / 1000) : '--', b && b.distanceMs ? amount(b.distanceMiles) : '--',
            b ? String(b.shifts) : '--', b && b.fuelMs ? amount(b.fuelGallons) : '--',
            b && b.matchedMs && b.matchedGallons > 0 ? amount(b.matchedMiles / b.matchedGallons) :
                b && b.matchedMs ? (b.matchedMiles > 0 ? 'Coasting' : 'Undefined') : '--',
            b && b.durationMs ? amount(b.distanceMs / b.durationMs * 100) + '%' : '--'];
    });
    const columns = vm.tableCoverage ? [['Gear', 0.1], ['Time / s', 0.2], ['Speed %', 0.18], ['Fuel %', 0.18], ['Matched %', 0.2], ['Shifts', 0.14]] :
        [['Gear', 0.08], ['Time / s', 0.18], ['Miles', 0.15], ['Shifts', 0.09], ['US gal', 0.15], ['US MPG', 0.15], ['Speed %', 0.2]];
    table(cv, t, columns, rows, 34, 119, 1088, 32, 18);
    panel(cv, t, 1148, 93, 428, 322, 'ENGINE / GEAR SUMMARY');
    [
        ['RPM minimum', r && r.min], ['RPM maximum', r && r.max],
        ['Weighted RPM', r && r.coverageMs ? r.rpmMs / r.coverageMs : null],
        ['Revolutions', r && r.coverageMs ? r.rpmMs / 60000 : null],
    ].forEach((cell, i) => {
        const x = 1166 + i % 2 * 201, y = 170 + Math.floor(i / 2) * 65;
        label(cv, cell[0], x, y, 185, 16, t.dim);
        label(cv, amount(cell[1]), x, y + 31, 185, 27, t.text, { font: 'num' });
    });
    coverageBar(cv, t, 1166, 293, 392, 'RPM coverage', r ? r.coverageMs : 0, a ? a.durationMs : 0);
    const time = (key) => a && a.gears[key] ? amount(a.gears[key].durationMs / 1000) : '--';
    label(cv, 'P ' + time('P') + ' / R ' + time('R') + ' / N ' + time('N') + ' s', 1166, 339, 392, 17, t.dim);
    const unknown = a ? Object.keys(a.gears).filter((key) => !['1', '2', '3', '4', '5', '6', '7', '8', 'P', 'R', 'N', 'NP'].includes(key))
        .reduce((total, key) => total + a.gears[key].durationMs, 0) : null;
    label(cv, 'N/P ' + time('NP') + ' / Unknown ' + (unknown === null ? '--' : amount(unknown / 1000)) + ' s', 1166, 371, 392, 17, t.dim);
    label(cv, 'Shifts count forward-gear changes only.', 1166, 402, 392, 16, t.dim);
    actions(cv, t, vm);
}
function history(cv, t, vm) {
    if (!vm.history.length) {
        empty(cv, t, 24, 103, 1552, 298, 'Your trips will appear here', 'Record a trip, then Finish to save it. Interrupted trips remain recoverable.');
    } else {
        const selected = Math.min(vm.focus, vm.history.length - 1), page = Math.floor(selected / 6), first = page * 6;
        vm.history.slice(first, first + 6).forEach((s, i) => {
            const x = 24 + i % 2 * 784, y = 101 + Math.floor(i / 2) * 105, focused = vm.focus === first + i;
            panel(cv, t, x, y, 768, 94);
            if (focused) cv.strokeRoundRect(x, y, 768, 94, 9, 2, blue);
            const status = s.status === 'finished' ? 'SAVED' : 'INTERRUPTED';
            label(cv, s.name, x + 16, y + 40, 515, 25, t.text, { font: 'bold' });
            label(cv, status, x + 750, y + 39, 200, 15, status === 'SAVED' ? blue : t.warn, { align: 'right' });
            label(cv, V.date(s.startedAt), x + 16, y + 73, 395, 17, t.dim);
            label(cv, V.duration(s.stats.durationMs) + '  /  ' + (s.stats.speedMs ? amount(s.stats.distanceMiles) + ' mi' : '-- mi'), x + 750, y + 73, 340, 21, t.text, { align: 'right', font: 'num' });
        });
        label(cv, 'Trips ' + (first + 1) + '-' + Math.min(first + 6, vm.history.length) + ' / ' + vm.history.length, 24, 92, 1552, 15, t.dim);
    }
    const tail = vm.actions.slice(vm.history.length);
    tail.forEach((a, i) => chip(cv, t, a, { x: 24 + i * 392, y: 428, w: 376, h: 52 }, vm.focus === vm.history.length + i));
}
function menu(cv, t, vm) {
    vm.actions.forEach((action, i) => {
        const cols = vm.page === 'menu' ? 3 : 2, width = cols === 3 ? 506 : 768;
        const x = 24 + i % cols * (width + 16), y = vm.page === 'menu' ? 126 : 102 + Math.floor(i / cols) * 160;
        panel(cv, t, x, y, width, vm.page === 'menu' ? 246 : 145);
        if (vm.focus === i) { cv.strokeRoundRect(x, y, width, vm.page === 'menu' ? 246 : 145, 9, 2, blue); cv.fillRect(x + 16, y + 24, 4, 30, red); }
        label(cv, action.label, x + 26, y + (vm.page === 'menu' ? 100 : 65), width - 52, 34, action.enabled === false ? t.dim : t.text, { font: 'bold' });
        label(cv, action.description || '', x + 26, y + (vm.page === 'menu' ? 153 : 103), width - 52, 19, t.dim);
    });
}
function edit(cv, t, vm) {
    const d = vm.draft, value = d[d.field], start = Math.max(0, d.caret - 43), shown = value.slice(start, d.caret) + '|' + value.slice(d.caret, d.caret + 40);
    panel(cv, t, 24, 94, 1552, 98);
    label(cv, d.field === 'name' ? 'TRIP NAME' : 'ANNOTATION', 42, 131, 260, 16, blue);
    label(cv, shown || '|', 310, 144, 1230, 26, t.text);
    label(cv, value.length + ' / ' + (d.field === 'name' ? 48 : 160) + ' characters', 42, 173, 1490, 15, t.dim);
    vm.actions.forEach((action, i) => chip(cv, t, action, { x: 24 + i % 10 * 157, y: 207 + Math.floor(i / 10) * 55, w: 139, h: 43 }, vm.focus === i));
}
function modal(cv, t, vm) {
    cv.fillRect(0, 38, W, H - 38, '#000000b8');
    panel(cv, t, 350, 137, 900, 254, vm.modal.title);
    label(cv, vm.modal.message, 380, 242, 840, 24, t.text);
    label(cv, vm.notice || vm.modal.detail || 'This action affects only the selected saved trip.', 380, 278, 840, 18, vm.notice ? t.warn : t.dim);
    vm.modal.actions.forEach((a, i) => chip(cv, t, a, { x: 380 + i * 438, y: 315, w: 410, h: 52 }, vm.modal.focus === i));
}
function draw(ctx, vm) {
    const cv = ctx.canvas(W, H), t = ctx.theme();
    cv.clear(t.bg);
    const tabs = ['Trip', 'Elevation', 'Fuel', 'Gears', 'History'];
    const selected = ['trip', 'elevation', 'fuel', 'gears', 'history'].indexOf(vm.page);
    const badges = [];
    if (vm.currentTrip) badges.push({ text: vm.currentTrip.status === 'recording' ? 'REC' : 'INTERRUPTED', color: vm.currentTrip.status === 'recording' ? red : t.warn });
    if (ctx.preview) badges.push({ text: 'PREVIEW', color: blue });
    G.frame(cv, t, tabs, selected, badges);
    const title = vm.page === 'history' ? 'Trip history' : vm.page === 'menu' ? 'Trip Data' : vm.page === 'edit' ? 'Edit saved trip' :
        vm.saved ? vm.trip.name + ' / ' + V.date(vm.trip.startedAt) : 'Current trip' + (vm.trip ? ' / ' + V.date(vm.trip.startedAt) : '');
    label(cv, title, 24, 74, 1320, 24, t.text);
    label(cv, vm.busy ? 'Working...' : vm.page === 'trip' && vm.trip ? (vm.saved && vm.trip.status !== 'finished' ? 'INTERRUPTED' : vm.trip.status.toUpperCase()) : 'M850i / US', RIGHT, 73, 280, 17, t.dim, { align: 'right' });
    if (vm.page === 'trip') trip(cv, t, vm);
    else if (vm.page === 'elevation') elevation(cv, t, vm);
    else if (vm.page === 'fuel') fuel(cv, t, vm);
    else if (vm.page === 'gears') gears(cv, t, vm);
    else if (vm.page === 'history') history(cv, t, vm);
    else if (vm.page === 'menu' || vm.page === 'actions') menu(cv, t, vm);
    else if (vm.page === 'edit') edit(cv, t, vm);
    label(cv, vm.notice || 'Turn to select / press to open / left tilt or Back to return', 24, 509, 1552, 17, vm.notice ? t.warn : t.dim);
    if (vm.modal) modal(cv, t, vm);
    return cv;
}
module.exports = { draw };

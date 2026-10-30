'use strict';
const G = require('./kit/gauges');
const { HMI, FULL } = require('./kit/display');
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
    cv.roundRect(x, y, w, h, 8, t.panelBottom);
    cv.line(x + 14, y + 1, x + w - 14, y + 1, 1, t.panelEdge);
    if (heading) label(cv, heading, x + 16, y + 27, w - 32, 17, t.dim);
}
function chip(cv, t, action, rect, focused) {
    const { x, y, w, h } = rect;
    cv.roundRect(x, y, w, h, 5, focused ? '#152331' : t.panelBottom);
    if (focused) cv.fillRect(x + 12, y + h - 3, w - 24, 3, blue);
    label(cv, action.label, x + w / 2, y + h / 2 + 7, w - 26, 20, action.enabled === false ? t.dim : t.text, { align: 'center', font: 'bold' });
}
function actions(cv, t, vm) {
    const full = cv.chrome && cv.place && cv.place.full;
    const width = full ? cv.place.w : cv.w, height = full ? cv.place.h : cv.h;
    const leftEdge = full ? HMI.left - cv.place.x : 0;
    const start = vm.page === 'history' ? vm.history.length : 0;
    const shown = ['menu', 'actions', 'edit'].includes(vm.page) ? [] : vm.actions.slice(start);
    const buttonWidth = Math.min(full ? 224 : 240, (width - leftEdge - 24) / Math.max(1, shown.length));
    const left = leftEdge + (width - leftEdge - buttonWidth * shown.length) / 2;
    const buttons = shown.map((a, i) => ({ label: a.label, x: left + i * buttonWidth, w: buttonWidth }));
    if (full) cv.xf(1, 0, 0);
    G.menuBar(cv, Object.assign({}, t, { dim: t.text }), 0, height - FULL.barH, width, FULL.barH, buttons, -1, 'slim', -1);
    const selected = vm.focus - start;
    if (selected >= 0 && selected < shown.length) {
        cv.fillRect(buttons[selected].x + 12, height - 3, buttonWidth - 24, 3, blue);
    }
    shown.forEach((a, i) => {
        if (a.enabled === false) cv.fillRect(buttons[i].x, height - FULL.barH + 2, buttonWidth, FULL.barH - 5, '#00000080');
    });
    if (!shown.length) label(cv, 'Turn to select / press to open / left tilt to return', leftEdge + 24, height - 18, width - leftEdge - 48, 16, t.dim);
    if (full) cv.xf();
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
    const left = box.x + 86, top = box.y + (box.compact ? 39 : 36);
    const width = box.w - (box.compact ? 106 : 112), height = box.h - (box.compact ? 84 : 81);
    const caption = box.compact && key === 'mpg' ? 'US MPG / 60 s' :
        (key === 'altitude' ? 'ELEVATION' : key === 'mpg' ? 'ROLLING ECONOMY / 60 s' : 'VEHICLE SPEED') + ' / ' + V.unit(key);
    if (box.compact) {
        const summaryWidth = box.summary ? Math.min(cv.textWidth(box.summary, 15, { font: 'bold' }) + 12, box.w * 0.65) : 0;
        label(cv, caption, box.x + 16, box.y + 24, box.w - 48 - summaryWidth, 15, t.dim);
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
    const top = vm.contentTop, h = vm.contentBottom - top, half = (h - 12) / 2;
    panel(cv, t, 24, top, 420, h, vm.saved ? 'TRIP AVERAGE' : vm.demo ? 'DEMO VEHICLE' : 'LIVE VEHICLE');
    label(cv, vm.saved ? averageSpeed : amount(live && live.speed.state === 'live' ? live.speed.value : null), 42, top + 105, 285, 73, blue, { font: 'num' });
    cv.text('mph', 423, top + 104, 23, blue, { align: 'right' });
    if (!vm.saved) label(cv, 'Gear ' + (live && live.gear.state === 'live' ? live.gear.value : '--'), 423, top + 27, 160, 23, t.text, { align: 'right' });
    const cells = [
        ['Distance / mi', a && a.speedMs ? amount(a.distanceMiles) : '--'],
        ['Timer', V.duration(a && a.durationMs)],
        ['Altitude / ft', amount(vm.saved ? a && a.altitude.end : live && live.gps.state === 'live' ? live.gps.altitudeFt : null)],
        ['Top speed / mph', amount(a && a.topSpeed)],
        ['Fuel used / US gal', a && a.fuelMs ? amount(a.fuelGallons) : '--'],
        ['Moving time', a && a.speedMs ? V.duration(a.movingMs) : '--:--:--'],
    ];
    cells.forEach((cell, i) => {
        const x = 42 + i % 2 * 201, y = top + 137 + Math.floor(i / 2) * (h - 180) / 3;
        label(cv, cell[0], x, y, 181, 16, t.dim);
        label(cv, cell[1], x, y + 28, 181, 27, t.text, { font: 'num' });
    });
    label(cv, 'Speed ' + (a ? V.coverage(a.speedMs, a.durationMs) : '--') + ' / fuel ' +
        (a ? V.coverage(a.fuelMs, a.durationMs) : '--'), 42, top + h - 15, 382, 14, t.dim);
    chart(cv, t, vm, { x: 460, y: top, w: 1116, h: half, compact: true,
        summary: 'Avg ' + averageSpeed + ' mph / Moving avg ' + movingSpeed + ' mph' }, 'speed', 'time', false);
    chart(cv, t, vm, { x: 460, y: top + half + 12, w: 550, h: half, compact: true,
        summary: 'Avg ' + economy }, 'mpg', 'time', false);
    chart(cv, t, vm, { x: 1026, y: top + half + 12, w: 550, h: half, compact: true }, 'altitude', 'time', false);
}
function elevation(cv, t, vm) {
    const top = vm.contentTop, h = vm.contentBottom - top;
    chart(cv, t, vm, { x: 24, y: top, w: 1090, h: h - 60 }, 'altitude', 'time', false);
    const a = vm.trip && vm.trip.stats.altitude;
    const values = [['First', a && a.start], ['Last', a && a.end], ['Net', a && a.start !== null && a.end !== null ? a.end - a.start : null], ['Minimum', a && a.min], ['Maximum', a && a.max]];
    values.forEach((v, i) => {
        const x = 24 + i * 221;
        cv.roundRect(x, top + h - 48, 205, 48, 5, t.panelBottom);
        cv.text(v[0], x + 10, top + h - 31, 15, t.dim);
        label(cv, amount(v[1]) + ' ft', x + 10, top + h - 8, 185, 21, blue, { font: 'num' });
    });
    panel(cv, t, 1130, top, 446, h, 'CLIMBING ESTIMATES');
    [['Ascent', a && a.coverageMs ? a.ascent : null, 'ft'], ['Descent', a && a.coverageMs ? a.descent : null, 'ft'],
        ['Vertical speed', a && a.verticalFpm, 'ft/min']].forEach((v, i) => {
        const y = top + 84 + i * (h - 180) / 3;
        cv.text(v[0], 1148, y, 18, t.dim);
        label(cv, amount(v[1]) + ' ' + v[2], 1556, y + 3, 240, 28, i === 1 ? t.text : blue, { align: 'right', font: 'num' });
    });
    coverageBar(cv, t, 1148, top + h - 52, 408, 'Valid height coverage', a ? a.coverageMs : 0, vm.trip ? vm.trip.stats.durationMs : 0);
    label(cv, vm.trip ? 'Noise deadband ' + vm.trip.policy.altitudeThresholdFt + ' ft / GPS reference unconfirmed' : 'Waiting for a recorded trip', 1148, top + h - 15, 410, 15, t.dim);
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
    const top = vm.contentTop, h = vm.contentBottom - top;
    panel(cv, t, 24, top, 348, h, 'FUEL SUMMARY');
    label(cv, 'FUEL USED / US GAL', 42, top + 73, 310, 17, t.dim, { font: 'bold' });
    label(cv, a && a.fuelMs ? amount(a.fuelGallons) : '--', 42, top + 126, 310, 44, blue, { font: 'num' });
    label(cv, 'AVERAGE / US MPG', 42, top + h * 0.57, 310, 17, t.dim, { font: 'bold' });
    const economy = a && a.matchedMs && a.matchedGallons > 0 ? amount(a.matchedMiles / a.matchedGallons) :
        a && a.matchedMs && a.matchedMiles > 0 ? 'Coasting' : '--';
    label(cv, economy, 42, top + h * 0.57 + 51, 310, 42, green, { font: economy === 'Coasting' ? 'label' : 'num' });
    coverageBar(cv, t, 42, top + h - 47, 310, 'Matched coverage', a ? a.matchedMs : 0, a ? a.durationMs : 0);
    label(cv, 'Rolling graph: 60-second MPG', 42, top + h - 13, 310, 16, t.dim);
    chart(cv, t, vm, { x: 388, y: top, w: 680, h }, 'mpg', 'time', false);
    panel(cv, t, 1084, top, 492, h);
    const bands = s ? s.policy.speedBands : vm.speedBands;
    const names = bands.map((limit, i) => (i ? bands[i - 1] + '-' : '<') + limit).concat([bands[bands.length - 1] + '+', 'Unknown']);
    const start = vm.tablePage * 8;
    label(cv, 'Speed bands ' + (start + 1) + '-' + Math.min(start + 8, names.length) + ' / ' + names.length, 1100, top + 27, 458, 17, t.dim);
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
    table(cv, t, columns, rows, 1092, top + 32, 476, (h - 70) / 8, 16);
}
function gears(cv, t, vm) {
    const a = vm.trip && vm.trip.stats, r = a && a.rpm;
    const top = vm.contentTop, h = vm.contentBottom - top;
    panel(cv, t, 24, top, 1108, h);
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
    table(cv, t, columns, rows, 34, top + 8, 1088, (h - 48) / 8, 18);
    panel(cv, t, 1148, top, 428, h, 'ENGINE / GEAR SUMMARY');
    [
        ['RPM minimum', r && r.min], ['RPM maximum', r && r.max],
        ['Weighted RPM', r && r.coverageMs ? r.rpmMs / r.coverageMs : null],
        ['Revolutions', r && r.coverageMs ? r.rpmMs / 60000 : null],
    ].forEach((cell, i) => {
        const x = 1166 + i % 2 * 201, y = top + 68 + Math.floor(i / 2) * (h - 190) / 2;
        label(cv, cell[0], x, y, 185, 16, t.dim);
        label(cv, amount(cell[1]), x, y + 31, 185, 27, t.text, { font: 'num' });
    });
    coverageBar(cv, t, 1166, top + h - 122, 392, 'RPM coverage', r ? r.coverageMs : 0, a ? a.durationMs : 0);
    const time = (key) => a && a.gears[key] ? amount(a.gears[key].durationMs / 1000) : '--';
    label(cv, 'P ' + time('P') + ' / R ' + time('R') + ' / N ' + time('N') + ' s', 1166, top + h - 76, 392, 17, t.dim);
    const unknown = a ? Object.keys(a.gears).filter((key) => !['1', '2', '3', '4', '5', '6', '7', '8', 'P', 'R', 'N', 'NP'].includes(key))
        .reduce((total, key) => total + a.gears[key].durationMs, 0) : null;
    label(cv, 'N/P ' + time('NP') + ' / Unknown ' + (unknown === null ? '--' : amount(unknown / 1000)) + ' s', 1166, top + h - 44, 392, 17, t.dim);
    label(cv, 'Shifts count forward-gear changes only.', 1166, top + h - 13, 392, 16, t.dim);
}
function history(cv, t, vm) {
    const top = vm.contentTop, h = vm.contentBottom - top;
    if (!vm.history.length) {
        empty(cv, t, 24, top, 1552, h, 'Your trips will appear here', 'Record a trip, then Finish to save it. Interrupted trips remain recoverable.');
    } else {
        const selected = Math.min(vm.focus, vm.history.length - 1), page = Math.floor(selected / 6), first = page * 6;
        const rowHeight = (h - 24) / 3;
        vm.history.slice(first, first + 6).forEach((s, i) => {
            const x = 24 + i % 2 * 784, y = top + 24 + Math.floor(i / 2) * rowHeight, focused = vm.focus === first + i;
            panel(cv, t, x, y, 768, rowHeight - 12);
            if (focused) cv.fillRect(x + 16, y + rowHeight - 15, 736, 3, blue);
            const status = s.demo ? 'DEMO' : s.status === 'finished' ? 'SAVED' : 'INTERRUPTED';
            label(cv, s.name, x + 16, y + 40, 515, 25, t.text, { font: 'bold' });
            label(cv, status, x + 750, y + 39, 200, 15, status === 'INTERRUPTED' ? t.warn : blue, { align: 'right' });
            label(cv, V.date(s.startedAt), x + 16, y + 73, 395, 17, t.dim);
            label(cv, V.duration(s.stats.durationMs) + '  /  ' + (s.stats.speedMs ? amount(s.stats.distanceMiles) + ' mi' : '-- mi'), x + 750, y + 73, 340, 21, t.text, { align: 'right', font: 'num' });
        });
        label(cv, 'Trips ' + (first + 1) + '-' + Math.min(first + 6, vm.history.length) + ' / ' + vm.history.length, 24, top + 15, 1552, 15, t.dim);
    }
}
function menu(cv, t, vm) {
    const top = vm.contentTop, h = vm.contentBottom - top;
    vm.actions.forEach((action, i) => {
        const cols = vm.page === 'menu' ? 3 : 2, width = cols === 3 ? 506 : 768;
        const rows = Math.ceil(vm.actions.length / cols), height = (h - 12 * (rows - 1)) / rows;
        const x = 24 + i % cols * (width + 16), y = top + Math.floor(i / cols) * (height + 12);
        panel(cv, t, x, y, width, height);
        if (vm.focus === i) cv.fillRect(x + 16, y + height - 3, width - 32, 3, blue);
        label(cv, action.label, x + 26, y + height * 0.43, width - 52, 30, action.enabled === false ? t.dim : t.text, { font: 'bold' });
        label(cv, action.description || '', x + 26, y + height * 0.43 + 40, width - 52, 19, t.dim);
    });
}
function edit(cv, t, vm) {
    const d = vm.draft, value = d[d.field], start = Math.max(0, d.caret - 43), shown = value.slice(start, d.caret) + '|' + value.slice(d.caret, d.caret + 40);
    const top = vm.contentTop, h = vm.contentBottom - top, rows = Math.ceil(vm.actions.length / 10);
    panel(cv, t, 24, top, 1552, 98);
    label(cv, d.field === 'name' ? 'TRIP NAME' : 'ANNOTATION', 42, top + 31, 260, 16, blue);
    label(cv, shown || '|', 310, top + 50, 1230, 26, t.text);
    label(cv, value.length + ' / ' + (d.field === 'name' ? 48 : 160) + ' characters', 42, top + 79, 1490, 15, t.dim);
    const rowHeight = (h - 110) / rows;
    vm.actions.forEach((action, i) => chip(cv, t, action, { x: 24 + i % 10 * 157, y: top + 110 + Math.floor(i / 10) * rowHeight, w: 139, h: rowHeight - 8 }, vm.focus === i));
}
function modal(cv, t, vm) {
    const top = vm.contentTop + (vm.contentBottom - vm.contentTop - 254) / 2;
    cv.fillRect(0, vm.contentTop - 28, W, vm.contentBottom - vm.contentTop + 28, '#000000b8');
    panel(cv, t, 350, top, 900, 254, vm.modal.title);
    label(cv, vm.modal.message, 380, top + 105, 840, 24, t.text);
    label(cv, vm.notice || vm.modal.detail || 'This action affects only the selected saved trip.', 380, top + 141, 840, 18, vm.notice ? t.warn : t.dim);
    vm.modal.actions.forEach((a, i) => chip(cv, t, a, { x: 380 + i * 438, y: top + 178, w: 410, h: 52 }, vm.modal.focus === i));
}
function draw(ctx, vm) {
    const cv = ctx.canvas(W, H), t = ctx.theme();
    cv.clear(t.bg);
    const tabs = ['Trip', 'Elevation', 'Fuel', 'Gears', 'History'];
    const selected = ['trip', 'elevation', 'fuel', 'gears', 'history'].indexOf(vm.page);
    const badges = [];
    if (vm.demo) badges.push({ text: 'DEMO', color: blue });
    else if (vm.currentTrip) badges.push({ text: vm.currentTrip.status === 'recording' ? 'REC' : 'INTERRUPTED', color: vm.currentTrip.status === 'recording' ? red : t.warn });
    if (ctx.preview) badges.push({ text: 'PREVIEW', color: blue });
    G.frame(cv, t, tabs, selected, badges);
    const full = cv.chrome && cv.place && cv.place.full;
    const top = full ? (FULL.headH - cv.place.oy) / cv.place.scale + 8 : G.TOP;
    const bottom = full ? (cv.place.h - FULL.barH - cv.place.oy) / cv.place.scale - 8 : H - FULL.barH - 8;
    vm = Object.assign({}, vm, { contentTop: top + 28, contentBottom: bottom - (vm.notice ? 24 : 0) });
    const title = vm.page === 'history' ? 'Trip history' : vm.page === 'menu' ? 'Trip Data' : vm.page === 'edit' ? 'Edit saved trip' :
        vm.saved ? vm.trip.name + ' / ' + V.date(vm.trip.startedAt) : 'Current trip' + (vm.trip ? ' / ' + V.date(vm.trip.startedAt) : '');
    label(cv, title, 24, top + 18, 1230, 17, t.dim);
    label(cv, vm.busy ? 'Working...' : vm.demo ? 'DEMO / MEMORY ONLY' : vm.page === 'trip' && vm.trip ? (vm.saved && vm.trip.status !== 'finished' ? 'INTERRUPTED' : vm.trip.status.toUpperCase()) : 'M850i / US', RIGHT, top + 18, 280, 16, t.dim, { align: 'right' });
    if (vm.page === 'trip') trip(cv, t, vm);
    else if (vm.page === 'elevation') elevation(cv, t, vm);
    else if (vm.page === 'fuel') fuel(cv, t, vm);
    else if (vm.page === 'gears') gears(cv, t, vm);
    else if (vm.page === 'history') history(cv, t, vm);
    else if (vm.page === 'menu' || vm.page === 'actions') menu(cv, t, vm);
    else if (vm.page === 'edit') edit(cv, t, vm);
    if (vm.notice) label(cv, vm.notice, 24, bottom - 4, 1552, 16, t.warn);
    actions(cv, t, vm);
    if (vm.modal) modal(cv, t, vm);
    return cv;
}
module.exports = { draw };

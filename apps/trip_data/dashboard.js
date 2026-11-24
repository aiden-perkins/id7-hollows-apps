'use strict';
const G = require('./kit/gauges');
const { FULL } = require('./kit/display');
const { validRpm } = require('./calculations');
const V = require('./view');

const W = 1600, H = 520, RIGHT = 1576;
const numeric = (value) => Number.isFinite(value);
const amount = (value) => numeric(value) ? value.toFixed(3) : '--';
const blue = '#81c4ff', red = '#ef2b2d', green = '#56d99b';
function label(cv, text, x, y, width, size, color, options) {
    text = String(text == null ? '' : text);
    const opts = options || {};
    const measured = cv.textWidth(text, size, opts);
    if (measured > width && opts.font === 'num') {
        size *= width / measured;
    } else if (measured > width) {
        let min = 0, max = text.length;
        while (min < max) {
            const mid = Math.ceil((min + max) / 2);
            if (cv.textWidth(text.slice(0, mid) + '...', size, opts) <= width) min = mid;
            else max = mid - 1;
        }
        text = text.slice(0, min) + '...';
    }
    cv.text(text, x, y, size, color, opts);
}
function panel(cv, t, x, y, w, h, heading) {
    cv.roundRect(x, y, w, h, 8, t.panelBottom);
    cv.line(x + 14, y + 1, x + w - 14, y + 1, 1, t.panelEdge);
    if (heading) label(cv, heading, x + 16, y + 27, w - 32, 17, t.dim);
}
function target(cv, vm, item, x, y, w, h) {
    if (cv.own && !item.disabled) {
        const key = item === vm.record ? item.id : vm.page + ':' + item.id;
        cv.target(x, y, w, h, () => vm.activate(item), key, 10);
    }
}
function button(cv, t, vm, item, x, y, w, h) {
    const color = item.tone === 'start' ? green : item.tone === 'end' ? '#ff7774' : t.text;
    cv.roundRect(x, y, w, h, 10, G.withAlpha(color, item.disabled ? 0.035 : item.tone ? 0.16 : 0.065));
    cv.strokeRoundRect(x, y, w, h, 10, 1, item.tone ? G.withAlpha(color, 0.55) : t.panelEdge);
    label(cv, item.label, x + w / 2, y + h / 2 + 8, w - 18, 22, item.disabled ? t.dim : color, { align: 'center', font: 'bold' });
    target(cv, vm, item, x, y, w, h);
}
function toolbar(cv, t, vm, top) {
    let end = RIGHT;
    if (cv.own && vm.page !== 'edit') {
        end -= vm.record.width;
        button(cv, t, vm, vm.record, end, top, vm.record.width, 52);
        end -= 12;
    }
    const tools = cv.own ? vm.tools : [];
    const toolsWidth = tools.reduce((width, item) => width + item.width + 10, 0);
    let x = end - toolsWidth;
    tools.forEach((item) => {
        button(cv, t, vm, item, x, top, item.width, 52);
        x += item.width + 10;
    });
    const width = end - toolsWidth - 40, hint = [vm.notice, vm.subtitle].filter(Boolean).join('  /  ');
    label(cv, vm.title, 24, top + 25, width, 29, t.text, { font: 'bold' });
    if (hint) label(cv, hint, 24, top + 48, width, 18, vm.notice && vm.notice !== vm.toast ? t.warn : t.dim);
}
function coverageBar(cv, t, x, y, w, name, ms, total) {
    const fraction = numeric(ms) && total > 0 ? Math.min(1, Math.max(0, ms / total)) : null;
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
function chart(cv, t, vm, box, metric, axis, controls) {
    const config = { metric, axis };
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
        const stats = vm.trip && vm.trip.stats;
        const fuelMessage = stats && stats.matchedMs && stats.matchedGallons === 0 ? 'No finite MPG / zero matched fuel' :
            stats && stats.fuelMs ? 'Waiting for matched fuel and speed samples' : 'Fuel consumption is unavailable';
        const why = vm.graphLoading ? 'Loading recorded samples' : vm.graphError || vm.graphSkipped ? 'Samples could not be read' :
            !vm.trip ? 'Start a trip to record this view' :
            xkey === 'distance' ? 'Distance alignment unavailable' : key === 'altitude' ? 'Waiting for valid altitude' :
                key === 'mpg' ? fuelMessage : 'Speed calibration is unavailable';
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
            if (xkey === 'distance' && p.breaks && (p.breaks.distance || p.breaks[key])) { previous = null; smooth = null; }
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
    label(cv, xkey === 'distance' ? (vm.trip && vm.trip.policy.calculationVersion === 2 ? 'Observed GPS distance / mi' : 'Observed speed-integrated distance / mi') :
        box.compact ? 'Time / min' : 'Elapsed timeline / min', box.x + box.w / 2, box.y + box.h - 7, box.w - 40, 14, t.dim, { align: 'center' });
    if (valid.length && vm.graphSkipped) label(cv, 'Sample gaps', box.x + box.w - 18, box.y + box.h - 8, 142, 15, t.warn, { align: 'right' });
}
function trip(cv, t, vm) {
    const s = vm.trip, a = s && s.stats, live = vm.live || {};
    const economy = a && a.matchedMs && a.matchedGallons > 0 ? amount(a.matchedMiles / a.matchedGallons) :
        a && a.matchedMs && a.matchedMiles > 0 ? 'Coasting' : 'Unavailable';
    const distanceMs = V.distanceCoverage(s), movingMs = V.movingDistanceCoverage(s);
    const averageSpeed = a && distanceMs ? amount(a.distanceMiles * 3600000 / distanceMs) : '--';
    const movingSpeed = a && movingMs ? amount(a.movingMiles * 3600000 / movingMs) : '--';
    const averageSource = s && s.policy.calculationVersion === 2 ? 'GPS-covered average' : 'Speed-covered average';
    const top = vm.contentTop, h = vm.contentBottom - top, half = (h - 12) / 2;
    panel(cv, t, 24, top, 500, h);
    label(cv, vm.saved ? averageSource : 'Vehicle speed', 48, top + 37, 350, 23, t.dim);
    const speed = live.speed && live.speed.state === 'live' ? live.speed.value : null;
    label(cv, vm.saved ? averageSpeed : amount(speed), 46, top + 118, 384, 83, blue, { font: 'num' });
    cv.text('mph', 500, top + 117, 25, blue, { align: 'right' });
    if (!vm.saved) label(cv, 'Gear ' + (live.gear && live.gear.state === 'live' ? live.gear.value : '--'),
        500, top + 38, 146, 23, t.text, { align: 'right', font: 'bold' });
    cv.line(48, top + 138, 500, top + 138, 1, t.track);
    const altitude = vm.saved ? a && a.altitude && a.altitude.end : live.gps && live.gps.state === 'live' ? live.gps.altitudeFt : null;
    const cells = [
        ['Distance', distanceMs ? V.number(a.distanceMiles, 'mi') : '--'],
        ['Elapsed', V.duration(a && a.durationMs)],
        ['Altitude', numeric(altitude) ? V.number(altitude, 'ft') : '--'],
        ['Top speed / mph', amount(a && a.topSpeed)],
        ['Fuel used / US gal', a && a.fuelMs ? amount(a.fuelGallons) : 'Unavailable'],
        ['Moving time', a && a.speedMs ? V.duration(a.movingMs) : '--:--:--'],
    ];
    cells.forEach((cell, i) => {
        const primary = i < 2, x = 48 + i % 2 * 234, remaining = h - 229;
        const y = primary ? top + 170 : top + 235 + (i < 4 ? 0.18 : 0.60) * remaining;
        label(cv, cell[0], x, y, 219, primary ? 20 : 18, t.dim);
        label(cv, cell[1], x, y + (primary ? 47 : 31), 219, primary ? 39 : 27, t.text,
            { font: cell[1] === 'Unavailable' ? 'label' : 'num' });
    });
    chart(cv, t, vm, { x: 540, y: top, w: 1036, h: half, compact: true,
        summary: (s && s.policy.calculationVersion === 2 ? 'GPS' : 'Speed') + '-covered avg ' + averageSpeed +
            ' mph / Moving-covered ' + movingSpeed + ' mph' }, 'speed', 'time', false);
    chart(cv, t, vm, { x: 540, y: top + half + 12, w: 512, h: half, compact: true,
        summary: 'Avg ' + economy }, 'mpg', 'time', false);
    chart(cv, t, vm, { x: 1064, y: top + half + 12, w: 512, h: half, compact: true }, 'altitude', 'time', false);
}
function elevation(cv, t, vm) {
    const top = vm.contentTop, h = vm.contentBottom - top;
    chart(cv, t, vm, { x: 24, y: top, w: 1080, h: h - 78 }, 'altitude', 'time', false);
    const a = vm.trip && vm.trip.stats.altitude;
    const projectedRate = vm.saved && vm.projection && vm.projection.verticalFpm;
    const verticalFpm = numeric(projectedRate) ? projectedRate : a && a.verticalFpm;
    const values = [['First', a && a.start], ['Last', a && a.end], ['Net', a && numeric(a.start) && numeric(a.end) ? a.end - a.start : null],
        ['Minimum', a && a.min], ['Maximum', a && a.max]];
    values.forEach((v, i) => {
        const x = 24 + i * 218;
        panel(cv, t, x, top + h - 66, 208, 66);
        cv.text(v[0], x + 12, top + h - 43, 17, t.dim);
        label(cv, amount(v[1]) + ' ft', x + 12, top + h - 12, 184, 24, blue, { font: 'num' });
    });
    panel(cv, t, 1120, top, 456, h, 'CLIMBING ESTIMATES');
    [['Ascent', a && a.coverageMs ? a.ascent : null, 'ft'], ['Descent', a && a.coverageMs ? a.descent : null, 'ft'],
        ['Vertical speed', verticalFpm, 'ft/min']].forEach((v, i) => {
        const y = top + 87 + i * (h - 142) / 3;
        cv.text(v[0], 1140, y, 20, t.dim);
        label(cv, amount(v[1]) + ' ' + v[2], 1556, y + 3, 248, 27, i === 1 ? t.text : blue, { align: 'right', font: 'num' });
        cv.line(1140, y + 16, 1556, y + 16, 1, t.track);
    });
    coverageBar(cv, t, 1140, top + h - 58, 416, 'Valid height coverage', a ? a.coverageMs : 0, vm.trip ? vm.trip.stats.durationMs : 0);
    label(cv, vm.trip ? 'Noise deadband ' + vm.trip.policy.altitudeThresholdFt + ' ft / GPS reference unconfirmed' : 'Waiting for a recorded trip', 1140, top + h - 16, 416, 15, t.dim);
}
function table(cv, t, columns, rows, x, y, w, rowHeight, size) {
    let px = x;
    columns.forEach((c) => { label(cv, c[0], px + 9, y + 23, w * c[1] - 18, 18, t.dim, { font: 'bold' }); px += w * c[1]; });
    cv.fillRect(x, y + 31, w, 1, t.panelEdge);
    rows.forEach((row, i) => {
        const py = y + 34 + i * rowHeight;
        if (i % 2 === 0) cv.fillRect(x, py, w, rowHeight, G.withAlpha('#ffffff', 0.04));
        let cellX = x;
        row.forEach((value, j) => { label(cv, value, cellX + 9, py + rowHeight / 2 + 7, w * columns[j][1] - 18, size || 20, j === 0 ? blue : t.text, { font: j === 0 ? 'label' : 'num' }); cellX += w * columns[j][1]; });
    });
}
function fuel(cv, t, vm) {
    const s = vm.trip, a = s && s.stats;
    const top = vm.contentTop, h = vm.contentBottom - top;
    panel(cv, t, 24, top, 304, h, 'FUEL SUMMARY');
    label(cv, 'Fuel used / US gal', 44, top + 77, 264, 21, t.dim);
    const fuelCovered = a && a.fuelMs;
    label(cv, fuelCovered ? amount(a.fuelGallons) : 'Unavailable', 44, top + 129, 264, 42, blue, { font: fuelCovered ? 'num' : 'label' });
    label(cv, 'Matched average / US MPG', 44, top + h * 0.50, 264, 20, t.dim);
    const hasMpg = a && a.matchedMs && a.matchedGallons > 0;
    const economy = hasMpg ? amount(a.matchedMiles / a.matchedGallons) :
        a && a.matchedMs && a.matchedMiles > 0 ? 'Coasting' : 'Unavailable';
    label(cv, economy, 44, top + h * 0.50 + 51, 264, 42, green, { font: hasMpg ? 'num' : 'label' });
    coverageBar(cv, t, 44, top + h - 58, 264, 'Matched coverage', a ? a.matchedMs : 0, a ? a.durationMs : 0);
    label(cv, 'Rolling graph / 60-second MPG', 44, top + h - 16, 264, 16, t.dim);
    chart(cv, t, vm, { x: 344, y: top, w: 532, h }, 'mpg', 'time', false);
    panel(cv, t, 892, top, 684, h);
    const bands = vm.bands;
    const names = bands.map((limit, i) => (i ? bands[i - 1] + '-' : '<') + limit).concat([bands[bands.length - 1] + '+', 'Unknown']);
    const start = vm.tablePage * vm.bandRows;
    label(cv, 'Speed bands ' + (start + 1) + '-' + Math.min(start + vm.bandRows, names.length) + ' / ' + names.length, 910, top + 31, 642, 22, t.text, { font: 'bold' });
    const rows = names.slice(start, start + vm.bandRows).map((name, i) => {
        const b = a && a.bands && a.bands[start + i];
        if (vm.tableCoverage) return [name, b ? amount(b.durationMs / 60000) : '--',
            b && b.durationMs ? amount(b.distanceMs / b.durationMs * 100) : '--',
            b && b.durationMs ? amount(b.fuelMs / b.durationMs * 100) : '--',
            b && b.durationMs ? amount(b.matchedMs / b.durationMs * 100) : '--'];
        return [name, b ? amount(b.durationMs / 60000) : '--', b && b.distanceMs ? amount(b.distanceMiles) : '--',
            b && b.fuelMs ? amount(b.fuelGallons) : '--',
            b && b.matchedMs && b.matchedGallons > 0 ? amount(b.matchedMiles / b.matchedGallons) :
                b && b.matchedMs ? (b.matchedMiles > 0 ? 'Coast' : 'N/A') : '--'];
    });
    const distanceLabel = s && s.policy.calculationVersion === 2 ? 'Dist %' : 'Speed %';
    const columns = vm.tableCoverage ? [['mph', 0.2], ['Time min', 0.2], [distanceLabel, 0.2], ['Fuel %', 0.2], ['Match %', 0.2]] :
        [['mph', 0.2], ['Time min', 0.2], ['Miles', 0.2], ['US gal', 0.2], ['MPG', 0.2]];
    table(cv, t, columns, rows, 900, top + 41, 668, (h - 102) / vm.bandRows, 22);
    label(cv, V.distanceSource(s), 910, top + h - 15, 642, 16, t.dim);
}
function gears(cv, t, vm) {
    const a = vm.trip && vm.trip.stats, r = a && a.rpm, gearStats = a && a.gears || {};
    const projectedPeak = vm.saved && vm.projection && vm.projection.rpmMax;
    const rpmMax = validRpm(projectedPeak) ? projectedPeak : r && validRpm(r.max) ? r.max : null;
    const top = vm.contentTop, h = vm.contentBottom - top;
    panel(cv, t, 24, top, 1108, h);
    const names = ['1', '2', '3', '4', '5', '6', '7', '8', 'R'];
    const rows = names.map((name) => {
        const b = gearStats[name];
        const distanceShare = b && b.distanceMs && a.distanceMiles > 0 ? amount(b.distanceMiles / a.distanceMiles * 100) + '%' : '--';
        if (vm.tableCoverage) return [name, b ? amount(b.durationMs / 1000) : '--',
            distanceShare,
            b && b.durationMs ? amount(b.fuelMs / b.durationMs * 100) + '%' : '--',
            b && b.durationMs ? amount(b.matchedMs / b.durationMs * 100) + '%' : '--', b ? String(b.shifts) : '--'];
        return [name, b ? amount(b.durationMs / 1000) : '--', b && b.distanceMs ? amount(b.distanceMiles) : '--',
            b ? String(b.shifts) : '--', b && b.fuelMs ? amount(b.fuelGallons) : '--',
            b && b.matchedMs && b.matchedGallons > 0 ? amount(b.matchedMiles / b.matchedGallons) :
                b && b.matchedMs ? (b.matchedMiles > 0 ? 'Coasting' : 'Undefined') : '--',
            distanceShare];
    });
    const distanceLabel = 'Trip miles %';
    const columns = vm.tableCoverage ? [['Gear', 0.1], ['Time / s', 0.2], [distanceLabel, 0.18], ['Fuel %', 0.18], ['Matched %', 0.2], ['Shifts', 0.14]] :
        [['Gear', 0.08], ['Time / s', 0.18], ['Miles', 0.15], ['Shifts', 0.09], ['US gal', 0.15], ['US MPG', 0.15], [distanceLabel, 0.2]];
    table(cv, t, columns, rows, 34, top + 8, 1088, (h - 76) / names.length, 21);
    label(cv, V.distanceSource(vm.trip), 42, top + h - 12, 1072, 16, t.dim);
    panel(cv, t, 1148, top, 428, h, 'ENGINE / GEAR SUMMARY');
    [
        ['RPM minimum', r && r.min], ['RPM maximum', rpmMax],
        ['Weighted RPM', r && r.coverageMs ? r.rpmMs / r.coverageMs : null],
        ['Revolutions', r && r.coverageMs ? r.rpmMs / 60000 : null],
    ].forEach((cell, i) => {
        const x = 1166 + i % 2 * 201, y = top + 68 + Math.floor(i / 2) * (h - 190) / 2;
        label(cv, cell[0], x, y, 185, 18, t.dim);
        label(cv, amount(cell[1]), x, y + 35, 185, 29, i === 1 ? blue : t.text, { font: 'num' });
    });
    coverageBar(cv, t, 1166, top + h - 122, 392, 'RPM coverage', r ? r.coverageMs : 0, a ? a.durationMs : 0);
    const time = (key) => gearStats[key] ? amount(gearStats[key].durationMs / 1000) : '--';
    label(cv, 'P ' + time('P') + ' / N ' + time('N') + ' s', 1166, top + h - 76, 392, 17, t.dim);
    const unknown = a ? Object.keys(gearStats).filter((key) => !names.includes(key) && !['P', 'N', 'NP'].includes(key))
        .reduce((total, key) => total + (gearStats[key] && gearStats[key].durationMs || 0), 0) : null;
    label(cv, 'N/P ' + time('NP') + ' / Unknown ' + (unknown === null ? '--' : amount(unknown / 1000)) + ' s', 1166, top + h - 44, 392, 17, t.dim);
    label(cv, 'Shifts count forward-gear changes only.', 1166, top + h - 13, 392, 16, t.dim);
}
function history(cv, t, vm) {
    const top = vm.contentTop, h = vm.contentBottom - top;
    if (!vm.rows.length) {
        empty(cv, t, 24, top, 1552, h, 'No saved trips', 'Ended trips appear here.');
        return;
    }
    const rowHeight = (h - 30) / 4;
    vm.rows.forEach(({ trip: s, action, checked, status }, i) => {
        const x = 24, y = top + i * (rowHeight + 10), w = 1552;
        panel(cv, t, x, y, w, rowHeight);
        if (checked) cv.strokeRoundRect(x, y, w, rowHeight, 8, 2, blue);
        target(cv, vm, action, x, y, w, rowHeight);
        const titleY = y + rowHeight * 0.43, detailY = y + rowHeight * 0.75;
        const date = action.label === V.date(s.startedAt) ? '' : V.date(s.startedAt);
        const detail = [date, status, s.favorite ? 'Favorite' : ''].filter(Boolean).join('  /  ');
        label(cv, action.label, x + 22, detail ? titleY : y + rowHeight / 2 + 9, 725, 27,
            action.disabled ? t.dim : t.text, { font: 'bold' });
        if (detail) label(cv, detail, x + 22, detailY, 725, 18, t.dim);
        const distanceMs = V.distanceCoverage(s);
        label(cv, (distanceMs ? amount(s.stats.distanceMiles) + ' mi' : '-- mi') + '  /  ' + V.duration(s.stats.durationMs),
            RIGHT - 74, titleY, 655, 26, t.text, { align: 'right', font: 'num' });
        label(cv, V.distanceSource(s) + '  /  ' + V.coverage(distanceMs, s.stats.durationMs),
            RIGHT - 74, detailY, 655, 17, t.dim, { align: 'right' });
        if (!cv.own) return;
        const cx = RIGHT - 33, cy = y + rowHeight / 2;
        if (!vm.selection) {
            cv.line(cx - 5, cy - 8, cx + 3, cy, 2.5, t.dim);
            cv.line(cx + 3, cy, cx - 5, cy + 8, 2.5, t.dim);
        } else if (!action.disabled) {
            cv.strokeRoundRect(cx - 10, cy - 10, 20, 20, 4, 2, checked ? blue : t.dim);
            if (checked) {
                cv.line(cx - 5, cy, cx - 1, cy + 4, 2.5, blue);
                cv.line(cx - 1, cy + 4, cx + 6, cy - 5, 2.5, blue);
            }
        }
    });
}
function records(cv, t, vm) {
    const top = vm.contentTop, width = 768, height = (vm.contentBottom - top - 14) / 2;
    vm.rows.forEach(({ record, action }, i) => {
        const x = 24 + (i % 2) * 784, y = top + Math.floor(i / 2) * (height + 14);
        const trip = record.trip;
        panel(cv, t, x, y, width, height);
        target(cv, vm, action, x, y, width, height);
        label(cv, record.label, x + 20, y + 32, width - 40, 23, t.text, { font: 'bold' });
        label(cv, trip ? V.number(record.value, record.unit) : 'Unavailable',
            x + 20, y + 80, width - 40, 37, trip ? blue : t.dim, { font: trip ? 'num' : 'label' });
        if (trip) {
            const title = V.tripTitle(trip), date = V.date(trip.startedAt);
            label(cv, title === date ? date : title + '  /  ' + date, x + 20, y + 111, width - 40, 20, t.text);
            label(cv, 'Coverage ' + V.coverage(record.coverageMs, record.durationMs) + '  /  ' +
                V.duration(record.coverageMs) + ' of ' + V.duration(record.durationMs),
                x + 20, y + height - 34, width - 40, 17, t.dim);
        }
        label(cv, record.detail, x + 20, y + height - 12, width - 40, 16, t.dim);
    });
}
function edit(cv, t, vm) {
    const d = vm.draft, value = d[d.field], limit = d.field === 'name' ? 48 : 160;
    const top = vm.contentTop, h = vm.contentBottom - top;
    const start = Math.max(0, d.caret - 35);
    const visible = (start ? '...' : '') + value.slice(start, d.caret) + '|' + value.slice(d.caret, d.caret + 35);
    panel(cv, t, 24, top, 1552, 78);
    label(cv, visible, 46, top + 47, 1332, 29, t.text, { font: 'bold' });
    label(cv, value.length + ' / ' + limit, RIGHT - 24, top + 46, 153, 20, t.dim, { align: 'right' });
    const cols = 11, rows = Math.ceil(vm.keys.length / cols), width = (1552 - (cols - 1) * 10) / cols;
    const height = (h - 90 - (rows - 1) * 9) / rows;
    vm.keys.forEach((item, i) => button(cv, t, vm, item, 24 + i % cols * (width + 10),
        top + 90 + Math.floor(i / cols) * (height + 9), width, height));
}
function modal(cv, t, vm, headerTop, bottom) {
    const x = 350, y = (headerTop + bottom - 200) / 2, w = 900;
    cv.fillRect(0, headerTop, W, bottom - headerTop + 10, '#000000b8');
    cv.targets = [];
    panel(cv, t, x, y, w, 200);
    label(cv, vm.modal.title, x + 24, y + 53, 520, 29, t.text, { font: 'bold' });
    vm.modal.actions.forEach((item, i) => button(cv, t, vm, item, x + w - 328 + i * 154, y + 21, 140, 52));
    label(cv, vm.modal.message, x + 24, y + 119, w - 48, 26, t.text);
    label(cv, vm.toast || vm.modal.detail, x + 24, y + 162, w - 48, 20, vm.toast ? t.warn : t.dim);
}

const drawPage = { trip, elevation, fuel, gears, history, records, edit };
function draw(ctx, vm) {
    const cv = ctx.canvas(W, H), t = ctx.theme();
    cv.clear(t.bg);
    const badges = vm.demo ? [{ text: 'DEMO', color: blue }] : vm.recording ? [{ text: 'REC', color: red }] : [];
    G.frame(cv, t, vm.tabs, vm.selectedTab, badges);
    const full = cv.chrome && cv.place && cv.place.full;
    const extra = cv.own ? cv.extra || 0 : 0;
    const oy = full && extra && cv.place.oyTop !== undefined ? cv.place.oyTop : full ? cv.place.oy : 0;
    const top = full ? (FULL.headH - oy) / cv.place.scale + 10 : G.TOP;
    const bar = cv.own ? 0 : FULL.barH;
    const bottom = full ? Math.min(H + extra, (cv.place.h - bar - oy) / cv.place.scale) - 10 : H - 10;
    toolbar(cv, t, vm, top);
    drawPage[vm.page](cv, t, Object.assign({}, vm, { contentTop: top + 66, contentBottom: bottom }));
    if (vm.modal) modal(cv, t, vm, top, bottom);
    return cv;
}
module.exports = { draw };

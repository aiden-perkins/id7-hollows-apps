'use strict';
const { Canvas } = require('./kit/canvas');
const finite = (v) => Number.isFinite(v);
function number(v, unit) { return finite(v) ? v.toFixed(3) + (unit ? ' ' + unit : '') : 'Unavailable'; }
function date(at) {
    if (!at) return 'Unknown';
    const d = new Date(at), h = d.getHours(), pad = (v) => String(v).padStart(2, '0');
    return (h % 12 || 12) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + (h >= 12 ? ' PM ' : ' AM ') +
        (d.getMonth() + 1) + '-' + d.getDate() + '-' + d.getFullYear();
}
function coverage(ms, duration) { return duration > 0 ? number(ms / duration * 100, '%') : 'No observed interval yet'; }
function mpg(miles, gallons, covered) {
    return !covered ? 'Unavailable' : gallons > 0 ? number(miles / gallons, 'US MPG') : miles > 0 ? 'Coasting / zero matched fuel' : 'Undefined (zero matched distance and fuel)';
}
function totals(s) {
    const t = s.stats;
    return [
        'Recorded time ' + number(t.durationMs / 1000, 's') + ' | Known missing wall interval ' + number(s.missingWallMs / 1000, 's'),
        'Observed distance ' + (t.speedMs ? number(t.distanceMiles, 'mi') : 'Unavailable') + ' | Moving time ' + (t.speedMs ? number(t.movingMs / 1000, 's') : 'Unavailable'),
        'Average speed ' + (t.speedMs && t.durationMs ? number(t.distanceMiles * 3600000 / t.durationMs, 'mph') : 'Unavailable') +
            ' (partial if speed coverage incomplete) | Moving average ' + (t.movingMs ? number(t.movingMiles * 3600000 / t.movingMs, 'mph') : 'Unavailable'),
        'Top speed ' + number(t.topSpeed, 'mph') + ' | Fuel ' + (t.fuelMs ? number(t.fuelGallons, 'US gal') : 'Unavailable') +
            ' | Average ' + mpg(t.matchedMiles, t.matchedGallons, t.matchedMs),
        'Coverage: speed ' + coverage(t.speedMs, t.durationMs) + ' | fuel ' + coverage(t.fuelMs, t.durationMs) +
            ' | altitude ' + coverage(t.altitude.coverageMs, t.durationMs) + ' | coordinates ' + coverage(t.coordinateMs, t.durationMs) + ' | matched distance/fuel ' + coverage(t.matchedMs, t.durationMs),
    ].join('\n');
}
function project(row) {
    return { elapsedMs: row.elapsedMs, recordedMs: row.recordedMs, wallAt: row.wallAt, segment: row.segment,
        distance: finite(row.distanceMiles) ? row.distanceMiles : null,
        speed: row.values.speed.state === 'live' && finite(row.values.speed.value) ? row.values.speed.value : null,
        altitude: row.values.gps.state === 'live' && finite(row.values.gps.altitudeFt) ? row.values.gps.altitudeFt : null,
        mpg: finite(row.mpg) ? row.mpg : null, gaps: {} };
}
class Projection {
    constructor() { this.points = []; this.lastElapsed = -1; this.lastRow = null; }
    add(row) {
        if (row.elapsedMs <= this.lastElapsed) return;
        this.lastElapsed = row.elapsedMs;
        const point = project(row);
        if (this.lastRow && (this.lastRow.segment !== row.segment || row.recordedMs - this.lastRow.recordedMs > 6000)) {
            ['speed', 'altitude', 'mpg', 'distance'].forEach((key) => { point.gaps[key] = true; });
        }
        this.lastRow = { segment: row.segment, recordedMs: row.recordedMs };
        this.points.push(point);
        if (this.points.length > 2048) {
            const next = [];
            for (let i = 0; i < this.points.length; i += 2) {
                const a = this.points[i], b = this.points[i + 1];
                if (!b) { next.push(a); continue; }
                const p = Object.assign({}, b, { gaps: Object.assign({}, b.gaps) });
                ['speed', 'altitude', 'mpg', 'distance'].forEach((key) => {
                    if (a[key] === null || b[key] === null || a.gaps[key] || b.gaps[key] || a.segment !== b.segment) p.gaps[key] = true;
                });
                next.push(p);
            }
            this.points = next;
        }
    }
}
async function load(storage, id, extra) {
    const projection = new Projection();
    await storage.samples(id, (row) => projection.add(row));
    (extra || []).forEach((row) => projection.add(row));
    return projection;
}
const unit = (metric) => metric === 'speed' ? 'mph' : metric === 'altitude' ? 'ft' : 'US MPG';
function windowPoints(projection, config) {
    const points = projection ? projection.points : [], last = points[points.length - 1];
    const end = last ? last.elapsedMs : 0, start = config.zoomSeconds ? Math.max(0, end - config.zoomSeconds * 1000) : 0;
    return points.filter((p) => p.elapsedMs >= start);
}
function graph(projection, config, title, smoothing) {
    const cv = new Canvas(900, 310).clear('#10151d'), points = windowPoints(projection, config);
    const key = config.metric, xkey = config.axis === 'distance' ? 'distance' : 'elapsedMs';
    const valid = points.filter((p) => finite(p[key]) && finite(p[xkey]) && !p.gaps[key] && !(config.axis === 'distance' && p.gaps.distance));
    cv.text(title.slice(0, 55), 14, 12, 20, '#f0f4fa');
    cv.text(key + ' (' + unit(key) + ') / ' + (config.axis === 'distance' ? 'observed distance (mi)' : 'elapsed timeline (min)') +
        (smoothing ? ' | display smoothing' : ''), 14, 40, 16, '#a9b5c7');
    if (!valid.length) {
        cv.text(key === 'altitude' ? 'No valid altitude samples in this range' :
            key === 'mpg' ? 'Unavailable: validated matched fuel consumption required' : 'Unavailable: validated speed required', 20, 140, 19, '#a9b5c7');
        if (config.axis === 'distance') cv.text('Distance alignment also requires valid speed intervals', 20, 175, 17, '#a9b5c7');
        return cv;
    }
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    valid.forEach((p) => { xmin = Math.min(xmin, p[xkey]); xmax = Math.max(xmax, p[xkey]); ymin = Math.min(ymin, p[key]); ymax = Math.max(ymax, p[key]); });
    if (xmin === xmax) xmax = xmin + (xkey === 'distance' ? 1 : 60000);
    if (ymin === ymax) { ymin -= 0.5; ymax += 0.5; }
    cv.line(100, 80, 100, 250, 1, '#6a778c'); cv.line(100, 250, 875, 250, 1, '#6a778c');
    cv.text(ymax.toFixed(3), 4, 78, 15, '#a9b5c7'); cv.text(ymin.toFixed(3), 4, 230, 15, '#a9b5c7');
    const divisor = xkey === 'distance' ? 1 : 60000;
    cv.text((xmin / divisor).toFixed(3), 100, 270, 15, '#a9b5c7');
    cv.text((xmax / divisor).toFixed(3), 770, 270, 15, '#a9b5c7');
    let previous = null, smooth = null;
    points.forEach((p) => {
        if (!finite(p[key]) || !finite(p[xkey]) || p.gaps[key] || config.axis === 'distance' && p.gaps.distance) { previous = null; smooth = null; return; }
        if (previous && p.segment !== previous.segment) { previous = null; smooth = null; }
        smooth = smoothing && smooth !== null ? (smooth + p[key]) / 2 : p[key];
        const x = 100 + (p[xkey] - xmin) / (xmax - xmin) * 775, y = 250 - (smooth - ymin) / (ymax - ymin) * 170;
        if (previous) cv.line(previous.x, previous.y, x, y, 2, '#58c8ff');
        else cv.line(x - 1, y, x + 1, y, 2, '#58c8ff');
        previous = { x, y, segment: p.segment, elapsedMs: p.elapsedMs };
    });
    const cursor = points[Math.round(Math.max(0, Math.min(100, config.cursor)) / 100 * Math.max(0, points.length - 1))];
    if (cursor && finite(cursor[xkey])) {
        const x = 100 + (cursor[xkey] - xmin) / (xmax - xmin) * 775;
        if (x >= 100 && x <= 875) cv.line(x, 80, x, 250, 1, '#ffbf69');
    }
    return cv;
}
function cursor(projection, config) {
    const points = windowPoints(projection, config);
    const p = points[Math.round(config.cursor / 100 * Math.max(0, points.length - 1))];
    if (!p) return 'No recorded point available';
    return date(p.wallAt) + ' | elapsed ' + number(p.elapsedMs / 1000, 's') + ' | distance ' + number(p.distance, 'mi') +
        ' | ' + config.metric + ' ' + number(p[config.metric], unit(config.metric)) + ' | recorded sample, before display smoothing';
}
function gears(s) {
    const t = s.stats;
    const lines = Object.keys(t.gears).map((gear) => {
        const b = t.gears[gear];
        return (gear === 'unknown' ? 'Unknown gear' : gear === 'NP' ? 'N/P unresolved' : gear) + ': ' +
            number(b.durationMs / 1000, 's') + ' | distance ' + (b.distanceMs ? number(b.distanceMiles, 'mi') : 'Unavailable') +
            ' | forward shifts ' + b.shifts + ' | fuel ' + (b.fuelMs ? number(b.fuelGallons, 'US gal') : 'Unavailable') +
            ' | ' + mpg(b.matchedMiles, b.matchedGallons, b.matchedMs) + ' | speed coverage ' + coverage(b.distanceMs, b.durationMs) + ' / fuel coverage ' + coverage(b.fuelMs, b.durationMs) + ' / matched coverage ' + coverage(b.matchedMs, b.durationMs);
    });
    lines.push('RPM min ' + number(t.rpm.min, 'RPM') + ' / max ' + number(t.rpm.max, 'RPM') +
        ' / weighted mean ' + (t.rpm.coverageMs ? number(t.rpm.rpmMs / t.rpm.coverageMs, 'RPM') : 'Unavailable') +
        ' / revolutions ' + (t.rpm.coverageMs ? number(t.rpm.rpmMs / 60000, 'rev') : 'Unavailable') +
        ' | RPM coverage ' + coverage(t.rpm.coverageMs, t.durationMs));
    return lines.join('\n');
}
function fuel(s) {
    const t = s.stats, bands = s.policy.speedBands;
    return 'Fuel consumption: ' + (t.fuelMs ? number(t.fuelGallons, 'US gal') : 'Unavailable; no validated consumption source') +
        ' | ' + mpg(t.matchedMiles, t.matchedGallons, t.matchedMs) +
        '\nRolling MPG window: 60 seconds of fully matched intervals; tank level is never used.\n' +
        t.bands.map((b, i) => {
            const name = i === t.bands.length - 1 ? 'Unknown speed' : i === bands.length ? bands[bands.length - 1] + '+ mph' :
                (i ? bands[i - 1] : 0) + '-' + bands[i] + ' mph';
            return name + ': ' + number(b.durationMs / 1000, 's') + ' | distance ' + (b.distanceMs ? number(b.distanceMiles, 'mi') : 'Unavailable') +
                ' | fuel ' + (b.fuelMs ? number(b.fuelGallons, 'US gal') : 'Unavailable') + ' | ' + mpg(b.matchedMiles, b.matchedGallons, b.matchedMs) + ' | speed coverage ' + coverage(b.distanceMs, b.durationMs) + ' / fuel coverage ' + coverage(b.fuelMs, b.durationMs) + ' / matched coverage ' + coverage(b.matchedMs, b.durationMs);
        }).join('\n') + '\nFuel coverage ' + coverage(t.fuelMs, t.durationMs);
}
function elevation(s) {
    const a = s.stats.altitude;
    return 'First ' + number(a.start, 'ft') + ' / last ' + number(a.end, 'ft') +
        ' / net ' + (a.start !== null && a.end !== null ? number(a.end - a.start, 'ft') : 'Unavailable') +
        '\nMinimum ' + number(a.min, 'ft') + ' / maximum ' + number(a.max, 'ft') +
        '\nEstimated ascent ' + (a.coverageMs ? number(a.ascent, 'ft') : 'Unavailable') + ' / descent ' + (a.coverageMs ? number(a.descent, 'ft') : 'Unavailable') +
        ' | deadband ' + number(s.policy.altitudeThresholdFt, 'ft') +
        '\nLast interval vertical speed estimate ' + number(a.verticalFpm, 'ft/min') +
        ' | Coverage ' + coverage(a.coverageMs, s.stats.durationMs) +
        '\nGPS height reference/accuracy unconfirmed. Deadband suppresses small changes, not all GPS noise.';
}
module.exports = { number, date, coverage, totals, Projection, load, graph, cursor, gears, fuel, elevation };

'use strict';
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

function selectedPoint(projection, config) {
    const points = windowPoints(projection, config);
    if (!points.length) return null;
    if (config.cursorAt === null || config.cursorAt === undefined) return points[points.length - 1];
    return points.reduce((best, point) => Math.abs(point.elapsedMs - config.cursorAt) < Math.abs(best.elapsedMs - config.cursorAt) ? point : best, points[0]);
}
function moveCursor(projection, config, steps) {
    const points = windowPoints(projection, config), point = selectedPoint(projection, config);
    if (!point) return;
    const index = points.indexOf(point);
    config.cursorAt = points[Math.max(0, Math.min(points.length - 1, index + steps))].elapsedMs;
}
function duration(ms) {
    if (!finite(ms)) return '--:--:--';
    const seconds = Math.floor(ms / 1000), h = Math.floor(seconds / 3600);
    return String(h).padStart(2, '0') + ':' + String(Math.floor(seconds / 60) % 60).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}
module.exports = { number, date, coverage, mpg, duration, Projection, load, unit, windowPoints, selectedPoint, moveCursor };

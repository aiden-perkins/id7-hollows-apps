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
function distanceCoverage(summary) {
    if (!summary || !summary.stats || !summary.policy) return 0;
    const ms = summary.policy.calculationVersion === 1 ? summary.stats.speedMs : summary.stats.distanceMs;
    return finite(ms) && ms > 0 ? ms : 0;
}
function movingDistanceCoverage(summary) {
    if (!summary || !summary.stats || !summary.policy) return 0;
    const ms = summary.policy.calculationVersion === 1 ? summary.stats.movingMs : summary.stats.movingDistanceMs;
    return finite(ms) && ms > 0 ? ms : 0;
}
function distanceSource(summary) {
    return summary && summary.policy && summary.policy.calculationVersion === 1 ?
        'Legacy vehicle-speed integration' : 'GPS / WGS84 degrees assumed / unverified on-car';
}
function records(history) {
    const trips = (history || []).filter((s) => s && !s.demo && s.status === 'finished' && s.stats && s.policy &&
        [1, 2].includes(s.policy.calculationVersion) && finite(s.stats.durationMs) && s.stats.durationMs > 0)
        .slice().sort((a, b) => a.startedAt - b.startedAt || String(a.id).localeCompare(String(b.id)));
    const complete = (s) => !s.missingWallMs && !(s.gaps && s.gaps.length) && !s.interruptionReason &&
        !/interrupt|recover/i.test(s.finishReason || '');
    const definitions = [
        { id: 'topSpeed', label: 'Top vehicle speed', unit: 'mph', high: true,
            value: (s) => s.stats.topSpeed, covered: (s) => s.stats.speedMs,
            detail: () => 'Vehicle speed / raw 64 km/h units converted to mph' },
        { id: 'highestElevation', label: 'Highest elevation', unit: 'ft', high: true,
            value: (s) => s.stats.altitude && s.stats.altitude.max, covered: (s) => s.stats.altitude && s.stats.altitude.coverageMs,
            detail: () => 'GPS height / reference, accuracy and response unverified' },
        { id: 'lowestElevation', label: 'Lowest elevation', unit: 'ft', high: false,
            value: (s) => s.stats.altitude && s.stats.altitude.min, covered: (s) => s.stats.altitude && s.stats.altitude.coverageMs,
            detail: () => 'GPS height / reference, accuracy and response unverified' },
        { id: 'longestDistance', label: 'Longest observed distance', unit: 'mi', high: true, full: true,
            value: (s) => s.stats.distanceMiles, covered: distanceCoverage, detail: distanceSource },
        { id: 'shortestDistance', label: 'Shortest observed distance', unit: 'mi', high: false, full: true,
            value: (s) => s.stats.distanceMiles, covered: distanceCoverage, detail: distanceSource },
        { id: 'bestMpg', label: 'Best trip-average MPG', unit: 'US MPG', high: true, full: true, fuel: true,
            value: (s) => finite(s.stats.matchedGallons) && s.stats.matchedGallons > 0 && finite(s.stats.matchedMiles) ?
                s.stats.matchedMiles / s.stats.matchedGallons : null,
            covered: (s) => s.stats.matchedMs, detail: (s) => 'Matched validated consumption / ' + distanceSource(s) },
        { id: 'worstMpg', label: 'Worst trip-average MPG', unit: 'US MPG', high: false, full: true, fuel: true,
            value: (s) => finite(s.stats.matchedGallons) && s.stats.matchedGallons > 0 && finite(s.stats.matchedMiles) ?
                s.stats.matchedMiles / s.stats.matchedGallons : null,
            covered: (s) => s.stats.matchedMs, detail: (s) => 'Matched validated consumption / ' + distanceSource(s) },
    ];
    return definitions.map((d) => {
        let winner = null;
        trips.forEach((s) => {
            if (d.full && !complete(s) || d.fuel && (!s.policy.capabilities || s.policy.capabilities.fuel !== true)) return;
            const value = d.value(s), covered = d.covered(s), missing = finite(s.missingWallMs) ? Math.max(0, s.missingWallMs) : 0;
            const durationMs = s.stats.durationMs + missing;
            if (!finite(value) || d.unit !== 'ft' && value < 0 || !finite(covered) || covered < durationMs * 0.95) return;
            if (!winner || (d.high ? value > winner.value : value < winner.value)) {
                winner = { id: d.id, label: d.label, value, unit: d.unit, trip: s, coverageMs: covered, durationMs, detail: d.detail(s) };
            }
        });
        return winner || { id: d.id, label: d.label, value: null, unit: d.unit, trip: null, coverageMs: 0, durationMs: 0,
            detail: d.fuel ? 'No eligible trip with validated consumption and 95% matched coverage' :
                'Requires a finished real trip with at least 95% relevant coverage' };
    });
}
function project(row) {
    return { elapsedMs: row.elapsedMs, recordedMs: row.recordedMs, wallAt: row.wallAt, segment: row.segment,
        distance: finite(row.distanceMiles) ? row.distanceMiles : null,
        speed: row.values.speed.state === 'live' && finite(row.values.speed.value) ? row.values.speed.value : null,
        altitude: row.values.gps.state === 'live' && finite(row.values.gps.altitudeFt) ? row.values.gps.altitudeFt : null,
        mpg: finite(row.mpg) ? row.mpg : null, gaps: {} };
}
class Projection {
    constructor() {
        this.points = []; this.distancePoints = []; this.lastElapsed = -1; this.lastRow = null;
        this.lastDistance = null; this.distanceGap = true; this.distanceMetricGaps = {};
    }
    add(row) {
        if (row.elapsedMs <= this.lastElapsed) return;
        this.lastElapsed = row.elapsedMs;
        const point = project(row);
        if (this.lastRow && (this.lastRow.segment !== row.segment || row.recordedMs - this.lastRow.recordedMs > 6000)) {
            ['speed', 'altitude', 'mpg', 'distance'].forEach((key) => { point.gaps[key] = true; });
        }
        this.lastRow = { segment: row.segment, recordedMs: row.recordedMs };
        ['speed', 'altitude', 'mpg'].forEach((key) => {
            if (point[key] === null || point.gaps[key]) this.distanceMetricGaps[key] = true;
        });
        if (point.distance !== null) {
            const spans = row.distanceIntervals && row.distanceIntervals.length ? row.distanceIntervals : null;
            const p = Object.assign({}, point, { gaps: Object.assign({}, point.gaps), breaks: Object.assign({}, this.distanceMetricGaps) });
            p.gaps.distance = false;
            p.breaks.distance = !this.lastDistance || this.lastDistance.segment !== row.segment ||
                (spans ? this.lastDistance.endMs !== spans[0].startMs ||
                    spans.some((span, i) => i && spans[i - 1].endMs !== span.startMs) : this.distanceGap);
            this.distancePoints.push(p);
            this.lastDistance = { segment: row.segment, endMs: spans ? spans[spans.length - 1].endMs : null };
            this.distanceGap = false; this.distanceMetricGaps = {};
            if (this.distancePoints.length > 2048) {
                const next = [];
                for (let i = 0; i < this.distancePoints.length; i += 2) {
                    const a = this.distancePoints[i], b = this.distancePoints[i + 1];
                    if (!b) { next.push(a); continue; }
                    const combined = Object.assign({}, b, { breaks: Object.assign({}, b.breaks) });
                    ['speed', 'altitude', 'mpg', 'distance'].forEach((key) => {
                        if (a[key] === null || b[key] === null || a.gaps[key] || b.gaps[key] ||
                            a.breaks[key] || b.breaks[key] || a.segment !== b.segment) combined.breaks[key] = true;
                    });
                    next.push(combined);
                }
                this.distancePoints = next;
            }
        } else this.distanceGap = true;
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
    const points = projection ? config.axis === 'distance' ? projection.distancePoints : projection.points : [];
    const last = projection && projection.points[projection.points.length - 1];
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
module.exports = { number, date, coverage, mpg, duration, distanceCoverage, movingDistanceCoverage, distanceSource, records,
    Projection, load, unit, windowPoints, selectedPoint, moveCursor };

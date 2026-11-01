'use strict';

function bucket() { return { durationMs: 0, distanceMiles: 0, distanceMs: 0, fuelGallons: 0, fuelMs: 0, matchedMiles: 0, matchedGallons: 0, matchedMs: 0, shifts: 0 }; }
function create(policy) {
    const stats = { durationMs: 0, samples: 0, distanceMiles: 0, speedMs: 0, movingMs: 0, movingMiles: 0, topSpeed: null,
        fuelGallons: 0, fuelMs: 0, matchedMiles: 0, matchedGallons: 0, matchedMs: 0, coordinateMs: 0,
        rpm: { min: null, max: null, rpmMs: 0, coverageMs: 0 },
        altitude: { start: null, end: null, min: null, max: null, ascent: 0, descent: 0, coverageMs: 0, anchor: null, verticalFpm: null },
        gears: { unknown: bucket() }, bands: policy.speedBands.map(() => bucket()).concat([bucket(), bucket()]) };
    if (policy.calculationVersion === 2) { stats.distanceMs = 0; stats.movingDistanceMs = 0; }
    return stats;
}
const live = (v) => v && v.state === 'live' && Number.isFinite(v.value);
function paired(a, b) { return live(a) && live(b) && a.epoch === b.epoch; }
function extrema(stats, value) {
    stats.min = stats.min === null ? value : Math.min(stats.min, value);
    stats.max = stats.max === null ? value : Math.max(stats.max, value);
}
function acceptLegacy(stats, previous, row, policy) {
    const values = row.values, old = previous && previous.values;
    stats.samples++; stats.durationMs = row.recordedMs;
    const altitude = values.gps.state === 'live' && Number.isFinite(values.gps.altitudeFt) ? values.gps.altitudeFt : null;
    if (altitude !== null) {
        const a = stats.altitude; if (a.start === null) a.start = altitude;
        a.end = altitude; extrema(a, altitude);
    }
    if (live(values.speed)) stats.topSpeed = stats.topSpeed === null ? values.speed.value : Math.max(stats.topSpeed, values.speed.value);
    if (live(values.rpm)) extrema(stats.rpm, values.rpm.value);
    const dt = previous ? row.recordedMs - previous.recordedMs : row.recordedMs;
    const continuous = !!previous && previous.segment === row.segment && dt > 0 && dt <= policy.maxIntervalMs;
    stats.altitude.verticalFpm = null;
    if (!continuous) {
        stats.altitude.anchor = altitude;
        if (dt > 0) { stats.gears.unknown.durationMs += dt; stats.bands[stats.bands.length - 1].durationMs += dt; }
        return { distance: null, fuel: null, dt, continuous: false };
    }
    let distance = null, fuel = null;
    const speedOK = paired(old.speed, values.speed);
    const gearOK = old.gear.state === 'live' && values.gear.state === 'live' && old.gear.epoch === values.gear.epoch;
    // Gear duration belongs to the previous observed state; shifts occur at the new sample.
    const gear = gearOK ? old.gear.value : 'unknown';
    if (!stats.gears[gear]) stats.gears[gear] = bucket();
    const target = stats.gears[gear]; target.durationMs += dt;
    if (gearOK && old.gear.value !== values.gear.value && /^[1-9]$/.test(old.gear.value) && /^[1-9]$/.test(values.gear.value)) {
        if (!stats.gears[values.gear.value]) stats.gears[values.gear.value] = bucket();
        stats.gears[values.gear.value].shifts++;
    }
    let band = stats.bands[stats.bands.length - 1];
    if (speedOK) {
        const mph = (old.speed.value + values.speed.value) / 2;
        distance = mph * dt / 3600000;
        stats.distanceMiles += distance; stats.speedMs += dt;
        const a = old.speed.value, b = values.speed.value, threshold = policy.movingMph;
        if (a > threshold && b > threshold) { stats.movingMs += dt; stats.movingMiles += distance; }
        else if (a > threshold || b > threshold) {
            const fraction = (threshold - a) / (b - a), movingDt = dt * (b > threshold ? 1 - fraction : fraction);
            stats.movingMs += movingDt;
            stats.movingMiles += (threshold + (b > threshold ? b : a)) / 2 * movingDt / 3600000;
        }
        const index = policy.speedBands.findIndex((limit) => mph < limit);
        band = stats.bands[index < 0 ? stats.bands.length - 2 : index];
        target.distanceMiles += distance; target.distanceMs += dt;
        band.distanceMiles += distance; band.distanceMs += dt;
    }
    band.durationMs += dt;
    if (paired(old.fuel, values.fuel) && values.fuel.value >= old.fuel.value) {
        fuel = values.fuel.value - old.fuel.value; stats.fuelGallons += fuel; stats.fuelMs += dt;
        target.fuelGallons += fuel; target.fuelMs += dt; band.fuelGallons += fuel; band.fuelMs += dt;
        if (distance !== null) {
            stats.matchedMiles += distance; stats.matchedGallons += fuel; stats.matchedMs += dt;
            [target, band].forEach((b) => { b.matchedMiles += distance; b.matchedGallons += fuel; b.matchedMs += dt; });
        }
    }
    if (paired(old.rpm, values.rpm)) {
        stats.rpm.rpmMs += (old.rpm.value + values.rpm.value) / 2 * dt; stats.rpm.coverageMs += dt;
    }
    const oldGPS = old.gps, gps = values.gps;
    if (oldGPS.state === 'live' && gps.state === 'live' && oldGPS.epoch === gps.epoch) {
        if (oldGPS.coordinates && gps.coordinates && oldGPS.coordinateEpoch === gps.coordinateEpoch) stats.coordinateMs += dt;
        if (Number.isFinite(oldGPS.altitudeFt) && altitude !== null && oldGPS.heightEpoch === gps.heightEpoch) {
            const a = stats.altitude; a.coverageMs += dt;
            if (a.anchor === null) a.anchor = oldGPS.altitudeFt;
            const delta = altitude - a.anchor;
            if (Math.abs(delta) >= policy.altitudeThresholdFt) {
                if (delta > 0) a.ascent += delta; else a.descent -= delta;
                a.anchor = altitude;
            }
            a.verticalFpm = (altitude - oldGPS.altitudeFt) * 60000 / dt;
        } else stats.altitude.anchor = altitude;
    } else stats.altitude.anchor = altitude;
    return { distance, fuel, dt, continuous: true };
}
const gpsStates = new WeakMap();
function movingTime(a, b, dt, threshold) {
    if (a > threshold && b > threshold) return dt;
    if (a <= threshold && b <= threshold) return 0;
    const fraction = (threshold - a) / (b - a);
    return dt * (b > threshold ? 1 - fraction : fraction);
}
function geodesic(a, b) {
    const radians = Math.PI / 180, lat = (b.latitude - a.latitude) * radians;
    const lon = ((b.longitude - a.longitude + 540) % 360 - 180) * radians;
    const h = Math.sin(lat / 2) ** 2 + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(lon / 2) ** 2;
    return 3958.7613 * 2 * Math.atan2(Math.sqrt(Math.max(0, Math.min(1, h))), Math.sqrt(Math.max(0, 1 - h)));
}
function gpsDistance(stats, previous, row, policy, part, continuous) {
    let state = gpsStates.get(stats);
    if (!state || !continuous) {
        state = { anchor: null, lastId: null, parts: [], segmentStart: row.recordedMs, utcOffset: row.recordedMs - row.wallAt };
        gpsStates.set(stats, state);
    }
    if (part) state.parts.push(part);
    state.parts = state.parts.filter((p) => p.endMs >= row.recordedMs - policy.gpsMaxGapMs * 2);
    const gps = row.values.gps, intervals = [];
    if (gps.positionState !== 'live') { state.anchor = null; return intervals; }
    if (state.anchor && state.anchor.coordinateEpoch !== gps.coordinateEpoch) state.anchor = null;
    for (const fix of gps.fixes || []) {
        if (!Number.isInteger(fix.id) || state.lastId !== null && fix.id <= state.lastId) continue;
        const at = fix.utcMs + state.utcOffset, receivedAt = row.recordedMs - fix.ageMs, point = fix.coordinates;
        if (Number.isFinite(at) && at > row.recordedMs) break;
        state.lastId = fix.id;
        if (!Number.isFinite(at) || !Number.isFinite(receivedAt) || !Number.isFinite(fix.utcMs) || at < state.segmentStart ||
            fix.ageMs < 0 || fix.ageMs > policy.gpsMaxGapMs || fix.coordinateEpoch !== gps.coordinateEpoch ||
            !point || !Number.isFinite(point.latitude) || Math.abs(point.latitude) > 90 ||
            !Number.isFinite(point.longitude) || Math.abs(point.longitude) > 180) continue;
        const next = Object.assign({}, fix, { at, receivedAt }), anchor = state.anchor;
        state.anchor = next;
        if (!anchor || anchor.coordinateEpoch !== fix.coordinateEpoch) continue;
        const dt = at - anchor.at, sourceDt = fix.utcMs - anchor.utcMs, receiptDt = receivedAt - anchor.receivedAt;
        if (dt <= 0 || dt > policy.gpsMaxGapMs || sourceDt <= 0 || sourceDt > policy.gpsMaxGapMs || receiptDt <= 0 || receiptDt > policy.gpsMaxGapMs) continue;
        const spans = [], miles = geodesic(anchor.coordinates, point);
        let covered = 0, moving = 0, maxSpeed = 0, speedOK = true;
        state.parts.forEach((p) => {
            const start = Math.max(anchor.at, p.startMs), end = Math.min(at, p.endMs);
            if (end <= start) return;
            const duration = end - start, span = { part: p, startMs: start, endMs: end, durationMs: duration, movingMs: 0 };
            covered += duration; speedOK = speedOK && p.speedOK;
            if (p.speedOK) {
                const a = p.speedA + (p.speedB - p.speedA) * (start - p.startMs) / (p.endMs - p.startMs);
                const b = p.speedA + (p.speedB - p.speedA) * (end - p.startMs) / (p.endMs - p.startMs);
                span.movingMs = movingTime(a, b, duration, policy.movingMph); moving += span.movingMs;
                maxSpeed = Math.max(maxSpeed, a, b);
            }
            spans.push(span);
        });
        if (!speedOK || Math.abs(covered - dt) > 0.001) continue;
        const maxMiles = Math.min(policy.gpsMaxMph, maxSpeed + policy.gpsSpeedToleranceMph) * sourceDt / 3600000 + policy.gpsJumpSlackMeters / 1609.344;
        if (!Number.isFinite(miles) || miles > maxMiles) { state.anchor = null; continue; }
        // Vehicle speed supplies motion evidence only, never distance. Stationary drift is zeroed.
        const distance = moving > 0 ? miles : 0;
        stats.distanceMiles += distance; stats.distanceMs += dt;
        stats.movingMiles += distance; stats.movingDistanceMs += moving;
        let allocated = 0;
        const movingSpans = spans.filter((s) => s.movingMs > 0), lastMoving = movingSpans[movingSpans.length - 1];
        spans.forEach((s) => {
            const amount = s.movingMs > 0 ? s === lastMoving ? distance - allocated : distance * s.movingMs / moving : 0;
            allocated += amount;
            const gear = stats.gears[s.part.gear], band = stats.bands[s.part.band];
            [gear, band].forEach((b) => { b.distanceMiles += amount; b.distanceMs += s.durationMs; });
        });
        intervals.push({ startMs: anchor.at, endMs: at, sourceStartMs: anchor.utcMs, sourceEndMs: fix.utcMs,
            distanceMiles: distance, distanceMs: dt, movingDistanceMs: moving });
    }
    return intervals;
}
function acceptGPS(stats, previous, row, policy) {
    const values = row.values, old = previous && previous.values;
    stats.samples++; stats.durationMs = row.recordedMs;
    const altitude = values.gps.state === 'live' && Number.isFinite(values.gps.altitudeFt) ? values.gps.altitudeFt : null;
    if (altitude !== null) {
        const a = stats.altitude; if (a.start === null) a.start = altitude;
        a.end = altitude; extrema(a, altitude);
    }
    if (live(values.speed)) stats.topSpeed = stats.topSpeed === null ? values.speed.value : Math.max(stats.topSpeed, values.speed.value);
    if (live(values.rpm)) extrema(stats.rpm, values.rpm.value);
    const dt = previous ? row.recordedMs - previous.recordedMs : row.recordedMs;
    const continuous = !!previous && previous.segment === row.segment && dt > 0 && dt <= policy.maxIntervalMs;
    stats.altitude.verticalFpm = null;
    if (!continuous) {
        stats.altitude.anchor = altitude;
        if (dt > 0) { stats.gears.unknown.durationMs += dt; stats.bands[stats.bands.length - 1].durationMs += dt; }
        gpsDistance(stats, previous, row, policy, null, false);
        return { distance: null, fuel: null, dt, continuous: false, distanceMs: 0, distanceStartMs: null, distanceEndMs: null, distanceIntervals: [] };
    }
    const speedOK = paired(old.speed, values.speed);
    const gearOK = old.gear.state === 'live' && values.gear.state === 'live' && old.gear.epoch === values.gear.epoch && old.gear.source === values.gear.source;
    const gear = gearOK ? old.gear.value : 'unknown';
    if (!stats.gears[gear]) stats.gears[gear] = bucket();
    stats.gears[gear].durationMs += dt;
    if (gearOK && old.gear.value !== values.gear.value && /^([1-9]|10)$/.test(old.gear.value) && /^([1-9]|10)$/.test(values.gear.value)) {
        if (!stats.gears[values.gear.value]) stats.gears[values.gear.value] = bucket();
        stats.gears[values.gear.value].shifts++;
    }
    let band = stats.bands.length - 1;
    if (speedOK) {
        stats.speedMs += dt;
        stats.movingMs += movingTime(old.speed.value, values.speed.value, dt, policy.movingMph);
        const mph = (old.speed.value + values.speed.value) / 2, index = policy.speedBands.findIndex((limit) => mph < limit);
        band = index < 0 ? stats.bands.length - 2 : index;
    }
    stats.bands[band].durationMs += dt;
    if (paired(old.rpm, values.rpm)) {
        stats.rpm.rpmMs += (old.rpm.value + values.rpm.value) / 2 * dt; stats.rpm.coverageMs += dt;
    }
    const oldGPS = old.gps, gps = values.gps;
    if (oldGPS.state === 'live' && gps.state === 'live' && oldGPS.epoch === gps.epoch) {
        if (oldGPS.positionState === 'live' && gps.positionState === 'live' && oldGPS.coordinates && gps.coordinates && oldGPS.coordinateEpoch === gps.coordinateEpoch) stats.coordinateMs += dt;
        if (Number.isFinite(oldGPS.altitudeFt) && altitude !== null && oldGPS.heightEpoch === gps.heightEpoch) {
            const a = stats.altitude; a.coverageMs += dt;
            if (a.anchor === null) a.anchor = oldGPS.altitudeFt;
            const delta = altitude - a.anchor;
            if (Math.abs(delta) >= policy.altitudeThresholdFt) {
                if (delta > 0) a.ascent += delta; else a.descent -= delta;
                a.anchor = altitude;
            }
            a.verticalFpm = (altitude - oldGPS.altitudeFt) * 60000 / dt;
        } else stats.altitude.anchor = altitude;
    } else stats.altitude.anchor = altitude;
    const intervals = gpsDistance(stats, previous, row, policy, { startMs: previous.recordedMs, endMs: row.recordedMs,
        gear, band, speedOK, speedA: old.speed.value, speedB: values.speed.value }, true);
    return { distance: intervals.length ? intervals.reduce((sum, i) => sum + i.distanceMiles, 0) : null, fuel: null, dt, continuous: true,
        distanceMs: intervals.reduce((sum, i) => sum + i.distanceMs, 0),
        distanceStartMs: intervals.length ? intervals[0].startMs : null, distanceEndMs: intervals.length ? intervals[intervals.length - 1].endMs : null,
        distanceIntervals: intervals };
}
function accept(stats, previous, row, policy) {
    if (policy.calculationVersion === 1) return acceptLegacy(stats, previous, row, policy);
    if (policy.calculationVersion === 2) return acceptGPS(stats, previous, row, policy);
    throw new Error('Unsupported calculation policy');
}
function policy(settings) {
    return { calculationVersion: 2, sampleMs: settings.sampleMs, movingMph: 1,
        maxIntervalMs: Math.max(5000, settings.sampleMs * 3), altitudeThresholdFt: settings.altitudeThresholdFt,
        speedBands: settings.speedBands.slice(), rollingMpgSeconds: 60,
        gpsMaxGapMs: 5000, gpsMaxMph: 250, gpsSpeedToleranceMph: 25, gpsJumpSlackMeters: 15,
        distance: 'GPS-only antimeridian-safe spherical geodesic between unique advancing 2D/3D UTC fixes, assuming WGS84 degrees (not calibrated on-car); no speed-integrated fallback. Invalid/stale/backward UTC, provider changes and gaps over 5 seconds break continuity. Accuracy is not supplied.',
        distanceTiming: 'Coverage uses advancing UTC fix intervals mapped to monotonic recorded time by the segment-start wall-clock offset, assuming aligned UTC clocks; receipt and source gaps are independently bounded to 5 seconds. Polls do not establish sensor Hz or coverage. Continuous live vehicle speed is motion evidence only. All-stationary intervals count zero drift distance. Jump limits are rejection rules, not accuracy claims.',
        distanceAllocation: 'GPS pair distance is allocated over its observed app-sample overlaps in proportion to above-1-mph moving duration, never to stationary duration; gear and speed-band coverage uses those exact overlaps. This is temporal allocation, not a measured per-sample path. No per-sample fuel or MPG is inferred.',
        speedBandsRule: 'Each bounded app interval uses its trapezoidal-mean vehicle-speed band; unknown speed has its own bucket. GPS coverage/distance is allocated only after an accepted fix pair supports the interval.',
        gear: 'Previous valid connected state holds for each bounded interval; actual gearbox precedes explicit selector fallback. Count direct forward 1–10 changes only within one source/connection; gaps, source changes and P/R/N/NP do not count as shifts.',
        elevation: 'First/last accepted altitude; ascent/descent use a deadband anchor, reset at gaps. Vertical speed is an unsmoothed adjacent-sample estimate.',
        duration: 'Monotonic recorded duration includes stationary periods and in-process sample gaps; recovery downtime is separate.',
        capabilities: { speed: true, rpm: true, fuel: false, ignition: false, gps: true, gear: 'actual gearbox enum, explicit selector fallback; no guessed gears' } };
}
module.exports = { bucket, create, accept, policy };

'use strict';

function bucket() { return { durationMs: 0, distanceMiles: 0, distanceMs: 0, fuelGallons: 0, fuelMs: 0, matchedMiles: 0, matchedGallons: 0, matchedMs: 0, shifts: 0 }; }
function create(policy) {
    return { durationMs: 0, samples: 0, distanceMiles: 0, speedMs: 0, movingMs: 0, movingMiles: 0, topSpeed: null,
        fuelGallons: 0, fuelMs: 0, matchedMiles: 0, matchedGallons: 0, matchedMs: 0, coordinateMs: 0,
        rpm: { min: null, max: null, rpmMs: 0, coverageMs: 0 },
        altitude: { start: null, end: null, min: null, max: null, ascent: 0, descent: 0, coverageMs: 0, anchor: null, verticalFpm: null },
        gears: { unknown: bucket() }, bands: policy.speedBands.map(() => bucket()).concat([bucket(), bucket()]) };
}
const live = (v) => v && v.state === 'live' && Number.isFinite(v.value);
function paired(a, b) { return live(a) && live(b) && a.epoch === b.epoch; }
function extrema(stats, value) {
    stats.min = stats.min === null ? value : Math.min(stats.min, value);
    stats.max = stats.max === null ? value : Math.max(stats.max, value);
}
function accept(stats, previous, row, policy) {
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
function policy(settings) {
    return { calculationVersion: 1, sampleMs: settings.sampleMs, movingMph: 1,
        maxIntervalMs: Math.max(5000, settings.sampleMs * 3), altitudeThresholdFt: settings.altitudeThresholdFt,
        speedBands: settings.speedBands.slice(), rollingMpgSeconds: 60,
        distance: 'Trapezoidal integration of aligned validated vehicle speed only; GPS positions are not converted to distance.',
        speedBandsRule: 'Assign each bounded interval to its trapezoidal-mean-speed band; unknown speed has its own bucket.',
        gear: 'Previous valid state holds for each bounded interval. Count only direct forward-gear changes; gaps/P/R/N/NP do not count as shifts.',
        elevation: 'First/last accepted altitude; ascent/descent use a deadband anchor, reset at gaps. Vertical speed is an unsmoothed adjacent-sample estimate.',
        duration: 'Monotonic recorded duration includes stationary periods and in-process sample gaps; recovery downtime is separate.',
        capabilities: { speed: false, rpm: false, fuel: false, ignition: false, gps: true, gear: 'recognized enum when delivered' } };
}
module.exports = { bucket, create, accept, policy };

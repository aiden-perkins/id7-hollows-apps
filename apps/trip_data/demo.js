'use strict';
const Sim = require('./kit/sim');
const C = require('./calculations');
const { GALLON_LITRES } = require('./fuel');
const { Projection } = require('./view');
const DEMO_LATITUDE = 47, METRES_PER_LONGITUDE_DEGREE = 111320 * Math.cos(DEMO_LATITUDE * Math.PI / 180);

// Like upstream's demo runs, these trips exist only in memory, never in Storage.
class Demo {
    constructor(settings) {
        this.sim = new Sim();
        this.startedAt = Math.floor(Date.now() / 1000) * 1000 - 180000;
        this.sim.t0 = this.startedAt;
        this.at = this.startedAt;
        this.longitude = 8; this.previous = null;
        this.projection = new Projection();
        this.trip = { id: 'demo-current', demo: true, name: 'Demo drive', annotation: '', status: 'recording',
            startedAt: this.startedAt, endedAt: null, policy: C.policy(settings), missingWallMs: 0, gaps: [] };
        this.trip.stats = C.create(this.trip.policy);
        this.advance(Date.now());
        this.saved = Object.assign({}, this.trip, { id: 'demo-saved', name: 'Demo mountain drive', status: 'finished',
            endedAt: this.at, stats: JSON.parse(JSON.stringify(this.trip.stats)) });
        this.savedProjection = { points: this.projection.points.slice(), distancePoints: this.projection.distancePoints.slice(),
            rpmMax: this.projection.rpmMax, verticalFpm: this.projection.verticalFpm };
    }
    advance(now) {
        while (this.at + 50 <= now) {
            this.at += 50;
            const data = this.sim.sample(this.at);
            this.longitude += data.speed * 0.05 / 3.6 / METRES_PER_LONGITUDE_DEGREE;
            const coordinates = { latitude: DEMO_LATITUDE, longitude: this.longitude };
            const fixAt = Math.floor(this.at / 1000) * 1000;
            const fix = { id: fixAt, utcMs: fixAt, coordinates, coordinateEpoch: 1, ageMs: this.at - fixAt, accuracyMeters: null };
            const altitudeSeconds = (fixAt - this.startedAt) / 1000;
            const fuelLph = 0.8 + Math.max(0, data.torque * data.rpm / 9549) * 0.27;
            const value = (n) => ({ state: 'live', value: n, epoch: 1, note: 'Simulated demo data' });
            this.live = { speed: value(data.speed / 1.609344), rpm: value(data.rpm),
                gear: value(data.gear ? String(data.gear) : 'P'),
                fuel: Object.assign(value(fuelLph / GALLON_LITRES), { source: 'demo/fuel' }),
                gps: { state: 'live', epoch: 1, heightEpoch: 1, positionState: 'live', coordinateEpoch: 1,
                    coordinates, fixId: fix.id, fixTimeMs: fix.utcMs, fixes: [fix], ageMs: 0, fixAgeMs: fix.ageMs,
                    altitudeFt: 1240 + altitudeSeconds * 0.3 + 160 * Math.sin(altitudeSeconds / 90) } };
            if ((this.at - this.startedAt) % C.SAMPLE_MS) continue;
            const row = { schemaVersion: 2, segment: 'demo', recordedMs: this.at - this.startedAt,
                elapsedMs: this.at - this.startedAt, wallAt: this.at, values: this.live };
            const interval = C.accept(this.trip.stats, this.previous, row, this.trip.policy);
            row.distanceMiles = interval.distance !== null ? this.trip.stats.distanceMiles : null;
            row.mpg = Number.isFinite(interval.mpg) ? interval.mpg : null;
            if (interval.distance !== null && interval.distanceMs > 0) {
                row.distanceStartMs = interval.distanceStartMs; row.distanceEndMs = interval.distanceEndMs;
                row.distanceIntervals = interval.distanceIntervals;
            }
            this.previous = row;
            this.projection.add(row);
        }
    }
}
module.exports = Demo;

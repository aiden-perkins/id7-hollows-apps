'use strict';
const Sim = require('./kit/sim');
const C = require('./calculations');
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
        this.savedProjection = { points: this.projection.points.slice(), distancePoints: this.projection.distancePoints.slice() };
    }
    advance(now) {
        while (this.at + 50 <= now) {
            this.at += 50;
            const data = this.sim.sample(this.at);
            this.longitude += data.speed * 0.05 / 3.6 / METRES_PER_LONGITUDE_DEGREE;
            const coordinates = { latitude: DEMO_LATITUDE, longitude: this.longitude };
            const fix = { id: this.at, utcMs: this.at, coordinates, coordinateEpoch: 1, ageMs: 0, accuracyMeters: null };
            const value = (n) => ({ state: 'live', value: n, epoch: 1, note: 'Simulated demo data' });
            this.live = { speed: value(data.speed / 1.609344), rpm: value(data.rpm),
                gear: value(data.gear ? String(data.gear) : 'P'),
                fuel: { state: 'unavailable', value: null, epoch: 1, note: 'No validated consumed-fuel source' },
                gps: { state: 'live', epoch: 1, heightEpoch: 1, positionState: 'live', coordinateEpoch: 1,
                    coordinates, fixId: fix.id, fixTimeMs: fix.utcMs, fixes: [fix], ageMs: 0, fixAgeMs: 0,
                    altitudeFt: 1240 + (this.at - this.startedAt) / 1000 * 0.3 + 160 * Math.sin((this.at - this.startedAt) / 90000) } };
            if ((this.at - this.startedAt) % 1000) continue;
            const row = { schemaVersion: 2, segment: 'demo', recordedMs: this.at - this.startedAt,
                elapsedMs: this.at - this.startedAt, wallAt: this.at, values: this.live };
            const interval = C.accept(this.trip.stats, this.previous, row, this.trip.policy);
            row.distanceMiles = interval.distance !== null ? this.trip.stats.distanceMiles : null; row.mpg = null;
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

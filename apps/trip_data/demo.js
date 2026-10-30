'use strict';
const Sim = require('./kit/sim');
const C = require('./calculations');
const { Projection } = require('./view');

// Like upstream's demo runs, these trips exist only in memory, never in Storage.
class Demo {
    constructor(settings) {
        this.sim = new Sim();
        this.startedAt = Date.now() - 180000;
        this.sim.t0 = this.startedAt;
        this.at = this.startedAt;
        this.fuel = 0; this.previous = null; this.rolling = [];
        this.projection = new Projection();
        this.trip = { id: 'demo-current', demo: true, name: 'Demo drive', annotation: '', status: 'recording',
            startedAt: this.startedAt, endedAt: null, policy: C.policy(settings), missingWallMs: 0, gaps: [] };
        this.trip.stats = C.create(this.trip.policy);
        this.advance(Date.now());
        this.saved = Object.assign({}, this.trip, { id: 'demo-saved', name: 'Demo mountain drive', status: 'finished',
            endedAt: this.at, stats: JSON.parse(JSON.stringify(this.trip.stats)) });
        this.savedProjection = { points: this.projection.points.slice() };
    }
    advance(now) {
        while (this.at + 50 <= now) {
            this.at += 50;
            const data = this.sim.sample(this.at);
            // Fuel flow and elevation are illustrative, not upstream vehicle decoders.
            this.fuel += (0.25 + data.throttle * 5) * 0.05 / 3600;
            const value = (n) => ({ state: 'live', value: n, epoch: 1, note: 'Simulated demo data' });
            this.live = { speed: value(data.speed / 1.609344), rpm: value(data.rpm),
                gear: value(data.gear ? String(data.gear) : 'P'), fuel: value(this.fuel),
                gps: { state: 'live', epoch: 1, heightEpoch: 1,
                    altitudeFt: 1240 + (this.at - this.startedAt) / 1000 * 0.3 + 160 * Math.sin((this.at - this.startedAt) / 90000) } };
            if ((this.at - this.startedAt) % 1000) continue;
            const row = { schemaVersion: 1, segment: 'demo', recordedMs: this.at - this.startedAt,
                elapsedMs: this.at - this.startedAt, wallAt: this.at, values: this.live };
            const interval = C.accept(this.trip.stats, this.previous, row, this.trip.policy);
            row.distanceMiles = this.trip.stats.distanceMiles; row.mpg = null;
            if (interval.continuous && interval.distance !== null && interval.fuel !== null) {
                this.rolling.push({ at: row.recordedMs, miles: interval.distance, gallons: interval.fuel });
                while (this.rolling.length && this.rolling[0].at <= row.recordedMs - 60000) this.rolling.shift();
                if (this.rolling.length === 60) {
                    const totals = this.rolling.reduce((sum, p) => ({ miles: sum.miles + p.miles, gallons: sum.gallons + p.gallons }), { miles: 0, gallons: 0 });
                    row.mpg = totals.gallons > 0 ? totals.miles / totals.gallons : null;
                }
            }
            this.previous = row;
            this.projection.add(row);
        }
    }
}
module.exports = Demo;

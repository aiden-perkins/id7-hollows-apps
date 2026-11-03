'use strict';
const fs = require('fs');
const path = require('path');
const { Sources, DEFINITIONS, mono } = require('./trip_data/sources');
const { Storage } = require('./trip_data/storage');
const C = require('./trip_data/calculations');

// Retain every Trip Data delivery, including invalid payloads and provider changes.
class LoggingSources extends Sources {
    constructor(ctx, recorder) {
        super(ctx, () => {});
        this.recorder = recorder;
    }
    state(key, state, note) {
        super.state(key, state, note);
        if (!this.closed && this.enabled) this.recorder.append({ type: 'trip-transport', at: Date.now(),
            key, state, note, current: this.values[key] });
    }
    receive(connection, raw) {
        if (!this.alive(connection)) return;
        super.receive(connection, raw);
        this.recorder.append({ type: 'trip-delivery', at: Date.now(), key: connection.def.key,
            source: connection.def.iface, instance: connection.def.instance || '1',
            field: connection.def.field, raw, current: this.values[connection.def.key] });
    }
}

class TripCollector {
    constructor(ctx, recorder) {
        this.recorder = recorder;
        this.closed = false;
        // Reuse Trip Data's defaults/validation without reading or changing its saved trips.
        const dir = path.join(ctx.dataDir, 'trip-data');
        fs.mkdirSync(dir, { recursive: true });
        this.policy = C.policy(new Storage(dir).settings());
        this.stats = C.create(this.policy);
        this.startedMono = mono();
        this.previous = null;
        this.sources = new LoggingSources(ctx, recorder);
        recorder.append({ type: 'trip-catalog', at: Date.now(), definitions: DEFINITIONS, policy: this.policy,
            scope: 'Trip Data calculations for this Data Logger session; not imported trip history or automatic engine sessions' });
        this.sources.start(this.policy.sampleMs);
    }
    summary() {
        if (this.closed) return;
        const now = mono();
        // Match Trip Data's sample and calculation contracts, including unavailable fuel/MPG.
        const row = { schemaVersion: 2, segment: 'data-logger', recordedMs: Math.max(0, now - this.startedMono),
            wallAt: Date.now(), values: this.sources.sample(now) };
        row.elapsedMs = row.recordedMs;
        const interval = C.accept(this.stats, this.previous, row, this.policy);
        row.distanceMiles = interval.distance !== null ? this.stats.distanceMiles : null;
        if (interval.distance !== null && interval.distanceMs > 0) {
            row.distanceStartMs = interval.distanceStartMs;
            row.distanceEndMs = interval.distanceEndMs;
            row.distanceIntervals = interval.distanceIntervals;
        }
        row.mpg = null;
        this.previous = row;
        this.recorder.append({ type: 'trip-sample', at: row.wallAt, row, interval, stats: this.stats });
    }
    close() {
        if (this.closed) return;
        this.closed = true;
        this.sources.close();
    }
}
module.exports = { TripCollector };

'use strict';
const fs = require('fs');
const path = require('path');
const { Sources, DEFINITIONS, mono } = require('./trip_data/sources');
const { Storage } = require('./trip_data/storage');
const C = require('./trip_data/calculations');
const { Diag } = require('./kit/diag');

// Retain every Trip Data delivery, including invalid payloads and provider changes.
class LoggingSources extends Sources {
    constructor(ctx, recorder) {
        super(ctx, () => {}, Diag);
        this.recorder = recorder;
    }
    state(key, state, note) {
        super.state(key, state, note);
        if (!this.closed && this.enabled) this.recorder.append({ type: 'trip-transport', at: Date.now(),
            key, state, note, current: this.values[key] });
    }
    receive(connection, definition, raw) {
        if (!this.alive(connection)) return;
        super.receive(connection, definition, raw);
        this.recorder.append({ type: 'trip-delivery', at: Date.now(), key: definition.key,
            source: definition.iface, instance: definition.instance || '1',
            field: definition.field, raw, current: this.values[definition.key] });
    }
    fuelDelivery(sample) {
        super.fuelDelivery(sample);
        if (!this.closed && this.enabled) this.recorder.append({ type: 'trip-fuel', at: Date.now(), current: sample });
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
        this.sources.start();
    }
    summary() {
        if (this.closed) return;
        const now = mono();
        // Match Trip Data's sample, fuel-flow and calculation contracts.
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
        row.mpg = Number.isFinite(interval.mpg) ? interval.mpg : null;
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

'use strict';
const D = require('./definitions');
const { Model } = require('./model');
const { Services } = require('./services');
const { Storage } = require('./storage');
const { TripCollector } = require('./trip-collector');

// Keep the viewer's decoding/quality rules; save every delivery rather than its bounded graphs.
class LoggingModel extends Model {
    constructor(ctx, recorder) {
        super(new Storage(ctx.dataDir), () => {}, (error) => ctx.log.warn(error));
        this.recorder = recorder;
        this.loggedSamples = {};
    }
    // Discovery must probe diagnostic boost even when the preferred FES feed works.
    boostFromDme() { return true; }
    transport(key, field, state, note) {
        super.transport(key, field, state, note);
        this.recorder.append({ type: 'transport', at: Date.now(), source: key, field, state, note });
    }
    receive(key, field, raw, arrivalKind) {
        super.receive(key, field, raw, arrivalKind);
        const readings = [];
        D.definitions.forEach((d) => {
            const r = this.readings[d.id];
            if (r.samples === (this.loggedSamples[d.id] || 0)) return;
            this.loggedSamples[d.id] = r.samples;
            readings.push({ id: d.id, receivedAt: r.at, deliveries: r.samples, current: this.state(d) });
        });
        this.recorder.append({ type: 'delivery', at: Date.now(), source: key, field,
            arrivalKind, raw, readings });
    }
    summary() {
        return D.definitions.map((d) => {
            const r = this.readings[d.id];
            return { id: d.id, current: this.state(d), deliveries: r.samples,
                receivedAt: r.at || null, min: r.min, max: r.max };
        });
    }
}

class Collector {
    constructor(ctx, recorder) {
        this.recorder = recorder;
        this.closed = false;
        this.model = new LoggingModel(ctx, recorder);
        // Save complete diagnostic broadcasts too, including rejected/invalid replies
        // which the measurement decoder correctly refuses to turn into samples.
        const native = ctx.signals, signals = Object.create(native);
        signals.on = (proxy, field, handler, log) => native.on(proxy, field, (raw) => {
            if (!this.closed && field === 'sendTasuResponse') recorder.append({ type: 'diagnostic-frame', at: Date.now(), field, raw });
            handler(raw);
        }, log);
        signals.call = (proxy, method, params, timeout) => {
            if (!this.closed) recorder.append({ type: 'diagnostic-request', at: Date.now(), stage: 'queued', method, params });
            return native.call(proxy, method, params, timeout);
        };
        this.services = null;
        this.trip = null;
        try {
            this.services = new Services(Object.assign({}, ctx, { signals }), this.model);
            // No page-specific activation: every reported source and derived definition is active.
            this.services.activate(D.definitions.map((d) => d.id));
            this.trip = new TripCollector(ctx, recorder);
            this.summary();
        } catch (error) { this.close(); throw error; }
    }
    summary() {
        this.recorder.append({ type: 'path-status', at: Date.now(), paths: this.model.summary() });
        this.trip.summary();
    }
    close() {
        this.closed = true;
        if (this.trip) this.trip.close();
        if (this.services) this.services.close();
        this.model.activate([]);
    }
}
module.exports = { Collector };

'use strict';
const D = require('./definitions');
const definitionsById = {};
D.definitions.forEach((d) => { definitionsById[d.id] = d; });
class Model {
    constructor(storage, changed) {
        this.storage = storage; this.changed = changed; this.settings = storage.loadSettings();
        this.startedAt = Date.now(); this.readings = {}; this.active = new Set();
        D.definitions.forEach((d) => { this.readings[d.id] = {
            decoded: { state: d.source || d.dependsOn ? 'waiting' : 'unavailable', note: d.source || d.dependsOn ? 'Select the category to collect data' : d.notes },
            raw: null, at: 0, lastValid: null, arrivals: [], samples: 0, history: [], min: null, max: null,
            collecting: false, transport: null, breakNext: true,
        }; });
    }
    configure(key, value) {
        const s = Object.assign({}, this.settings, { [key]: value });
        this.storage.settings(s); this.settings = s; this.changed();
    }
    activate(ids) {
        this.active = new Set(ids);
        D.definitions.forEach((d) => {
            const r = this.readings[d.id], collecting = !!(d.source || d.dependsOn) && this.active.has(d.id);
            if (r.collecting !== collecting) { this.gap(r); r.arrivals = []; }
            r.collecting = collecting;
        });
        this.changed();
    }
    gap(r) {
        r.breakNext = true;
        if (!r.history.length || r.history[r.history.length - 1].value !== null) r.history.push({ at: Date.now(), value: null });
        this.prune(r);
    }
    prune(r) {
        const cutoff = Date.now() - 600000;
        while (r.history.length && (r.history[0].at < cutoff || r.history.length > 1201)) r.history.shift();
    }
    transport(key, field, state, note) {
        D.definitions.filter((d) => D.sourceKey(d) === key && (!field || d.field === field)).forEach((d) => {
            const r = this.readings[d.id];
            if (!r.collecting) return;
            r.transport = { state, note }; r.arrivals = []; this.gap(r);
        });
        D.definitions.filter((d) => d.dependsOn && this.readings[d.id].collecting).forEach((d) => {
            if (this.derivedValue(d, Date.now()).state !== 'live') this.gap(this.readings[d.id]);
        });
        this.changed();
    }
    receive(key, field, raw, arrivalKind) {
        const now = Date.now();
        D.definitions.filter((d) => D.sourceKey(d) === key && d.field === field).forEach((d) => {
            const r = this.readings[d.id];
            if (!r.collecting) return;
            if (r.at && now - r.at > d.staleMs) this.gap(r);
            r.raw = raw; r.at = now; r.samples++; r.arrivals.push(now); r.arrivals = r.arrivals.slice(-60);
            r.arrivalKind = arrivalKind; r.transport = null; r.decoded = D.decode(d, raw);
            this.record(d, r, now);
        });
        this.updateDerived(now);
        this.changed();
    }
    record(d, r, now) {
        if (r.decoded.state !== 'live') { this.gap(r); return; }
        r.lastValid = { value: r.decoded.value, unit: r.decoded.unit || '', at: now };
        if (!d.numeric || !Number.isFinite(r.decoded.value)) return;
        const value = r.decoded.value;
        r.min = r.min === null ? value : Math.min(r.min, value);
        r.max = r.max === null ? value : Math.max(r.max, value);
        const last = r.history[r.history.length - 1];
        if (r.breakNext || !last || now - last.at >= 500) r.history.push({ at: now, value });
        else last.value = value;
        r.breakNext = false; this.prune(r);
    }
    derivedValue(d, now) {
        const r = this.readings[d.id];
        if (!r.collecting) return { state: r.at ? 'stale' : 'waiting', note: 'Collection paused outside this page' };
        const rpm = this.readings.rpm, torque = this.readings.torque;
        const speed = this.state(definitionsById.rpm);
        if (speed.state !== 'live') return { state: speed.state, note: 'Power requires live crankshaft RPM: ' + (speed.note || speed.state) };
        if (now - rpm.at > d.staleMs) return { state: 'stale', note: 'Crankshaft RPM is too old to derive power' };
        if (speed.unit !== 'rpm' || !Number.isFinite(speed.value)) return { state: 'invalid', note: 'Unsupported engine-speed units' };
        if (speed.value === 0) return { state: 'live', value: 0, unit: 'hp',
            quality: 'Derived: live stopped crankshaft establishes zero mechanical power; torque not required' };
        const force = this.state(definitionsById.torque);
        if (force.state !== 'live') return { state: force.state, note: 'Power requires live crankshaft torque: ' + (force.note || force.state) };
        if (now - torque.at > d.staleMs) return { state: 'stale', note: 'Crankshaft torque is too old to derive power' };
        if (Math.abs(rpm.at - torque.at) > d.maxSkewMs) return { state: 'waiting', note: 'RPM and torque deliveries are too far apart to derive power' };
        const torqueNm = force.unit === 'Nm' ? force.value : force.unit === 'lb-ft' ? force.value / 0.7375621492772656 : NaN;
        if (!Number.isFinite(torqueNm)) return { state: 'invalid', note: 'Unsupported crankshaft-torque units' };
        return { state: 'live', value: torqueNm * speed.value * (2 * Math.PI / 60) / 745.6998715822702, unit: 'hp',
            quality: 'Derived: crankshaft Nm × rpm × 2π / 60 / 745.6998715822702; delivery skew ' +
                Math.abs(rpm.at - torque.at) + ' ms (local arrivals, not synchronized vehicle timestamps)' };
    }
    updateDerived(now) {
        D.definitions.filter((d) => d.dependsOn && this.readings[d.id].collecting).forEach((d) => {
            const r = this.readings[d.id], rpm = this.readings.rpm, torque = this.readings.torque;
            r.raw = { rpm: { value: rpm.raw, receivedAt: rpm.at || null },
                torque: { value: torque.raw, receivedAt: torque.at || null } };
            r.decoded = this.derivedValue(d, now);
            if (r.decoded.state !== 'live') { this.gap(r); return; }
            // An unmatched delivery is not a power sample. Stopped-engine samples need only new RPM.
            const signature = rpm.decoded.value === 0 ? rpm.samples + ':stopped' : rpm.samples + ':' + torque.samples;
            if (r.inputSignature === signature) return;
            if (r.at && now - r.at > d.staleMs) this.gap(r);
            r.inputSignature = signature; r.at = now; r.samples++;
            r.arrivals.push(now); r.arrivals = r.arrivals.slice(-60); r.arrivalKind = 'derived';
            this.record(d, r, now);
        });
    }
    state(d) {
        const r = this.readings[d.id], now = Date.now();
        if (r.transport) return Object.assign({}, r.transport, { value: r.lastValid && r.lastValid.value, retained: !!r.lastValid });
        if (d.dependsOn) {
            const derived = this.derivedValue(d, now);
            return derived.state === 'live' ? derived : Object.assign({}, derived,
                { value: r.lastValid && r.lastValid.value, retained: !!r.lastValid });
        }
        if (!d.source) return { state: 'unavailable', note: d.notes };
        if (!r.collecting && !r.at) return { state: 'waiting', note: 'Category is not being collected' };
        if (r.at && (now - r.at > d.staleMs || !r.collecting)) {
            return { state: 'stale', value: r.lastValid && r.lastValid.value, retained: !!r.lastValid,
                note: r.collecting ? 'No fresh delivery' : 'Collection paused outside this page' };
        }
        return r.decoded;
    }
    reset() {
        this.startedAt = Date.now();
        Object.keys(this.readings).forEach((id) => {
            const r = this.readings[id]; r.min = null; r.max = null; r.history = []; r.breakNext = true;
        });
        this.changed();
    }
    snapshot(d) {
        const r = this.readings[d.id], now = Date.now(), current = this.state(d);
        return this.storage.snapshot({ schemaVersion: 1, savedAt: now, definitionVersion: 2,
            signal: { id: d.id, name: d.name, category: d.page, group: d.group, kind: d.kind,
                interface: d.source ? D.IF[d.source] : null, instance: d.instance || '1',
                field: d.field || null, member: d.member || null, sourceLead: d.lead || null,
                notes: d.notes, position: d.position || null, positionBasis: d.positionBasis || null,
                dependsOn: d.dependsOn || null, maxInputAgeMs: d.dependsOn ? d.staleMs : null, maxInputSkewMs: d.maxSkewMs || null },
            current, receivedAt: r.at || null, deliveryAgeMs: r.at ? now - r.at : null,
            lastValid: r.lastValid, raw: r.raw, quality: current.quality || r.decoded.quality || null,
            extrema: { min: r.min, max: r.max, startedAt: this.startedAt, scope: 'observation session; ignition unavailable' },
            sampling: { deliveries: r.samples, includesGetterReplies: true, simultaneous: false, derived: !!d.dependsOn },
            units: this.settings.units, precision: this.settings.precision });
    }
}
module.exports = { Model };

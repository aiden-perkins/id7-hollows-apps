'use strict';
const D = require('./definitions');
const definitionsById = {};
D.definitions.forEach((d) => { definitionsById[d.id] = d; });
class Model {
    constructor(storage, changed, saveFailed) {
        this.storage = storage; this.changed = changed; this.saveFailed = saveFailed; this.settings = storage.loadSettings();
        this.definitions = definitionsById;
        this.startedAt = Date.now(); this.readings = {}; this.active = new Set();
        D.definitions.forEach((d) => { this.readings[d.id] = {
            decoded: { state: d.source || d.dependsOn ? 'waiting' : 'unavailable', note: d.source || d.dependsOn ? 'Select the category to collect data' : d.notes },
            raw: null, at: 0, lastValid: null, arrivals: [], samples: 0, history: [], min: null, max: null,
            collecting: false, transport: null, breakNext: true,
        }; });
    }
    configure(key, value) {
        const s = Object.assign({}, this.settings, { [key]: value });
        this.storage.settings(s); this.settings = s;
        if (key === 'boostSource') {
            const r = this.readings.boost;
            r.min = null; r.max = null; r.history = []; r.breakNext = true; r.inputSignature = null;
            this.updateDerived(Date.now());
        }
        this.changed();
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
    boostFromDme() {
        if (!this.readings.boostAbsolute.collecting || this.settings.boostSource === 'fes') return false;
        if (this.settings.boostSource === 'dme') return true;
        return this.state(definitionsById.boostFes).state !== 'live' || !this.settings.boostSeen.includes('boostFes');
    }
    record(d, r, now) {
        if (r.decoded.state !== 'live') { this.gap(r); return; }
        r.lastValid = { value: r.decoded.value, unit: r.decoded.unit || '', at: now };
        if (!d.numeric || !Number.isFinite(r.decoded.value)) return;
        const value = r.decoded.value;
        if ((d.id === 'boostFes' || d.id === 'boostDme') && !this.settings.boostSeen.includes(d.id)) {
            if (r.firstBoost === undefined) r.firstBoost = value;
            else if (Math.abs(value - r.firstBoost) >= 0.03 * 14.503773773020923) {
                this.settings.boostSeen = this.settings.boostSeen.concat(d.id);
                try { this.storage.settings(this.settings); } catch (error) { this.saveFailed(error); }
            }
        }
        r.min = r.min === null ? value : Math.min(r.min, value);
        r.max = r.max === null ? value : Math.max(r.max, value);
        let point = r.history[r.history.length - 1];
        if (r.breakNext || !point || now - point.at >= 500) { point = { at: now, value }; r.history.push(point); }
        else point.value = value;
        if (d.id === 'gForce') { point.lateral = r.decoded.lateral; point.longitudinal = r.decoded.longitudinal; }
        r.breakNext = false; this.prune(r);
    }
    derivedValue(d, now) {
        const r = this.readings[d.id];
        if (!r.collecting) return { state: r.at ? 'stale' : 'waiting', note: 'Collection paused outside this page' };
        if (d.tpmsMeasure) {
            const raw = this.state(definitionsById[d.dependsOn[0]]), unit = this.state(definitionsById[d.dependsOn[1]]);
            if (raw.state !== 'live' || unit.state !== 'live') {
                const unavailable = raw.state !== 'live' ? raw : unit;
                return { state: unavailable.state, note: 'TPMS requires a fresh reading and its reported vehicle unit: ' +
                    (unavailable.note || unavailable.state) };
            }
            if (!Number.isFinite(raw.value)) return { state: 'invalid', note: 'Invalid native TPMS value' };
            if (d.tpmsMeasure === 'temperature') {
                const celsius = unit.value === 'C' ? raw.value : unit.value === 'F' ? (raw.value - 32) / 1.8 : NaN;
                if (!Number.isFinite(celsius) || celsius < -40 || celsius > 150) {
                    return { state: 'invalid', note: 'TPMS temperature outside -40 to 150 degrees C' };
                }
                return { state: 'live', value: celsius * 1.8 + 32, unit: 'F',
                    quality: 'TPMS normalized from reported vehicle temperature unit ' + unit.value };
            }
            const bar = unit.value === 'BAR' ? raw.value : unit.value === 'KPA' ? raw.value / 100 :
                unit.value === 'PSI' ? raw.value / 14.503773773020923 : NaN;
            if (!Number.isFinite(bar) || bar < (d.tpmsMeasure === 'target' ? 1 : 0.5) || bar > 6) {
                return { state: 'invalid', note: 'TPMS pressure outside documented ' +
                    (d.tpmsMeasure === 'target' ? '1-6 bar target' : '0.5-6 bar actual') + ' range' };
            }
            return { state: 'live', value: bar * 14.503773773020923, unit: 'psi',
                quality: 'TPMS normalized from reported vehicle pressure unit ' + unit.value };
        }
        if (d.id === 'boostDme') {
            const absolute = this.state(definitionsById.boostAbsolute);
            if (absolute.state !== 'live') return { state: absolute.state,
                note: 'Diagnostic boost requires fresh absolute pressure: ' + (absolute.note || absolute.state) };
            const ambient = this.readings.barometricPressure.lastValid;
            const value = (absolute.value - (ambient ? ambient.value : 101.3)) * 0.14503773773020923;
            if (!Number.isFinite(value) || value < -14.503773773020923 || value > 4 * 14.503773773020923) {
                return { state: 'invalid', note: 'Diagnostic boost outside M Vitals -1 to 4 bar range' };
            }
            return { state: 'live', value, unit: 'psi', quality: 'M Vitals absolute-minus-ambient conversion; ' +
                (ambient ? 'last measured ambient ' + ambient.value + ' kPa, age ' + (now - ambient.at) + ' ms' :
                    'estimated ambient 101.3 kPa (no measured ambient available)') };
        }
        if (d.preferred) {
            const boost = d.id === 'boost', choice = this.settings.boostSource;
            const ids = boost && choice !== 'auto' ? [choice === 'fes' ? 'boostFes' : 'boostDme'] : d.dependsOn;
            for (const id of ids) {
                if (boost && choice === 'auto' && !this.settings.boostSeen.includes(id)) continue;
                const source = definitionsById[id], value = this.state(source);
                if (value.state === 'live' && Number.isFinite(value.value) && value.unit === d.unit) {
                    return Object.assign({}, value, { sourceId: id,
                        quality: source.name + ': ' + (value.quality || source.notes) });
                }
            }
            return { state: 'unavailable', note: boost ?
                'No fresh selected boost source' + (choice === 'auto' ? '; Auto waits for 0.03 bar variation to confirm a source' : '') :
                'No fresh supported temperature source: ' +
                    ids.map((id) => definitionsById[id].name + ' (' + this.state(definitionsById[id]).state + ')').join(', ') };
        }
        if (d.id === 'exhaust' || d.id === 'frontPower' || d.id === 'rearPower' || d.id === 'gForce') {
            const ids = d.dependsOn, a = this.readings[ids[0]], b = this.readings[ids[1]];
            const first = this.state(definitionsById[ids[0]]), second = this.state(definitionsById[ids[1]]);
            if (first.state !== 'live' || second.state !== 'live') return {
                state: [first.state, second.state].includes('invalid') ? 'invalid' :
                    [first.state, second.state].includes('error') ? 'error' :
                        [first.state, second.state].includes('unavailable') ? 'unavailable' :
                            [first.state, second.state].includes('stale') ? 'stale' : 'waiting',
                note: 'Requires both fresh ' + (d.id === 'exhaust' ? 'DME electrical output readings; tester commands are not substituted' :
                    d.id === 'gForce' ? 'lateral and longitudinal acceleration' :
                        'crankshaft horsepower and reported transfer-case torque share') };
            if (Math.abs(a.at - b.at) > d.maxSkewMs) return { state: 'stale', note: 'Input deliveries are too far apart' };
            if (d.id === 'gForce') {
                if (first.unit !== 'g' || second.unit !== 'g' || !Number.isFinite(first.value) || !Number.isFinite(second.value)) {
                    return { state: 'invalid', note: 'Combined acceleration requires both axes in g' };
                }
                if (now - a.at > d.staleMs || now - b.at > d.staleMs) {
                    return { state: 'stale', note: 'Acceleration delivery is too old' };
                }
                return { state: 'live', value: Math.hypot(first.value, second.value), unit: 'g',
                    lateral: first.value, longitudinal: second.value,
                    quality: 'Combined lateral and longitudinal acceleration; local delivery skew ' + Math.abs(a.at - b.at) + ' ms' };
            }
            if (d.id === 'frontPower' || d.id === 'rearPower') {
                if (first.unit !== 'hp' || second.unit !== '%' || !Number.isFinite(first.value) ||
                    !Number.isFinite(second.value) || second.value < 0 || second.value > 100) {
                    return { state: 'invalid', note: 'Axle power requires horsepower and a supported 0-100 torque share' };
                }
                if (now - a.at > d.staleMs || now - b.at > d.staleMs) {
                    return { state: 'stale', note: 'Engine power or torque-share delivery is too old' };
                }
                const rear = second.value / 100;
                return { state: 'live', value: first.value * (d.id === 'rearPower' ? rear : 1 - rear), unit: 'hp',
                    quality: 'Estimated crankshaft HP allocated by reported torque share; assumes equal axle speeds and no drivetrain losses, not measured axle HP' };
            }
            return { state: 'live', value: first.value === second.value ? first.value : 'MIXED',
                quality: 'Both current DME electrical output bands; mechanical flap position unmeasured' };
        }
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
            const r = this.readings[d.id], inputs = d.dependsOn.map((id) => this.readings[id]);
            r.raw = {};
            d.dependsOn.forEach((id, index) => { r.raw[id] = { value: inputs[index].raw, receivedAt: inputs[index].at || null }; });
            r.decoded = this.derivedValue(d, now);
            if (d.preferred && r.sourceId !== r.decoded.sourceId) { this.gap(r); r.sourceId = r.decoded.sourceId; }
            if (r.decoded.state !== 'live') { this.gap(r); return; }
            // Only a new input delivery creates a derived sample.
            const signature = d.id === 'boost' ? r.decoded.sourceId + ':' + this.readings[r.decoded.sourceId].samples :
                d.id === 'horsepower' && this.readings.rpm.decoded.value === 0 ?
                    this.readings.rpm.samples + ':stopped' : inputs.map((input) => input.samples).join(':');
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
        return this.storage.snapshot({ schemaVersion: 1, savedAt: now, definitionVersion: 8,
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

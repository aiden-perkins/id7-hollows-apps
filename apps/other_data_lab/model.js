'use strict';
const fs = require('fs');
const path = require('path');
const catalog = require('./catalog');
const hex = (value, width) => value.toString(16).toUpperCase().padStart(width || 2, '0');
const now = () => { const t = process.hrtime(); return t[0] * 1000 + t[1] / 1e6; };
const bytes = (value) => {
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Array.from(value);
    if (value && Array.isArray(value.data)) return bytes(value.data);
    return Array.isArray(value) && value.every((v) => Number.isInteger(v) && v >= 0 && v <= 255) ? value.slice() : null;
};
function decode(probe, payload) {
    const data = bytes(payload);
    if (!data || data.length !== probe.payloadBytes) return { state: 'layout-mismatch', fields: [],
        detail: 'Expected exactly ' + probe.payloadBytes + ' data bytes; received ' + (data ? data.length : 'non-bytes') + '. Raw evidence only.' };
    const buffer = Buffer.from(data);
    const fields = probe.fields.map((field) => {
        let raw;
        if (field.type === 'motorola float') raw = buffer.readFloatBE(field.at);
        else if (/^signed |^int$/.test(field.type)) raw = buffer.readIntBE(field.at, field.bytes);
        else raw = buffer.readUIntBE(field.at, field.bytes);
        let state = 'artifact-decoded', note = field.qualityNote || 'Artifact conversion; live physical validity is not established.';
        let value = null, label = field.enum && field.enum[String(raw)];
        if (!Number.isFinite(raw)) { state = 'invalid'; note = 'Non-finite floating point value; not a physical measurement.'; }
        else if (field.invalidRaw && field.invalidRaw.includes(raw)) { state = 'invalid'; note = field.qualityNote; }
        else if (field.validity && !field.validity.values.includes(data[field.validity.at])) {
            state = 'invalid-qualifier'; note = 'Qualifier at payload offset ' + field.validity.at + ' is ' +
                data[field.validity.at] + '; accepted artifact codes: ' + field.validity.values.join(', ') + '.';
        } else if (field.enum) {
            state = label === undefined ? 'unknown-enum' : 'reported-state';
            note = 'Reported enum only; inspect the complete source table.';
        } else if (field.rawOnly || field.unit === '-' && field.qualityNote) { state = 'raw-only'; }
        else value = raw * field.mul / field.div + field.add;
        if (field.wheelQualityAt !== undefined) {
            const quality = data[field.wheelQualityAt];
            if (quality > 100) { state = 'unknown-quality'; value = null; note = 'Quality outside documented percentage range: ' + quality; }
            else if (quality <= 50) {
                state = quality < 10 ? 'no-signal' : 'weak-signal'; value = null;
                note = 'Reported wheel quality ' + quality + '%; raw speed retained, not treated as valid.';
            } else note = 'Reported sensor quality ' + quality + '%; this is not independent physical validation.';
        }
        return { name: field.name, label: field.label, at: field.at, raw, rawHex: data.slice(field.at, field.at + field.bytes).map((v) => hex(v)).join(' '),
            value, enumLabel: label === undefined ? null : label, unit: field.unit, state, note, sourceInfo: field.info };
    });
    return { state: 'artifact-decoded', detail: 'Exact artifact length; qualifiers and physical validity are separate. No engagement/position percentages inferred.', fields };
}
class Model {
    constructor(ctx, changed) {
        this.ctx = ctx; this.changed = changed; this.preview = !!ctx.preview;
        this.session = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        this.events = []; this.evicted = 0; this.sequence = 0; this.latest = {}; this.native = {}; this.providers = {};
        this.notice = this.preview ? 'PREVIEW / no vehicle connections or diagnostic requests' : 'Read-only observation. Diagnostics OFF until explicitly enabled.';
    }
    record(kind, data) {
        const event = { session: this.session, sequence: ++this.sequence, at: Date.now(), monoMs: now(), kind, data };
        this.events.push(event);
        if (this.events.length > 256) { this.events.shift(); this.evicted++; }
        this.changed(); return event;
    }
    result(probe, result, synthetic) {
        const entry = Object.assign({ at: Date.now(), monoMs: now(), synthetic: !!synthetic, probeId: probe.id }, result);
        this.latest[probe.id] = entry; this.record('result', entry); return entry;
    }
    nativeSample(def, raw, provider) {
        const entry = { at: Date.now(), monoMs: now(), raw, source: def.id, epoch: provider.epoch,
            availableAtReceipt: provider.available === true, synthetic: false };
        this.native[def.id] = entry; this.record('native', entry);
    }
    replay(probeId, uds) {
        if (!this.preview) throw new Error('Synthetic observations are permitted only in host preview');
        const probe = catalog.requests.find((p) => p.id === probeId), data = bytes(uds);
        if (!probe || !data || data[0] !== 0x62 || data[1] !== (probe.did >> 8) || data[2] !== (probe.did & 255)) throw new Error('Synthetic reply does not match a catalog probe');
        return this.result(probe, { status: 'synthetic', uds: data, payload: data.slice(3), decoded: decode(probe, data.slice(3)),
            correlation: 'HOST-SUPPLIED SYNTHETIC BYTES; no ECU or physical observation' }, true);
    }
    snapshot(transport) {
        return { version: 1, session: this.session, capturedAt: Date.now(), preview: this.preview, catalogVersion: catalog.version,
            evidenceLevel: catalog.evidenceLevel, nativeCatalogSha256: catalog.catalogSha256,
            retention: { policy: 'Last 256 in-memory events; explicit save replaces prior snapshot. No continuous disk recorder.', retained: this.events.length, evicted: this.evicted, sequence: this.sequence },
            providers: this.providers, diagnostics: transport.status(), latest: this.latest, native: this.native, events: this.events,
            attributionLimit: 'ECU/SID/DID matches are not end-to-end ownership. Do not run concurrent diagnostic clients.' };
    }
    async save(transport) {
        const file = path.join(this.ctx.dataDir, 'other-data-evidence.json');
        fs.writeFileSync(file, JSON.stringify(this.snapshot(transport), null, 2) + '\n');
        this.notice = 'Saved host-local snapshot: ' + file + ' (replaces prior snapshot; not uploaded)';
        this.record('saved', { file }); return file;
    }
}
module.exports = { Model, catalog, decode, bytes, now, hex };

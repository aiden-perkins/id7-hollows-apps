'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('./calculations');

const validId = (id) => typeof id === 'string' && /^trip-[a-z0-9]+-[a-f0-9]{12}$/.test(id);
function token() { return crypto.randomBytes(6).toString('hex'); }
function atomic(file, value) {
    const temporary = file + '.' + token() + '.tmp';
    const fd = fs.openSync(temporary, 'wx');
    try { fs.writeFileSync(fd, JSON.stringify(value, null, 2) + '\n'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(temporary, file);
}
class Storage {
    constructor(dir) {
        this.dir = dir; this.trips = path.join(dir, 'trips'); this.errors = []; this.settingsBlocked = false; this.indexBlocked = false;
        if (!fs.existsSync(this.trips)) fs.mkdirSync(this.trips);
        if (!fs.lstatSync(this.trips).isDirectory() || fs.lstatSync(this.trips).isSymbolicLink()) throw new Error('Trip storage is not a regular directory');
        const index = path.join(this.trips, 'index.json');
        if (fs.existsSync(index)) {
            try {
                const data = JSON.parse(fs.readFileSync(index, 'utf8'));
                if (data.schemaVersion !== 1 || !Array.isArray(data.trips)) throw new Error('Unsupported index schema');
            } catch (e) { this.indexBlocked = true; this.errors.push('Index preserved: ' + e.message); }
        }
    }
    settings() {
        const defaults = { schemaVersion: 1, units: 'US', precision: 3, dateFormat: 'US12', sampleMs: 1000,
            automatic: false, altitudeThresholdFt: 10, smoothing: false, speedBands: Array.from({ length: 20 }, (_, i) => 10 + i * 10) };
        try {
            const s = JSON.parse(fs.readFileSync(path.join(this.dir, 'settings.json'), 'utf8'));
            if (!s || s.schemaVersion !== 1 || s.units !== 'US' || s.precision !== 3 || s.dateFormat !== 'US12' ||
                ![500, 1000, 2000].includes(s.sampleMs) || typeof s.automatic !== 'boolean' || typeof s.smoothing !== 'boolean' ||
                ![5, 10, 20].includes(s.altitudeThresholdFt) || !Array.isArray(s.speedBands) || (s.speedBands.length < 1 || s.speedBands.length > 64) ||
                !s.speedBands.every((v, i) => Number.isFinite(v) && v > 1 && v <= 250 && (!i || v > s.speedBands[i - 1]))) throw new Error('Unsupported or invalid settings');
            // Apply the requested bands to future recordings; saved trip policies remain immutable.
            return Object.assign({}, s, { speedBands: defaults.speedBands.slice() });
        } catch (e) {
            if (e.code !== 'ENOENT') { this.settingsBlocked = true; this.errors.push('Settings preserved: ' + e.message); }
            return defaults;
        }
    }
    saveSettings(value) {
        if (this.settingsBlocked) throw new Error('Saved settings are malformed or unsupported and have been preserved');
        atomic(path.join(this.dir, 'settings.json'), value);
    }
    directory(id) {
        if (!validId(id)) throw new Error('Invalid trip ID');
        const dir = path.join(this.trips, id), info = fs.lstatSync(dir);
        if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Unsafe trip storage path');
        return dir;
    }
    read(id) {
        const dir = this.directory(id);
        const file = path.join(dir, 'summary.json');
        if (fs.statSync(file).size > 1024 * 1024) throw new Error('Trip summary exceeds supported size');
        const s = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!s || s.schemaVersion !== 1 || s.id !== id || !s.policy || s.policy.calculationVersion !== 1 ||
            !s.stats || !Number.isFinite(s.stats.durationMs) || s.stats.durationMs < 0 ||
            !['recording', 'finished', 'interrupted'].includes(s.status) || typeof s.name !== 'string' ||
            !Number.isFinite(s.startedAt) || !Array.isArray(s.gaps)) throw new Error('Invalid or unsupported trip summary; preserved');
        return s;
    }
    history() {
        const result = [], errors = [];
        fs.readdirSync(this.trips).filter(validId).forEach((id) => {
            try { result.push(this.read(id)); } catch (e) { errors.push(id + ': ' + e.message); }
        });
        this.historyErrors = errors;
        return result.sort((a, b) => b.startedAt - a.startedAt);
    }
    index() {
        if (this.indexBlocked) return;
        try {
            const trips = this.history().map((s) => ({ id: s.id, name: s.name, startedAt: s.startedAt, status: s.status }));
            atomic(path.join(this.trips, 'index.json'), { schemaVersion: 1, trips });
        } catch (e) { this.errors.push('Trip summaries saved; index update failed: ' + e.message); this.errors = this.errors.slice(-10); }
    }
    create(settings) {
        const id = 'trip-' + Date.now().toString(36) + '-' + token();
        fs.mkdirSync(path.join(this.trips, id));
        const summary = { schemaVersion: 1, id, name: 'Trip ' + new Date().toISOString(), annotation: '',
            status: 'recording', startedAt: Date.now(), endedAt: null, updatedAt: Date.now(), sequence: 0,
            policy: C.policy(settings), gaps: [], missingWallMs: 0, lastWallAt: null, timelineMs: 0,
            sources: require('./sources').DEFINITIONS, sourceNotes: require('./sources').NOTES };
        summary.stats = C.create(summary.policy);
        atomic(path.join(this.directory(id), 'summary.json'), summary); this.index();
        return summary;
    }
    save(summary) {
        summary.updatedAt = Date.now();
        atomic(path.join(this.directory(summary.id), 'summary.json'), summary);
    }
    chunk(id, sequence, rows) {
        const dir = this.directory(id), name = 'samples-' + String(sequence).padStart(9, '0') + '.jsonl';
        const file = path.join(dir, name);
        if (fs.existsSync(file)) throw new Error('Sample chunk already exists; original preserved');
        const content = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
        if (Buffer.byteLength(content) > 1024 * 1024) throw new Error('Sample batch exceeds 1 MiB; recording interrupted');
        const temp = file + '.' + token() + '.tmp', fd = fs.openSync(temp, 'wx');
        try { fs.writeFileSync(fd, content); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
        fs.renameSync(temp, file);
    }
    chunkNames(id) {
        return fs.readdirSync(this.directory(id)).filter((n) => /^samples-[0-9]{9}\.jsonl$/.test(n)).sort();
    }
    async samples(id, visit) {
        const dir = this.directory(id), names = this.chunkNames(id);
        let previous = null;
        for (let i = 0; i < names.length; i++) {
            const file = path.join(dir, names[i]);
            if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink() || fs.statSync(file).size > 1024 * 1024) throw new Error('Unsupported sample chunk; preserved');
            const lines = fs.readFileSync(file, 'utf8').split('\n').filter((line) => line.length);
            for (const line of lines) {
                const row = JSON.parse(line);
                if (row.schemaVersion !== 1 || !Number.isFinite(row.recordedMs) || !Number.isFinite(row.elapsedMs) ||
                    !Number.isFinite(row.wallAt) || typeof row.segment !== 'string' || !row.values ||
                    !['gps', 'speed', 'rpm', 'gear', 'fuel'].every((k) => row.values[k] && typeof row.values[k].state === 'string') ||
                    row.recordedMs < 0 || previous && row.recordedMs < previous.recordedMs) throw new Error('Invalid sample timeline; original preserved');
                await visit(row); previous = row;
            }
            if (i % 8 === 0) await new Promise((resolve) => setImmediate(resolve));
        }
    }
    async recover(id) {
        const summary = this.read(id);
        if (summary.status === 'finished') throw new Error('Finished trips cannot be recovered');
        const stats = C.create(summary.policy); let last = null;
        await this.samples(id, (row) => { C.accept(stats, last, row, summary.policy); last = row; });
        summary.stats = stats; summary.status = 'interrupted';
        if (last) {
            summary.lastWallAt = last.wallAt; summary.timelineMs = last.elapsedMs;
            summary.missingWallMs = Math.max(0, last.elapsedMs - last.recordedMs);
        }
        const names = this.chunkNames(id);
        summary.sequence = names.length ? Number(names[names.length - 1].slice(8, 17)) : 0;
        return { summary, last };
    }
    edit(id, name, annotation) {
        const summary = this.read(id);
        if (summary.status === 'recording') throw new Error('Interrupt or finish recording before editing metadata');
        if (!name.trim() || name.length > 48 || annotation.length > 160) throw new Error('Name or annotation is too long or empty');
        summary.name = name.trim(); summary.annotation = annotation.trim(); this.save(summary); this.index();
        return summary;
    }
    delete(id) {
        const summary = this.read(id);
        if (summary.status === 'recording') throw new Error('Close or recover the interrupted recording before deletion');
        const dir = this.directory(id), names = fs.readdirSync(dir);
        names.forEach((name) => {
            if (!/^(summary\.json|samples-[0-9]{9}\.jsonl)(\.[a-f0-9]{12}\.tmp)?$/.test(name)) throw new Error('Unknown file in trip directory; nothing deleted');
            const info = fs.lstatSync(path.join(dir, name));
            if (!info.isFile() || info.isSymbolicLink()) throw new Error('Unexpected trip entry; nothing deleted');
        });
        names.forEach((name) => fs.unlinkSync(path.join(dir, name)));
        fs.rmdirSync(dir); this.index();
    }
    usage() {
        let bytes = 0; this.usageIncomplete = false;
        fs.readdirSync(this.trips).filter(validId).forEach((id) => {
            try {
                const dir = this.directory(id);
                fs.readdirSync(dir).forEach((n) => { const st = fs.lstatSync(path.join(dir, n)); if (st.isFile() && !st.isSymbolicLink()) bytes += st.size; });
            } catch (e) { this.usageIncomplete = true; this.errors.push('Storage usage incomplete: ' + e.message); }
        });
        this.errors = this.errors.slice(-10);
        return bytes;
    }
}
module.exports = { Storage, validId };

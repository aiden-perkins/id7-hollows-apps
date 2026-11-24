'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const C = require('./calculations');

const validId = (id) => typeof id === 'string' && /^trip-[a-z0-9]+-[a-f0-9]{12}$/.test(id);
const bulkDeletable = (s) => !s.demo && s.status !== 'recording' && s.favorite !== true;
const deletedDirectory = /^\.deleted-trip-[a-z0-9]+-[a-f0-9]{12}-[a-f0-9]{12}$/;
const CHUNK_LIMIT = 1024 * 1024;
const STALE_FINISH = 'recording interrupted';
function token() { return crypto.randomBytes(6).toString('hex'); }
function atomic(file, content) {
    const temporary = file + '.' + token() + '.tmp';
    const fd = fs.openSync(temporary, 'wx');
    try {
        try {
            fs.writeFileSync(fd, content);
            fs.fsyncSync(fd);
        } finally { fs.closeSync(fd); }
        fs.renameSync(temporary, file);
    } catch (error) {
        try { fs.unlinkSync(temporary); } catch (cleanupError) { /* Keep the original write error. */ }
        throw error;
    }
}
const writeJson = (file, value) => atomic(file, JSON.stringify(value, null, 2) + '\n');
const chunkSequence = (name) => Number(name.slice(8, 17));

function ended(summary) {
    if (summary.status === 'finished') return summary;
    return Object.assign({}, summary, {
        status: 'finished',
        endedAt: summary.lastWallAt || summary.endedAt || summary.startedAt,
        finishReason: STALE_FINISH,
        interruptionReason: summary.interruptionReason || 'Recording ended before the final checkpoint',
    });
}

class Storage {
    constructor(dir) {
        this.dir = dir;
        this.trips = path.join(dir, 'trips');
        this.errors = [];
        this.historyErrors = [];
        this.settingsBlocked = false;
        this.indexBlocked = false;
    }
    warn(message) {
        if (!this.errors.includes(message)) this.errors = this.errors.slice(-9).concat(message);
    }
    tripDirectory() {
        if (!fs.lstatSync(this.trips).isDirectory()) throw new Error('Trip storage is not a regular directory');
        return this.trips;
    }
    prepare(id) {
        if (!validId(id)) throw new Error('Invalid trip ID');
        for (const dir of [this.trips, path.join(this.trips, id)]) {
            try { fs.mkdirSync(dir); } catch (error) { if (error.code !== 'EEXIST') throw error; }
            if (!fs.lstatSync(dir).isDirectory()) throw new Error('Trip storage is not a regular directory');
        }
    }
    settings() {
        const defaults = { schemaVersion: 1, units: 'US', precision: 3, dateFormat: 'US12',
            automatic: true, smoothing: true, speedBands: Array.from({ length: 20 }, (_, i) => 10 + i * 10) };
        try {
            const file = path.join(this.dir, 'settings.json'), info = fs.lstatSync(file);
            if (!info.isFile() || info.size > CHUNK_LIMIT) throw new Error('Unsupported settings file');
            const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Unsupported settings file');
            const s = Object.assign({}, defaults, saved);
            if (s.schemaVersion !== 1 || s.units !== 'US' || s.precision !== 3 || s.dateFormat !== 'US12' ||
                typeof s.automatic !== 'boolean' || typeof s.smoothing !== 'boolean' ||
                !Array.isArray(s.speedBands) || (s.speedBands.length < 1 || s.speedBands.length > 64) ||
                !s.speedBands.every((v, i) => Number.isFinite(v) && v > 1 && v <= 250 && (!i || v > s.speedBands[i - 1]))) throw new Error('Unsupported or invalid settings');
            // Apply the requested bands to future recordings; saved trip policies remain immutable.
            return Object.assign(defaults, { automatic: s.automatic, smoothing: s.smoothing });
        } catch (e) {
            if (e.code !== 'ENOENT') {
                this.settingsBlocked = !e.code;
                this.warn('Settings preserved: ' + e.message);
            }
            return defaults;
        }
    }
    saveSettings(value) {
        if (this.settingsBlocked) throw new Error('Saved settings are malformed or unsupported and have been preserved');
        const file = path.join(this.dir, 'settings.json');
        let saved = {};
        try { saved = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
        writeJson(file, Object.assign({}, saved, value));
    }
    directory(id) {
        if (!validId(id)) throw new Error('Invalid trip ID');
        const dir = path.join(this.tripDirectory(), id);
        if (!fs.lstatSync(dir).isDirectory()) throw new Error('Unsafe trip storage path');
        return dir;
    }
    read(id) {
        const dir = this.directory(id);
        const file = path.join(dir, 'summary.json');
        const info = fs.lstatSync(file);
        if (!info.isFile() || info.size > CHUNK_LIMIT) throw new Error('Unsupported trip summary file');
        const s = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!s || ![1, 2].includes(s.schemaVersion) || s.id !== id || !s.policy || ![1, 2, 3, 4].includes(s.policy.calculationVersion) ||
            !s.stats || !Number.isFinite(s.stats.durationMs) || s.stats.durationMs < 0 ||
            !['recording', 'finished', 'interrupted'].includes(s.status) || typeof s.name !== 'string' ||
            s.favorite !== undefined && typeof s.favorite !== 'boolean' ||
            !Number.isFinite(s.startedAt) || !Array.isArray(s.gaps)) throw new Error('Invalid or unsupported trip summary; preserved');
        if (s.policy.calculationVersion === 2 && (!Number.isFinite(s.stats.distanceMs) || s.stats.distanceMs < 0 ||
            !Number.isFinite(s.stats.movingDistanceMs) || s.stats.movingDistanceMs < 0 ||
            !['gpsMaxGapMs', 'gpsMaxMph', 'gpsSpeedToleranceMph', 'gpsJumpSlackMeters'].every((k) => Number.isFinite(s.policy[k]) && s.policy[k] > 0) ||
            !Array.isArray(s.policy.speedBands))) throw new Error('Invalid GPS calculation policy; preserved');
        if ([3, 4].includes(s.policy.calculationVersion) && (!Number.isFinite(s.stats.distanceMs) || s.stats.distanceMs < 0 ||
            !Number.isFinite(s.stats.movingDistanceMs) || s.stats.movingDistanceMs < 0 ||
            !Number.isFinite(s.policy.maxIntervalMs) || s.policy.maxIntervalMs <= 0 ||
            !Array.isArray(s.policy.speedBands))) throw new Error('Invalid vehicle-speed calculation policy; preserved');
        return s;
    }
    history(activeId) {
        const result = [], errors = [];
        let names;
        try { names = fs.readdirSync(this.tripDirectory()); }
        catch (error) { if (error.code !== 'ENOENT') throw error; names = []; }
        for (const id of names) {
            if (id === activeId || !validId(id)) continue;
            try { result.push(ended(this.read(id))); }
            catch (error) { if (error.code !== 'ENOENT') errors.push(id + ': ' + error.message); }
        }
        this.historyErrors = errors;
        return result.sort((a, b) => b.startedAt - a.startedAt);
    }
    index(summaries) {
        if (this.indexBlocked) return;
        try {
            const file = path.join(this.tripDirectory(), 'index.json');
            let previous;
            try {
                const info = fs.lstatSync(file);
                if (!info.isFile() || info.size > CHUNK_LIMIT) throw new Error('Unsupported index file');
                previous = fs.readFileSync(file, 'utf8');
            } catch (error) {
                if (error.code && error.code !== 'ENOENT') throw error;
                if (!error.code) {
                    this.indexBlocked = true;
                    this.warn('Trip index preserved: ' + error.message);
                    return;
                }
            }
            if (previous !== undefined) {
                try {
                    const index = JSON.parse(previous);
                    if (!index || ![1, 2].includes(index.schemaVersion) || !Array.isArray(index.trips)) throw new Error('Unsupported index schema');
                } catch (error) {
                    this.indexBlocked = true;
                    this.warn('Trip index preserved: ' + error.message);
                    return;
                }
            }
            const trips = summaries.map((s) => ({ id: s.id, name: s.name, startedAt: s.startedAt, status: s.status, favorite: s.favorite === true }));
            writeJson(file, { schemaVersion: 2, trips });
        } catch (error) { this.warn('Trip index update failed: ' + error.message); }
    }
    create(settings) {
        const startedAt = Date.now(), id = 'trip-' + startedAt.toString(36) + '-' + token();
        const summary = { schemaVersion: 2, id, name: 'Trip ' + new Date(startedAt).toISOString(), annotation: '', favorite: false,
            status: 'recording', startedAt, endedAt: null, updatedAt: startedAt, sequence: 0,
            policy: C.policy(settings), gaps: [], missingWallMs: 0, lastWallAt: null, timelineMs: 0,
            sources: require('./sources').DEFINITIONS, sourceNotes: require('./sources').NOTES };
        summary.stats = C.create(summary.policy);
        return summary;
    }
    save(summary) {
        const updatedAt = Date.now();
        writeJson(path.join(this.directory(summary.id), 'summary.json'), Object.assign({}, summary, { updatedAt }));
        summary.updatedAt = updatedAt;
    }
    chunk(id, sequence, rows) {
        const dir = this.directory(id), name = 'samples-' + String(sequence).padStart(9, '0') + '.jsonl';
        const file = path.join(dir, name);
        if (fs.existsSync(file)) throw new Error('Sample chunk already exists; original preserved');
        const content = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
        if (Buffer.byteLength(content) > CHUNK_LIMIT) throw new Error('Sample batch exceeds 1 MiB');
        atomic(file, content);
    }
    chunkNames(id) {
        return fs.readdirSync(this.directory(id)).filter((n) => /^samples-[0-9]{9}\.jsonl$/.test(n)).sort();
    }
    async samples(id, visit, names = this.chunkNames(id), cancelled = () => false) {
        const dir = this.directory(id);
        let last = null, skipped = 0, sequence = 0, gap = false;
        for (const name of names) {
            await new Promise((resolve) => setImmediate(resolve));
            if (cancelled()) break;
            const file = path.join(dir, name), next = chunkSequence(name);
            if (next > sequence + 1) {
                skipped += next - sequence - 1;
                gap = true;
            }
            sequence = next;
            let rows;
            try {
                const info = fs.lstatSync(file);
                if (!info.isFile() || info.size > CHUNK_LIMIT) throw new Error('Unsupported sample chunk');
                rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
                if (!rows.length) throw new Error('Empty sample chunk');
                let previous = last;
                for (const row of rows) {
                    if (!row || ![1, 2].includes(row.schemaVersion) || !Number.isFinite(row.recordedMs) || !Number.isFinite(row.elapsedMs) ||
                        !Number.isFinite(row.wallAt) || typeof row.segment !== 'string' || !row.values ||
                        !['gps', 'speed', 'rpm', 'gear', 'fuel'].every((k) => row.values[k] && typeof row.values[k].state === 'string') ||
                        row.recordedMs < 0 || previous && (row.recordedMs < previous.recordedMs || row.elapsedMs < previous.elapsedMs)) throw new Error('Invalid sample timeline');
                    previous = row;
                }
            } catch (error) {
                skipped++;
                gap = true;
                continue;
            }
            for (const row of rows) {
                if (gap) row.gapBefore = true;
                visit(row);
                last = row;
                gap = false;
            }
        }
        return skipped;
    }
    remove(id, protectFavorites) {
        const summary = ended(this.read(id));
        if (protectFavorites && !bulkDeletable(summary)) throw new Error('Trip is protected from bulk deletion');
        const dir = this.directory(id), names = fs.readdirSync(dir);
        names.forEach((name) => {
            if (!/^(summary\.json|samples-[0-9]{9}\.jsonl)(\.[a-f0-9]{12}\.tmp)?$/.test(name)) throw new Error('Unknown file in trip directory; nothing deleted');
            const info = fs.lstatSync(path.join(dir, name));
            if (!info.isFile() || info.isSymbolicLink()) throw new Error('Unexpected trip entry; nothing deleted');
        });
        // Remove the recording from History as one operation before cleaning up its files.
        const removed = path.join(this.trips, '.deleted-' + id + '-' + token());
        fs.renameSync(dir, removed);
        try {
            names.forEach((name) => fs.unlinkSync(path.join(removed, name)));
            fs.rmdirSync(removed);
        } catch (e) {
            this.warn('Trip removed from History. File cleanup incomplete: ' + e.message);
        }
    }
    usage() {
        let bytes = 0; this.usageIncomplete = false;
        let names;
        try { names = fs.readdirSync(this.tripDirectory()); }
        catch (error) { if (error.code !== 'ENOENT') throw error; return 0; }
        names.filter((id) => validId(id) || deletedDirectory.test(id)).forEach((id) => {
            try {
                const dir = validId(id) ? this.directory(id) : path.join(this.trips, id);
                if (!fs.lstatSync(dir).isDirectory()) throw new Error('Unsafe trip storage path');
                fs.readdirSync(dir).forEach((n) => { const st = fs.lstatSync(path.join(dir, n)); if (st.isFile() && !st.isSymbolicLink()) bytes += st.size; });
            } catch (e) { this.usageIncomplete = true; this.warn('Storage usage incomplete: ' + e.message); }
        });
        this.errors = this.errors.slice(-10);
        return bytes;
    }
}
module.exports = { Storage, validId, bulkDeletable, ended, STALE_FINISH, chunkSequence, CHUNK_LIMIT };

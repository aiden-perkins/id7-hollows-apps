'use strict';
const C = require('./calculations');
const { mono } = require('./sources');
const { bulkDeletable, ended, CHUNK_LIMIT } = require('./storage');

const CHECKPOINT_MS = 5000;
const MAX_BUFFERED_ROWS = 600, MAX_BUFFERED_BYTES = 4 * CHUNK_LIMIT, MAX_PENDING_BYTES = 8 * CHUNK_LIMIT;
const ENGINE_SESSION = {
    source: 'VehicleCondition.statusConditionVehicle; CDS.statusEngineStatus fallback',
    startMs: 2000, stopMs: 3000,
};

function trimBuffer(session, maxRows, maxBytes) {
    let count = 0, bytes = session.bufferBytes;
    while (session.buffer.length - count > maxRows || bytes > maxBytes) {
        bytes -= session.buffer[count++].size;
    }
    if (!count) return 0;
    session.buffer.splice(0, count);
    const dropped = session.bufferBytes - bytes;
    session.bufferBytes = bytes;
    session.summary.samplesOmitted = (session.summary.samplesOmitted || 0) + count;
    if (session.buffer.length) session.buffer[0].row.gapBefore = true;
    return dropped;
}

class Recorder {
    constructor(storage, sources, changed, log) {
        this.storage = storage;
        this.sources = sources;
        this.changed = changed;
        this.log = log;
        this.settings = storage.settings();
        this.session = null;
        this.pending = new Map();
        this.storedHistory = [];
        this.historyError = '';
        this.settingsError = '';
        this.timer = null;
        this.closed = false;
        this.vehicleEnabled = false;
        this.automaticHold = false;
        this.engineCandidate = null;
        this.powerOff = false;
        this.driveState = null;
        this.retryAt = 0;
        this.nextAutomaticStart = 0;
        this.indexDirty = false;
        this.serviceTimer = setInterval(() => this.service(), 250);
        if (this.serviceTimer.unref) this.serviceTimer.unref();
    }
    get active() { return this.session ? this.session.summary : null; }

    configure(key, value) {
        this.settings = Object.assign({}, this.settings, { [key]: value });
        if (key === 'automatic') {
            this.engineCandidate = null;
            if (!value) this.automaticHold = false;
        }
        try {
            this.storage.saveSettings(this.settings);
            this.settingsError = '';
        } catch (error) {
            this.settingsError = 'Setting applied for this session. Could not save it.';
            this.log.warn(error);
        }
        this.changed();
    }
    setVehicleEnabled(enabled) {
        if (this.vehicleEnabled === enabled) return;
        this.vehicleEnabled = enabled;
        this.engineCandidate = null;
        this.driveState = null;
        this.powerOff = false;
        this.syncSources();
        this.changed();
    }
    syncSources() {
        if (this.closed) return;
        try {
            if (this.session) this.sources.start();
            else if (this.vehicleEnabled) this.sources.monitor();
            else this.sources.stop();
        } catch (error) { this.log.warn(error); }
    }
    retrySources() {
        this.engineCandidate = null;
        this.nextAutomaticStart = 0;
        this.sources.retry();
        this.changed();
    }
    automaticStatus() {
        if (!this.settings.automatic) return 'Off';
        if (!this.vehicleEnabled) return 'Paused';
        if (this.session) return 'On / recording';
        return this.automaticHold ? 'On / waiting for the next drive' : 'On / waiting for drive readiness';
    }

    observeVehicle(now) {
        if (!this.vehicleEnabled) return;
        const { driveState, power, engine } = this.sources.lifecycle(now);
        const session = this.session, ready = driveState === 'ready';
        const ending = driveState === 'ending' && this.driveState !== 'ending';
        this.driveState = driveState;
        if (session && ready) session.sawReady = true;
        if (power !== null) {
            const powerOff = power === 'off';
            const justPoweredOff = powerOff && !this.powerOff;
            this.powerOff = powerOff;
            if (powerOff) {
                this.automaticHold = false;
                this.engineCandidate = null;
                if (session && justPoweredOff) this.finish('head unit powered off', false);
                return;
            }
        }
        if (driveState !== null) {
            this.engineCandidate = null;
            if (driveState === 'parked' || driveState === 'ending') {
                this.automaticHold = false;
                if (session && (session.sawReady || ending)) this.finish('drive ended', false);
            } else if (ready) this.maybeStart('drive ready', now);
            return;
        }
        if (!this.settings.automatic) return;
        const state = engine.state === 'live' && ['off', 'running'].includes(engine.value) ? engine.value : null;
        if (!state) { this.engineCandidate = null; return; }
        if (session && state === 'running') session.sawEngineRunning = true;
        const candidate = this.engineCandidate;
        if (!candidate || candidate.state !== state || candidate.epoch !== engine.epoch) {
            this.engineCandidate = { state, since: now, epoch: engine.epoch, receivedMono: engine.receivedMono };
            return;
        }
        const delay = state === 'off' ? ENGINE_SESSION.stopMs : ENGINE_SESSION.startMs;
        if (now - candidate.since < delay || engine.receivedMono <= candidate.receivedMono) return;
        if (state === 'off') {
            this.automaticHold = false;
            if (session && session.sawEngineRunning) this.finish('engine stopped', false);
        } else this.maybeStart('engine running', now);
    }
    maybeStart(reason, now) {
        if (this.session || !this.settings.automatic || this.automaticHold || now < this.nextAutomaticStart) return;
        this.nextAutomaticStart = now + CHECKPOINT_MS;
        this.start(reason);
    }
    service() {
        if (this.closed) return;
        const now = mono();
        try { this.observeVehicle(now); } catch (error) { this.log.warn(error); }
        if (!this.pending.size || now < this.retryAt) return;
        this.retryAt = now + CHECKPOINT_MS;
        const session = this.pending.values().next().value, trip = session.summary;
        this.pending.delete(trip.id);
        if (this.checkpoint(session)) {
            this.indexDirty = true;
            this.changed({ type: 'stored', trip });
        } else {
            // Rotate the queue so a bad trip directory cannot delay the other saves.
            this.pending.set(trip.id, session);
        }
    }

    start(reason = 'manual') {
        if (this.closed) throw new Error('Recorder is closed');
        if (this.session) return this.session.summary;
        const summary = this.storage.create(this.settings), now = mono();
        summary.startReason = reason;
        if (this.settings.automatic) summary.engineSessionPolicy = Object.assign({}, ENGINE_SESSION);
        const session = {
            summary, startedMono: now, lastFlush: now, previous: null, buffer: [], bufferBytes: 0,
            segment: 0, gapBefore: false, initialized: false, saveError: '', sampleError: '',
            sawReady: this.driveState === 'ready', sawEngineRunning: reason === 'engine running',
        };
        this.session = session;
        this.engineCandidate = null;
        this.syncSources();
        this.checkpoint(session);
        this.timer = setInterval(() => this.tick(), C.SAMPLE_MS);
        if (this.timer.unref) this.timer.unref();
        this.changed({ type: 'start', trip: summary });
        this.tick();
        return summary;
    }
    tick(flush = true) {
        const session = this.session;
        if (!session) return;
        const now = mono(), s = session.summary;
        try {
            const recordedMs = Math.max(0, now - session.startedMono);
            const row = { schemaVersion: 2, segment: s.id + ':' + session.segment, recordedMs, elapsedMs: recordedMs,
                wallAt: Date.now(), values: this.sources.sample(now, false) };
            const peak = this.sources.takeRpmPeak();
            if (peak !== null) row.values.rpm.peak = peak;
            const interval = C.accept(s.stats, session.previous, row, s.policy);
            row.distanceMiles = interval.distance !== null ? s.stats.distanceMiles : null;
            if (interval.distance !== null && interval.distanceMs > 0) {
                row.distanceStartMs = interval.distanceStartMs;
                row.distanceEndMs = interval.distanceEndMs;
                row.distanceIntervals = interval.distanceIntervals;
            }
            row.mpg = Number.isFinite(interval.mpg) ? interval.mpg : null;
            session.previous = row;
            // Leave room to mark this as a gap if older buffered samples are dropped.
            let size = Infinity;
            try { size = Buffer.byteLength(JSON.stringify(row)) + 32; }
            catch (error) { if (!session.gapBefore) this.log.warn(error); }
            if (size <= CHUNK_LIMIT) {
                s.lastWallAt = row.wallAt;
                s.timelineMs = row.elapsedMs;
                if (session.gapBefore) row.gapBefore = true;
                session.buffer.push({ row, size });
                session.bufferBytes += size;
                session.gapBefore = false;
                trimBuffer(session, MAX_BUFFERED_ROWS, MAX_BUFFERED_BYTES);
            } else {
                s.samplesOmitted = (s.samplesOmitted || 0) + 1;
                session.gapBefore = true;
            }
            session.sampleError = '';
            this.changed({ type: 'sample', trip: s, row });
        } catch (error) {
            if (session.sampleError !== error.message) this.log.warn(error);
            session.sampleError = error.message;
            session.segment++;
            s.samplesOmitted = (s.samplesOmitted || 0) + 1;
            this.changed();
        }
        if (flush && (session.buffer.length >= 64 && !session.saveError || now - session.lastFlush >= CHECKPOINT_MS)) this.checkpoint(session);
    }
    checkpoint(session) {
        const s = session.summary;
        session.lastFlush = mono();
        try {
            if (!session.initialized) {
                this.storage.prepare(s.id);
                const emptyRecording = s.status === 'recording' && !s.stats.samples;
                // Keep metadata available if power is cut between the next chunk and summary writes.
                this.storage.save(emptyRecording ? s : Object.assign({}, s, { status: 'recording', endedAt: null, sequence: 0,
                    lastWallAt: null, timelineMs: 0, stats: C.create(s.policy) }));
                session.initialized = true;
                if (emptyRecording) {
                    session.saveError = '';
                    return true;
                }
            }
            while (session.buffer.length) {
                const batch = [];
                let bytes = 0;
                for (const sample of session.buffer) {
                    if (batch.length === 64 || bytes + sample.size > CHUNK_LIMIT) break;
                    batch.push(sample.row);
                    bytes += sample.size;
                }
                const sequence = s.sequence + 1;
                this.storage.chunk(s.id, sequence, batch);
                s.sequence = sequence;
                session.buffer.splice(0, batch.length);
                session.bufferBytes -= bytes;
            }
            this.storage.save(s);
            session.saveError = '';
            return true;
        } catch (error) {
            if (session.saveError !== error.message) this.log.warn(error);
            session.saveError = error.message;
            return false;
        }
    }
    finish(reason = 'manual', takeSample = true) {
        const session = this.session;
        if (!session) return null;
        clearInterval(this.timer);
        this.timer = null;
        if (takeSample) this.tick(false);

        const s = session.summary;
        s.status = 'finished';
        s.endedAt = s.lastWallAt || s.startedAt;
        s.finishReason = reason;
        s.stats.economyWindow = [];
        this.session = null;
        this.engineCandidate = null;
        if (reason === 'manual' && this.settings.automatic) this.automaticHold = true;
        else this.nextAutomaticStart = mono() + 2000;

        if (this.checkpoint(session)) this.indexDirty = true;
        else {
            if (!this.pending.size) this.retryAt = mono() + CHECKPOINT_MS;
            this.pending.set(s.id, session);
            let excess = Array.from(this.pending.values()).reduce((total, item) => total + item.bufferBytes, 0) - MAX_PENDING_BYTES;
            for (const item of this.pending.values()) {
                if (excess <= 0) break;
                excess -= trimBuffer(item, MAX_BUFFERED_ROWS, Math.max(0, item.bufferBytes - excess));
            }
        }
        this.syncSources();
        this.changed({ type: 'finish', trip: s, reason });
        return s;
    }
    notice() {
        if (this.session && this.session.saveError) return 'Save delayed. Recording in memory.';
        if (this.session && this.session.sampleError) return 'Some samples unavailable. Still recording.';
        return this.pending.size ? 'Trip save pending. Retrying.' : '';
    }

    history() {
        const activeId = this.active && this.active.id;
        try {
            this.storedHistory = this.storage.history(activeId);
            this.historyError = '';
            if (this.indexDirty) {
                this.indexDirty = false;
                this.storage.index(this.storedHistory);
            }
        } catch (error) {
            if (this.historyError !== error.message) this.log.warn(error);
            this.historyError = error.message;
        }
        const trips = new Map(this.storedHistory.map((s) => [s.id, s]));
        for (const session of this.pending.values()) trips.set(session.summary.id, session.summary);
        trips.delete(activeId);
        return Array.from(trips.values()).sort((a, b) => b.startedAt - a.startedAt);
    }
    pendingSamples(id) {
        const session = this.pending.get(id);
        return session ? { onDisk: session.initialized, rows: session.buffer.map((sample) => sample.row) } : { onDisk: true, rows: [] };
    }
    saved(id) {
        if (this.active && this.active.id === id) throw new Error('This trip is still recording');
        const pending = this.pending.get(id);
        return pending ? pending.summary : ended(this.storage.read(id));
    }
    updateSaved(id, change) {
        const summary = this.saved(id), next = Object.assign({}, summary, change(summary)), pending = this.pending.get(id);
        if (pending) pending.summary = next;
        else {
            this.storage.save(next);
            this.indexDirty = true;
            this.storedHistory = this.storedHistory.map((trip) => trip.id === id ? next : trip);
        }
        return next;
    }
    edit(id, name, annotation) {
        if (!name.trim() || name.length > 48 || annotation.length > 160) throw new Error('Enter a name of 1–48 characters and a note of up to 160');
        return this.updateSaved(id, () => ({ name: name.trim(), annotation: annotation.trim() }));
    }
    favorite(id) {
        return this.updateSaved(id, (trip) => ({ favorite: !trip.favorite }));
    }
    deleteTrips(ids, protectFavorites) {
        let deleted = 0;
        const failures = [];
        for (const id of new Set(ids)) {
            try {
                const trip = this.saved(id), pending = this.pending.get(id);
                if (protectFavorites && !bulkDeletable(trip)) throw new Error('Trip is protected from bulk deletion');
                if (!pending || pending.initialized) this.storage.remove(id, protectFavorites && !pending);
                this.pending.delete(id);
                this.storedHistory = this.storedHistory.filter((s) => s.id !== id);
                this.indexDirty = true;
                deleted++;
            } catch (error) { failures.push(error); }
        }
        return { deleted, failures };
    }

    close() {
        if (this.closed) return;
        this.closed = true;
        clearInterval(this.serviceTimer);
        try {
            this.finish('app closed', false);
            for (const session of this.pending.values()) this.checkpoint(session);
        } finally { this.sources.close(); }
    }
}

module.exports = { Recorder };

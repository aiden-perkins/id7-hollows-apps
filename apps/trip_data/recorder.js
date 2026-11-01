'use strict';
const crypto = require('crypto');
const C = require('./calculations');
const { mono } = require('./sources');

const ENGINE_SESSION = { runningRpm: 400, startMs: 2000, stopMs: 3000 };

class Recorder {
    constructor(storage, sources, changed) {
        this.storage = storage; this.sources = sources; this.changed = changed;
        this.settings = storage.settings(); this.active = null; this.previous = null; this.buffer = [];
        this.recent = []; this.closed = false; this.timer = null; this.error = '';
        this.history = storage.history(); this.interrupted = this.history.filter((s) => s.status !== 'finished');
        this.automaticEnabled = false; this.automaticHold = this.settings.engineSessionHold === true; this.automaticFault = false;
        this.engineState = 'unknown'; this.engineCandidate = null; this.automaticTimer = null;
    }
    configure(key, value) {
        if (this.active && key !== 'smoothing') throw new Error('Recording policy is fixed for the active trip. Finish it before changing recording settings.');
        const next = Object.assign({}, this.settings, { [key]: value });
        this.storage.saveSettings(next); this.settings = next;
        this.engineCandidate = null; this.automaticFault = false; this.syncAutomatic(); this.changed();
    }
    retrySources() {
        this.automaticFault = false; this.engineCandidate = null;
        this.syncAutomatic(); this.sources.retry(); this.changed();
    }
    setAutomaticHold(held) {
        if (held === this.automaticHold) return;
        const next = Object.assign({}, this.settings, { engineSessionHold: held });
        this.storage.saveSettings(next); this.settings = next; this.automaticHold = held;
    }
    setAutomaticEnabled(enabled) {
        if (this.automaticEnabled === enabled) return;
        this.automaticEnabled = enabled; this.engineState = 'unknown'; this.engineCandidate = null;
        this.syncAutomatic(); this.changed();
    }
    syncAutomatic() {
        clearInterval(this.automaticTimer); this.automaticTimer = null;
        if (this.closed) return;
        const wanted = this.automaticEnabled && this.settings.automatic && !this.automaticFault;
        if (this.active && this.active.status === 'recording') this.sources.start(this.active.policy.sampleMs);
        else if (wanted && !this.active && !this.interrupted.length) this.sources.monitor(this.settings.sampleMs);
        else this.sources.stop();
        if (wanted && (!this.active || this.active.status === 'recording') && !this.interrupted.length) {
            this.automaticTimer = setInterval(() => this.observeEngine(), 250);
            if (this.automaticTimer.unref) this.automaticTimer.unref();
        }
    }
    automaticStatus() {
        if (!this.settings.automatic) return 'off';
        if (!this.automaticEnabled) return 'paused in demo/preview';
        if (this.automaticFault) return 'paused after recording error';
        if (this.interrupted.length || this.active && this.active.status !== 'recording') return 'resolve interrupted trips first';
        if (this.automaticHold && !this.active) return 'waiting for engine off, then next start';
        if (this.active) return 'recording / waiting for sustained zero RPM';
        return this.engineState === 'off' ? 'armed / engine stopped' : 'armed / waiting for live running RPM';
    }
    observeEngine() {
        if (this.closed || !this.automaticEnabled || !this.settings.automatic || this.automaticFault ||
            this.interrupted.length || this.active && this.active.status !== 'recording') return;
        const now = mono(), rpm = this.sources.sample(now).rpm;
        const state = rpm && rpm.state === 'live' && Number.isFinite(rpm.value) ?
            rpm.value === 0 ? 'off' : rpm.value >= ENGINE_SESSION.runningRpm ? 'running' : 'unknown' : 'unknown';
        if (state === 'unknown') { this.engineCandidate = null; return; }
        if (!this.engineCandidate || this.engineCandidate.state !== state || this.engineCandidate.epoch !== rpm.epoch) {
            this.engineCandidate = { state, since: now, receivedMono: rpm.receivedMono, epoch: rpm.epoch };
            return;
        }
        const delay = state === 'running' ? ENGINE_SESSION.startMs : ENGINE_SESSION.stopMs;
        if (now - this.engineCandidate.since < delay || rpm.receivedMono <= this.engineCandidate.receivedMono) return;
        const actionNeeded = state === 'off' ? this.automaticHold || !!this.active : !this.active && !this.automaticHold;
        if (state === this.engineState && !actionNeeded) return;
        this.engineState = state;
        try {
            if (state === 'off') {
                this.setAutomaticHold(false);
                if (this.active) this.finish('engine stopped');
            } else if (!this.active && !this.automaticHold) this.start('engine running');
            this.changed();
        } catch (e) {
            this.automaticFault = true;
            this.error = 'Automatic recording paused: ' + e.message;
            this.syncAutomatic(); this.changed();
        }
    }
    begin(summary, previous) {
        this.engineCandidate = null;
        this.active = summary; this.previous = previous; this.buffer = []; this.recent = [];
        this.segment = crypto.randomBytes(6).toString('hex'); this.segmentMono = mono(); this.segmentBase = summary.stats.durationMs;
        this.lastFlush = this.segmentMono; this.error = '';
        summary.status = 'recording'; summary.endedAt = null;
        try { this.storage.save(summary); } catch (e) {
            summary.status = 'interrupted'; this.error = 'Could not checkpoint recording start: ' + e.message; throw e;
        }
        this.sources.start(summary.policy.sampleMs);
        this.timer = setInterval(() => this.tick(), summary.policy.sampleMs);
        if (this.timer.unref) this.timer.unref();
        this.tick(); this.changed();
    }
    start(reason) {
        if (this.active) throw new Error('A trip is already recording');
        if (this.interrupted.length) throw new Error('Recover or close interrupted trips before starting another trip');
        const summary = this.storage.create(this.settings);
        summary.startReason = reason || 'manual';
        if (this.settings.automatic) summary.engineSessionPolicy = Object.assign({}, ENGINE_SESSION);
        try { this.begin(summary, null); } catch (e) { this.fail(e); throw e; }
        if (reason === 'engine running' && this.active.status === 'recording') this.changed({ type: 'automatic-start', trip: summary });
    }
    async recover(id) {
        if (this.active) throw new Error('A trip is already recording');
        const rebuilt = await this.storage.recover(id), s = rebuilt.summary;
        if (s.policy.calculationVersion !== 2) throw new Error('Legacy speed-distance trips can be closed, but cannot resume into GPS recording.');
        const gap = Math.max(0, Date.now() - (s.lastWallAt || s.startedAt));
        s.gaps.push({ after: s.lastWallAt || s.startedAt, before: Date.now(), wallMs: gap, reason: 'Process interruption; no measurements inferred' });
        s.missingWallMs += gap;
        this.interrupted = this.interrupted.filter((v) => v.id !== id);
        this.begin(s, rebuilt.last); this.syncAutomatic();
    }
    tick() {
        if (!this.active || this.closed) return;
        try {
            const now = mono(), s = this.active;
            const row = { schemaVersion: 2, segment: this.segment, recordedMs: this.segmentBase + Math.max(0, now - this.segmentMono),
                wallAt: Date.now(), values: this.sources.sample(now) };
            row.elapsedMs = row.recordedMs + s.missingWallMs;
            const interval = C.accept(s.stats, this.previous, row, s.policy);
            row.distanceMiles = interval.distance !== null ? s.stats.distanceMiles : null;
            if (interval.distance !== null && interval.distanceMs > 0) {
                row.distanceStartMs = interval.distanceStartMs; row.distanceEndMs = interval.distanceEndMs;
                row.distanceIntervals = interval.distanceIntervals;
            }
            row.mpg = null;
            this.previous = row; s.lastWallAt = row.wallAt; s.timelineMs = row.elapsedMs;
            this.buffer.push(row); this.recent.push(row);
            if (this.recent.length > 1200) this.recent.shift();
            if (this.buffer.length >= 64 || now - this.lastFlush >= 5000) this.flush();
            this.changed();
        } catch (e) { this.fail(e); }
    }
    flush() {
        if (!this.active) return;
        const s = this.active;
        while (this.buffer.length) {
            const batch = []; let bytes = 0;
            for (const row of this.buffer) {
                const size = Buffer.byteLength(JSON.stringify(row)) + 1;
                if (size > 1024 * 1024) throw new Error('A single sample exceeds the 1 MiB storage limit');
                if (batch.length && bytes + size > 1024 * 1024) break;
                batch.push(row); bytes += size;
                if (batch.length === 64) break;
            }
            const sequence = s.sequence + 1;
            this.storage.chunk(s.id, sequence, batch);
            s.sequence = sequence; this.buffer = this.buffer.slice(batch.length);
        }
        this.storage.save(s); this.lastFlush = mono();
    }
    fail(e) {
        clearInterval(this.timer); this.timer = null;
        this.error = 'Recording interrupted: ' + e.message + '. Saved chunks retained; unflushed samples remain in memory while the app stays open.';
        if (this.active) {
            this.active.status = 'interrupted'; this.active.interruptionReason = 'Recording failed: ' + e.message;
        }
        this.automaticFault = true; this.syncAutomatic(); this.changed();
    }
    finish(reason) {
        if (!this.active) throw new Error('No active trip');
        if (this.active.status === 'recording') this.tick();
        clearInterval(this.timer); this.timer = null;
        const s = this.active;
        try {
            if (!reason || reason === 'manual') {
                if (this.settings.automatic) this.setAutomaticHold(true);
                this.engineCandidate = null;
            }
            this.flush(); s.status = 'finished'; s.endedAt = Date.now(); s.finishReason = reason || 'manual';
            this.storage.save(s); this.storage.index();
            this.active = null; this.error = ''; this.automaticFault = false;
            this.history = this.storage.history(); this.interrupted = this.history.filter((t) => t.status !== 'finished');
            this.syncAutomatic();
            this.changed(reason === 'engine stopped' ? { type: 'automatic-stop', trip: s } : undefined); return s;
        } catch (e) { s.status = 'interrupted'; this.fail(e); throw e; }
    }
    async closeInterrupted(id) {
        if (this.active) throw new Error('Finish the active trip first');
        const rebuilt = await this.storage.recover(id), s = rebuilt.summary;
        s.status = 'finished'; s.endedAt = s.lastWallAt || s.startedAt; s.finishReason = 'Closed after interruption';
        this.storage.save(s); this.storage.index();
        this.history = this.storage.history(); this.interrupted = this.history.filter((t) => t.status !== 'finished');
        this.syncAutomatic(); this.changed(); return s;
    }
    close() {
        if (this.closed) return;
        clearInterval(this.timer); clearInterval(this.automaticTimer);
        if (this.active) {
            try {
                if (this.active.status === 'recording') this.tick();
                this.flush(); this.active.status = 'interrupted'; this.active.interruptionReason = 'App process closed';
                this.storage.save(this.active); this.storage.index();
            } catch (e) { this.error = e.message; }
        }
        this.closed = true; this.sources.close();
    }
}
module.exports = { Recorder };

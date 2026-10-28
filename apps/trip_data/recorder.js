'use strict';
const crypto = require('crypto');
const C = require('./calculations');
const { mono } = require('./sources');

class Recorder {
    constructor(storage, sources, changed) {
        this.storage = storage; this.sources = sources; this.changed = changed;
        this.settings = storage.settings(); this.active = null; this.previous = null; this.buffer = [];
        this.recent = []; this.rolling = []; this.closed = false; this.timer = null; this.error = '';
        this.history = storage.history(); this.interrupted = this.history.filter((s) => s.status !== 'finished');
    }
    configure(key, value) {
        if (this.active && key !== 'smoothing') throw new Error('Recording policy is fixed for the active trip. Finish it before changing recording settings.');
        const next = Object.assign({}, this.settings, { [key]: value });
        this.storage.saveSettings(next); this.settings = next; this.changed();
    }
    begin(summary, previous) {
        this.active = summary; this.previous = previous; this.buffer = []; this.recent = []; this.rolling = [];
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
    start() {
        if (this.active) throw new Error('A trip is already recording');
        if (this.interrupted.length) throw new Error('Recover or close interrupted trips before starting another trip');
        this.begin(this.storage.create(this.settings), null);
    }
    async recover(id) {
        if (this.active) throw new Error('A trip is already recording');
        const rebuilt = await this.storage.recover(id), s = rebuilt.summary;
        const gap = Math.max(0, Date.now() - (s.lastWallAt || s.startedAt));
        s.gaps.push({ after: s.lastWallAt || s.startedAt, before: Date.now(), wallMs: gap, reason: 'Process interruption; no measurements inferred' });
        s.missingWallMs += gap; this.begin(s, rebuilt.last);
        this.interrupted = this.interrupted.filter((v) => v.id !== id);
    }
    tick() {
        if (!this.active || this.closed) return;
        try {
            const now = mono(), s = this.active;
            const row = { schemaVersion: 1, segment: this.segment, recordedMs: this.segmentBase + Math.max(0, now - this.segmentMono),
                wallAt: Date.now(), values: this.sources.sample(now) };
            row.elapsedMs = row.recordedMs + s.missingWallMs;
            const interval = C.accept(s.stats, this.previous, row, s.policy);
            row.distanceMiles = interval.distance !== null ? s.stats.distanceMiles : null;
            row.mpg = null;
            if (interval.continuous && interval.distance !== null && interval.fuel !== null) {
                this.rolling.push({ at: row.recordedMs, dt: interval.dt, miles: interval.distance, gallons: interval.fuel });
                while (this.rolling.length && this.rolling[0].at < row.recordedMs - 60000) this.rolling.shift();
                const totals = this.rolling.reduce((a, v) => {
                    const overlap = Math.max(0, Math.min(v.at, row.recordedMs) - Math.max(v.at - v.dt, row.recordedMs - 60000));
                    const fraction = overlap / v.dt;
                    return { ms: a.ms + overlap, miles: a.miles + v.miles * fraction, gallons: a.gallons + v.gallons * fraction };
                }, { ms: 0, miles: 0, gallons: 0 });
                if (totals.ms >= 60000 - 0.001) row.mpg = totals.gallons > 0 ? totals.miles / totals.gallons : null;
            } else this.rolling = [];
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
        if (this.active) this.active.status = 'interrupted';
        this.sources.stop(); this.changed();
    }
    finish(reason) {
        if (!this.active) throw new Error('No active trip');
        if (this.active.status === 'recording') this.tick();
        clearInterval(this.timer); this.timer = null;
        const s = this.active;
        try {
            this.flush(); s.status = 'finished'; s.endedAt = Date.now(); s.finishReason = reason || 'manual';
            this.storage.save(s); this.storage.index();
            this.active = null; this.sources.stop(); this.error = '';
            this.history = this.storage.history(); this.interrupted = this.history.filter((t) => t.status !== 'finished');
            this.changed(); return s;
        } catch (e) { s.status = 'interrupted'; this.fail(e); throw e; }
    }
    async closeInterrupted(id) {
        if (this.active) throw new Error('Finish the active trip first');
        const rebuilt = await this.storage.recover(id), s = rebuilt.summary;
        s.status = 'finished'; s.endedAt = s.lastWallAt || s.startedAt; s.finishReason = 'Closed after interruption';
        this.storage.save(s); this.storage.index();
        this.history = this.storage.history(); this.interrupted = this.history.filter((t) => t.status !== 'finished');
        this.changed(); return s;
    }
    close() {
        if (this.closed) return;
        clearInterval(this.timer);
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

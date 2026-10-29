'use strict';
const D = require('./domain');

const BASELINE_FILE = 'xdrive-lab-baseline.json';
const STATE_FILE = 'xdrive-lab-state.json';
const SNAPSHOT_FILE = 'xdrive-lab-snapshot.json';
const ARM_MS = 30000;
const DISPATCH_MS = 5000;
const FEEDBACK_MS = 3000;
const UI_EVENTS = 120;
const UI_DIAGNOSTICS = 80;
function clone(value) { return value === undefined ? null : JSON.parse(JSON.stringify(value)); }
function message(error) { return error && error.message ? error.message : String(error); }
function pause(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function own(value, key) { return Object.prototype.hasOwnProperty.call(value, key); }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function knownField(key, field) {
    const def = D.service(key);
    return !!D.field(key, field) || !!(def && (def.events || []).some((event) => (typeof event === 'string' ? event : event.name) === field));
}

class Lab {
    constructor(options) {
        this.store = options.store; this.changed = options.changed || (() => {}); this.preview = !!options.preview;
        this.api = null; this.closed = false; this.visible = false; this.busy = false;
        this.readings = {}; this.services = {}; this.readErrors = {}; this.getterErrors = {}; this.subscriptionErrors = {};
        this.events = []; this.notes = []; this.diagnostics = []; this.protocolResults = {};
        this.sequence = 0; this.startedAt = Date.now(); this.startedMonoMs = this.now();
        this.sessionId = this.startedAt + '-' + process.pid + '-' + Math.floor(this.startedMonoMs * 1000);
        this.armedUntil = 0; this.armSelection = null; this.dispatchPermit = null;
        this.loggingFailed = false; this.action = null; this.annotationArchive = []; this.archivedTrials = [];
        this.notice = this.preview ? 'Preview: observation only. Arming and all vehicle writes are prohibited.' : 'Disarmed. Observe providers and capture a baseline before any explicit native trial.';
        this.baseline = this.store.load(BASELINE_FILE, null);
        if (this.baseline !== null && (!this.baseline || this.baseline.schemaVersion !== 1 || !this.baseline.readings || !this.baseline.providerEpochs)) {
            this.invalidEvidence(BASELINE_FILE); this.baseline = null;
        }
        const saved = this.store.load(STATE_FILE, null);
        this.trial = null; this.lastTrial = null;
        if (saved !== null) {
            if (!this.validState(saved)) this.invalidEvidence(STATE_FILE);
            else {
                this.trial = saved.trial; this.lastTrial = saved.lastTrial;
                this.archivedTrials = saved.archivedTrials;
                this.annotationArchive = saved.annotations;
                this.notes = this.annotationArchive.slice(-200).reverse();
                this.protocolResults = saved.protocolResults;
            }
        }
        if (this.trial) {
            this.trial.recoveredStatus = this.trial.status; this.trial.status = 'unresolved';
            this.trial.recoveredAt = Date.now(); this.trial.recoveredSessionId = this.sessionId;
            this.notice = 'Recovered unresolved trial. Historical readings are not current. No request replayed; inspect fresh state, then explicitly restore or review external restoration.';
        }
        this.record('session', 'Started a new read-only observation session; no historical samples loaded into live gates',
            { preview: this.preview, recoveredTrialId: this.trial && this.trial.id, schema: this.schemaIdentity() });
        if (this.storageProblem()) this.notice = 'Evidence error; native writes blocked: ' + this.storageProblem();
        this.timer = setInterval(() => this.watchSafety(), 100);
        if (this.timer.unref) this.timer.unref();
    }
    now() { return D.now(); }
    armRemaining() { return this.armedUntil ? Math.max(0, Math.ceil((this.armedUntil - this.now()) / 1000)) : 0; }
    schemaIdentity() {
        return { schemaVersion: D.catalog.schemaVersion, source: D.catalog.source, sourceSha256: D.catalog.sourceSha256 };
    }
    validTrial(trial) {
        try {
            return !!trial && typeof trial.id === 'string' && !!trial.before && !!trial.before.readings &&
                !!trial.baseline && trial.baseline.schemaVersion === 1 && !!trial.baseline.readings && typeof trial.backendId === 'string' &&
                D.MODES.some((mode) => mode.id === trial.originalMode) &&
                !!trial.originalReading && D.currentMode(trial.originalReading.value).valid &&
                D.currentMode(trial.originalReading.value).mode === trial.originalMode &&
                same(trial.originalReading, trial.before.readings['mdrive.statusMSystem']) &&
                same(trial.applyRequest, D.nativeRequest(trial.backendId, trial.modeId)) &&
                same(trial.restoreRequest, D.nativeRequest(trial.backendId, trial.originalMode)) &&
                Array.isArray(trial.dispatches) && trial.dispatches.length >= 1 && trial.dispatches.length <= 2 &&
                Array.isArray(trial.annotations) && Array.isArray(trial.errors) &&
                trial.dispatches.every((entry, index) => entry && entry.phase === (index === 0 ? 'apply' : 'restore') &&
                    !!entry.intent && same(entry.request, entry.phase === 'apply' ? trial.applyRequest : trial.restoreRequest));
        } catch (e) { return false; }
    }
    validState(saved) {
        return !!saved && saved.schemaVersion === 1 && own(saved, 'trial') && own(saved, 'lastTrial') &&
            (saved.trial === null || this.validTrial(saved.trial)) && (saved.lastTrial === null || this.validTrial(saved.lastTrial)) &&
            Array.isArray(saved.archivedTrials) && saved.archivedTrials.every((trial) => this.validTrial(trial)) &&
            Array.isArray(saved.annotations) && saved.protocolResults && typeof saved.protocolResults === 'object';
    }
    invalidEvidence(name) {
        this.store.errors[name] = 'Unsupported or invalid ' + name + '; original evidence preserved';
        this.store.blocked[name] = true; this.loggingFailed = true;
    }
    storageProblem() {
        const errors = this.store.errors || {}, blocked = this.store.blocked || {};
        const details = Object.keys(errors).map((key) => errors[key]);
        if (Object.keys(blocked).some((key) => blocked[key]) && !details.length) details.push('Evidence storage is blocked');
        if (this.loggingFailed && !details.length) details.push('Raw evidence recording failed in this session');
        const stats = this.store.stats ? this.store.stats() : null;
        if (stats && stats.counts && (stats.counts.dropped || stats.counts.uncertainRecords || stats.counts.interruptedSessions)) details.push('Raw sample loss or interrupted evidence has been recorded; native writes prohibited');
        return details.join(' | ');
    }
    signal() { if (!this.closed) this.changed(); }
    recordingFailure(error) {
        this.loggingFailed = true; this.armedUntil = 0; this.armSelection = null;
        if (this.dispatchPermit) this.dispatchPermit.invalidated = 'Evidence recording failure';
        this.dispatchPermit = null;
        this.notice = 'Evidence recording failed; disarmed and native writes blocked: ' + message(error);
        this.signal();
    }
    record(kind, text, raw, required) {
        if (this.closed) { if (required) throw new Error('xDrive Lab is closed'); return null; }
        const event = { schemaVersion: 1, sessionId: this.sessionId, sequence: ++this.sequence,
            at: Date.now(), monoMs: this.now(), kind: String(kind), text: String(text) };
        let handedToStore = false;
        try {
            if (raw !== undefined) event.raw = clone(raw);
            this.events.unshift(event); if (this.events.length > UI_EVENTS) this.events.length = UI_EVENTS;
            handedToStore = true; this.store.append(event, !!required);
        } catch (e) {
            if (!handedToStore) {
                // Serialization failures are still delivered records and need an explicit loss count.
                try { this.store.append({ sessionId: this.sessionId, sequence: event.sequence, at: event.at,
                    monoMs: event.monoMs, kind: event.kind, raw }, !!required); }
                catch (failure) { this.recordingFailure(failure); }
            }
            this.recordingFailure(e);
            if (required) throw e;
        }
        this.signal(); return event;
    }
    state() {
        return { schemaVersion: 1, savedAt: Date.now(), sessionId: this.sessionId, trial: this.trial, lastTrial: this.lastTrial,
            archivedTrials: this.archivedTrials, annotations: this.annotationArchive, protocolResults: this.protocolResults };
    }
    persist() {
        try { return this.store.save(STATE_FILE, this.state()); }
        catch (e) { this.recordingFailure(e); throw e; }
    }
    providerEpoch(key) {
        try {
            if (this.api && this.api.epoch) return this.api.epoch(key);
            return this.services[key] ? this.services[key].epoch : null;
        } catch (e) { return null; }
    }
    epochs(keys) {
        const result = {};
        (keys || D.SERVICES.map((def) => def.key)).forEach((key) => { result[key] = this.providerEpoch(key); });
        return result;
    }
    epochProblem(epochs) {
        const keys = Object.keys(epochs || {});
        if (!keys.length) return 'No provider epoch continuity was captured';
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i], provider = this.services[key], epoch = this.providerEpoch(key);
            if (!provider || provider.available !== true || !epochs[key] || epoch !== epochs[key] || provider.epoch !== epochs[key] ||
                (this.api && this.api.available && !this.api.available(key))) return key + ' provider was lost or changed connection epoch';
        }
        return '';
    }
    connection(key, available, detail, epoch) {
        if (this.closed || !D.service(key)) return;
        const old = this.services[key], nextEpoch = epoch === undefined ? this.providerEpoch(key) : epoch;
        this.services[key] = { available: available === true ? true : available === false ? false : null,
            detail: String(detail || ''), epoch: nextEpoch || null, at: Date.now(), monoMs: this.now() };
        if (this.armSelection && own(this.armSelection.epochs, key) &&
            (available !== true || nextEpoch !== this.armSelection.epochs[key])) this.disarm(key + ' provider changed or was lost');
        if (this.dispatchPermit && own(this.dispatchPermit.epochs, key) &&
            (available !== true || nextEpoch !== this.dispatchPermit.epochs[key])) this.disarm(key + ' provider changed before invocation');
        if (!old || old.available !== this.services[key].available || old.epoch !== this.services[key].epoch || old.detail !== this.services[key].detail) {
            this.record('provider', key + ': ' + this.services[key].detail, { key, state: this.services[key] });
        }
        this.signal();
    }
    readError(key, field, error, source) {
        if (this.closed) return;
        const name = key + '.' + field, detail = message(error), origin = source || 'getter';
        if (origin === 'notification' || origin === 'subscription' || detail.indexOf('Subscription:') === 0) this.subscriptionErrors[name] = detail;
        else this.getterErrors[name] = detail;
        this.readErrors[name] = [this.getterErrors[name], this.subscriptionErrors[name]].filter(Boolean).join(' | ');
        this.record('read-error', name + ': ' + detail, { key, field, source: origin, error: detail });
        if (D.SAFETY_FIELDS.indexOf(name) >= 0 && this.armSelection && own(this.armSelection.epochs, key)) this.disarm('Safety field read/subscription failed: ' + name);
        this.signal();
    }
    subscriptionReady(key, field) {
        if (this.closed) return;
        const name = key + '.' + field;
        delete this.subscriptionErrors[name];
        if (this.getterErrors[name]) this.readErrors[name] = this.getterErrors[name]; else delete this.readErrors[name];
        this.record('subscription', name + ': notification subscription ready', { key, field, epoch: this.providerEpoch(key) });
    }
    receive(key, field, raw, source) {
        if (this.closed) return;
        const origin = source || 'notification', name = key + '.' + field, at = Date.now(), monoMs = this.now(), previous = this.readings[name];
        let value;
        try { value = clone(raw); }
        catch (e) {
            // Let the Store account for the unrecordable delivered sample, rather than silently discarding it.
            try { this.store.append({ sessionId: this.sessionId, sequence: ++this.sequence, at, monoMs, kind: 'unserializable-sample', key, field, source: origin, raw }); }
            catch (failure) { this.recordingFailure(failure); }
            this.recordingFailure(e); this.readError(key, field, 'Non-JSON delivered payload: ' + message(e), origin); return;
        }
        if (!knownField(key, field) || ['getter', 'notification', 'event'].indexOf(origin) < 0) {
            this.record('unmapped-sample', name + ': raw delivery excluded from live gates', { key, field, source: origin, value });
            return;
        }
        const epoch = this.providerEpoch(key), gap = previous && previous.epoch === epoch ? monoMs - previous.monoMs : null;
        const reading = { value, at, monoMs, source: origin, epoch: epoch || null,
            samples: (previous ? previous.samples : 0) + 1,
            getterSamples: (previous ? previous.getterSamples : 0) + (origin === 'getter' ? 1 : 0),
            notificationSamples: (previous ? previous.notificationSamples : 0) + (origin === 'notification' ? 1 : 0),
            eventSamples: (previous ? previous.eventSamples : 0) + (origin === 'event' ? 1 : 0),
            firstAt: previous ? previous.firstAt : at,
            minGapMs: gap === null ? null : previous.minGapMs === null ? gap : Math.min(previous.minGapMs, gap),
            maxGapMs: gap === null ? null : previous.maxGapMs === null ? gap : Math.max(previous.maxGapMs, gap), lastGapMs: gap };
        this.readings[name] = reading;
        if (origin === 'getter') {
            delete this.getterErrors[name];
            if (this.subscriptionErrors[name]) this.readErrors[name] = this.subscriptionErrors[name]; else delete this.readErrors[name];
        }
        // Every delivery is journaled, including duplicate values and every source separately.
        this.record('sample', name, { key, field, reading });
        if (name === 'mdrive.statusMSystem') this.observeTrialReading(reading);
        this.watchSafety(); this.signal();
    }
    capture() {
        return { schemaVersion: 1, sessionId: this.sessionId, sequence: this.sequence, at: Date.now(), monoMs: this.now(),
            startedAt: this.startedAt, startedMonoMs: this.startedMonoMs, preview: this.preview, visible: this.visible,
            sourceIdentity: this.schemaIdentity(), readings: clone(this.readings), services: clone(this.services),
            providerEpochs: this.epochs(), readErrors: clone(this.readErrors), getterErrors: clone(this.getterErrors),
            subscriptionErrors: clone(this.subscriptionErrors), recorder: this.store.stats(),
            interpretation: 'Current-process observations only. Gaps are observed arrival gaps, not inferred packet loss; reported AWD mode is not physical torque proof.' };
    }
    requireOpen() { if (this.closed) throw new Error('xDrive Lab is closed'); if (!this.api) throw new Error('xDrive services have not started'); }
    async run(label, action) {
        this.requireOpen(); if (this.busy) throw new Error('Another xDrive Lab action is in progress');
        this.busy = true; this.action = label; this.signal();
        try { return await action(); }
        catch (e) {
            this.notice = label + ': ' + message(e); this.record('action-error', this.notice);
            if (this.storageProblem()) this.recordingFailure(e);
            throw e;
        } finally { this.busy = false; this.action = null; this.signal(); }
    }
    async captureBaseline() {
        return this.run('Capture baseline', async () => {
            if (this.trial) throw new Error('Baseline cannot be overwritten while a trial is unresolved');
            this.disarm('Baseline capture');
            let refreshError = null;
            try { await this.api.refresh(); } catch (e) { refreshError = message(e); }
            if (this.closed) throw new Error('xDrive Lab closed during baseline refresh');
            const baseline = Object.assign(this.capture(), { refreshError, kind: 'baseline' });
            try { this.store.flushSync(); this.store.save(BASELINE_FILE, baseline); }
            catch (e) { this.recordingFailure(e); throw e; }
            this.baseline = baseline;
            this.record('baseline', 'Saved complete raw baseline; notification-only freshness was not inferred', baseline, true);
            this.notice = refreshError ? 'Baseline saved with refresh errors; inspect raw errors/freshness. This does not arm.' : 'Baseline saved. Current live gate freshness is still required; disarmed.';
            return baseline;
        });
    }
    snapshot() {
        if (this.closed) throw new Error('xDrive Lab is closed');
        const snapshot = this.capture();
        try {
            this.store.flushSync(); const file = this.store.save(SNAPSHOT_FILE, snapshot);
            this.record('snapshot', 'Saved complete raw snapshot', { file, snapshot }, true);
            this.notice = 'Snapshot saved: ' + file.path; return file;
        } catch (e) { this.recordingFailure(e); throw e; }
    }
    async exportEvidence() {
        if (this.closed) throw new Error('xDrive Lab is closed');
        try {
            this.record('export', 'Operator requested retained evidence export');
            const file = await this.store.exportBundle({ state: clone(this.state()), baseline: clone(this.baseline),
                current: this.capture(), diagnostics: clone(this.diagnostics), uiEvents: clone(this.events),
                schemaIdentity: this.schemaIdentity(), catalog: D.catalog,
                protocol: D.PROTOCOL, markers: D.MARKERS,
                limitations: ['Transport return, actual reported AWD mode, and operator physical observations are separate evidence.',
                    'Bounded raw retention evictions and every observed recording loss are reported by recorder counters.',
                    'Historical snapshots are not live observations and never authorize a native request.'] });
            this.notice = 'Evidence JSON exported: ' + file.path; this.signal(); return file;
        } catch (e) {
            if (e.code === 'EXPORT_LIMIT') { this.notice = message(e); this.signal(); }
            else this.recordingFailure(e);
            throw e;
        }
    }
    diagnostic(event) {
        if (this.closed) return;
        let evidence;
        try { evidence = clone(event); }
        catch (e) { this.record('diagnostic', 'Unserializable diagnostic delivery', event); return; }
        const retained = { sessionId: this.sessionId, at: Date.now(), monoMs: this.now(), evidence };
        this.diagnostics.unshift(retained); if (this.diagnostics.length > UI_DIAGNOSTICS) this.diagnostics.length = UI_DIAGNOSTICS;
        this.record('diagnostic', evidence && (evidence.verdict || evidence.kind || evidence.label) || 'Diagnostic observation', retained);
    }
    operatorEntry(kind, value, detail) {
        return { sessionId: this.sessionId, at: Date.now(), monoMs: this.now(), actor: 'operator', kind, value,
            detail: detail === undefined ? '' : String(detail), snapshot: this.capture(),
            interpretation: 'Explicit operator attribution, not automatically verified physical evidence.' };
    }
    saveOperatorEntry(entry) {
        this.annotationArchive.push(entry); this.notes.unshift(entry); if (this.notes.length > 200) this.notes.length = 200;
        if (this.trial) this.trial.annotations.push(entry);
        this.persist(); this.record('operator-' + entry.kind, 'Operator: ' + entry.value, entry, true);
        return entry;
    }
    mark(markerId, note) {
        if (this.closed) throw new Error('xDrive Lab is closed');
        if (!D.MARKERS.some((marker) => marker.id === markerId)) throw new Error('Unknown operator marker');
        const entry = this.saveOperatorEntry(this.operatorEntry('marker', markerId, note));
        this.notice = 'Operator marker saved: ' + markerId + '; no automatic physical inference.'; return entry;
    }
    annotate(outcome) {
        if (this.closed) throw new Error('xDrive Lab is closed');
        if (['observed', 'no-change', 'unexpected', 'uncertain', 'warning', 'restored'].indexOf(outcome) < 0) throw new Error('Unknown operator outcome');
        const entry = this.saveOperatorEntry(this.operatorEntry('outcome', outcome));
        this.notice = 'Operator outcome saved: ' + outcome + '; reported state and physical observation remain separate.'; return entry;
    }
    protocol(stepId, outcome) {
        if (this.closed) throw new Error('xDrive Lab is closed');
        if (!D.PROTOCOL.some((step) => step.id === stepId)) throw new Error('Unknown guided protocol stage');
        if (['not-run', 'in-progress', 'observed', 'blocked', 'failed'].indexOf(outcome) < 0) throw new Error('Unknown protocol outcome');
        const entry = this.operatorEntry('protocol', outcome, stepId), old = this.protocolResults[stepId];
        this.protocolResults[stepId] = { stepId, outcome, actor: 'operator', at: entry.at, monoMs: entry.monoMs,
            sessionId: this.sessionId, snapshot: entry.snapshot, history: (old && old.history || []).concat([entry]) };
        this.persist(); this.record('protocol', 'Operator set ' + stepId + ': ' + outcome, entry, true);
        this.notice = 'Protocol attribution saved; no step is automatically declared physically complete.';
        return this.protocolResults[stepId];
    }
    gate(modeId, context) {
        const options = context || {}, result = D.gate(this.readings, this.services, this.now(), modeId);
        result.checks = result.checks.slice(); result.reasons = result.reasons.slice();
        const add = (id, label, ok, detail) => {
            result.checks.push({ id, label, ok: !!ok, detail });
            if (!ok) result.reasons.push(label + ': ' + detail);
        };
        add('app-open', 'App open', !this.closed, 'Closed applications cannot authorize vehicle requests.');
        add('not-preview', 'Real observation session (not preview)', !this.preview, 'Preview always prohibits arming and writes, including injected live-looking observations.');
        add('visible', 'App visible', this.visible, 'Hide cancels every armed or queued authorization.');
        add('services-ready', 'Native services started', !!this.api, 'No native API is connected.');
        add('not-busy', 'No conflicting app action', !this.busy || options.allowBusy, 'Wait for the current action to finish.');
        const storageError = this.storageProblem();
        add('evidence', 'Evidence recorder healthy without dropped samples', !storageError, storageError || 'Atomic critical evidence and raw journal are available.');
        add('baseline', 'Baseline retained', !!this.baseline, 'Capture a raw baseline before a native experiment.');
        add('trial', options.restore ? 'Explicit original-mode restoration of retained trial' : 'No unresolved trial',
            options.restore ? !!this.trial : options.allowTrial ? true : !this.trial,
            options.restore ? 'Restoration requires the retained original reported mode; never assume AWD.' : 'Resolve the existing trial before starting another.');
        const epochError = this.epochProblem(this.epochs(result.providerKeys));
        add('provider-continuity', 'Offered providers have live epoch identities', !epochError, epochError || 'All safety provider epochs are explicit and current.');
        const fieldErrors = D.SAFETY_FIELDS.filter((name) => !!this.readErrors[name]);
        add('read-errors', 'Required safety-field getter/subscription errors resolved', !fieldErrors.length,
            fieldErrors.length ? fieldErrors.map((name) => name + ': ' + this.readErrors[name]).join(' | ') : 'No unresolved errors on required safety fields; unrelated observation failures remain visible.');
        add('diagnostics-idle', 'No diagnostic request in flight', !this.api || !this.api.diagBusy, 'Diagnostic traffic and native mode trials must not overlap.');
        result.ok = result.reasons.length === 0;
        result.preview = this.preview; result.visible = this.visible; result.busy = this.busy;
        result.baselineAt = this.baseline && this.baseline.at; result.trialId = this.trial && this.trial.id;
        result.armRemaining = this.armRemaining(); result.sourceIdentity = this.schemaIdentity();
        return result;
    }
    safety(modeId) { return this.gate(modeId, {}); }
    blocker(backendId, modeId, restore, requireArmed, internal) {
        try { D.nativeRequest(backendId, modeId); } catch (e) { return message(e); }
        if (restore && (!this.trial || this.trial.backendId !== backendId || this.trial.originalMode !== modeId)) return 'Restoration must target the saved original reported mode using the saved backend';
        if (restore && this.trial.dispatches.some((entry) => entry.phase === 'restore')) return 'A native restoration was already attempted; no retries. Restore using the known external procedure, then explicitly review.';
        const gate = this.gate(modeId, { restore: !!restore, allowBusy: !!internal, allowTrial: !!internal && !restore });
        if (!gate.ok) return gate.reasons.join(' | ');
        if (gate.currentMode === modeId) return restore ? 'Original mode already freshly reported; use explicit restoration review rather than a no-op native write' : 'Target is already freshly reported; a no-op request cannot demonstrate an effect';
        if (requireArmed) {
            if (!this.armSelection || !this.armedUntil || this.now() >= this.armedUntil) return 'Explicitly arm this exact backend, target and phase first (30-second window)';
            if (this.armSelection.backendId !== backendId || this.armSelection.modeId !== modeId || this.armSelection.restore !== !!restore) return 'Arming belongs to a different backend, target or phase';
            const epochError = this.epochProblem(this.armSelection.epochs);
            if (epochError) return epochError + '; inspect fresh data and explicitly rearm';
        }
        return '';
    }
    blocked(backendId, modeId, restore, requireArmed) { return this.blocker(backendId, modeId, !!restore, !!requireArmed, false); }
    arm(backendId, modeId, restore) {
        this.requireOpen(); this.disarm('New explicit arming selection');
        if (this.api.setLmvPolling) this.api.setLmvPolling(false);
        const reason = this.blocker(backendId, modeId, !!restore, false, false);
        if (reason) { this.notice = 'Cannot arm: ' + reason; this.signal(); throw new Error(reason); }
        const gate = D.gate(this.readings, this.services, this.now(), modeId);
        const armedAt = this.now();
        this.armSelection = { backendId, modeId, restore: !!restore, armedAt, trialId: this.trial && this.trial.id,
            baselineAt: this.baseline.at, epochs: this.epochs(gate.providerKeys), sessionId: this.sessionId };
        this.armedUntil = armedAt + ARM_MS;
        try { this.record('arm', 'Operator armed one exact native request; this is not dispatch', { selection: this.armSelection, expiresMonoMs: this.armedUntil }, true); }
        catch (e) { this.disarm('Arming evidence failed'); throw e; }
        this.notice = 'Armed once for ' + backendId + ' / ' + modeId + (restore ? ' restoration' : ' trial') + '. Expires within 30 seconds; no automatic send.';
        this.signal(); return clone(this.armSelection);
    }
    disarm(reason) {
        const active = !!this.armedUntil || !!this.dispatchPermit;
        this.armedUntil = 0; this.armSelection = null;
        if (this.dispatchPermit) this.dispatchPermit.invalidated = reason || 'Disarmed';
        this.dispatchPermit = null;
        if (active && !this.closed) {
            this.notice = 'Disarmed: ' + (reason || 'Explicit operator request');
            this.record('disarm', this.notice);
        }
        this.signal();
    }
    watchSafety() {
        if (this.closed) return;
        const storage = this.storageProblem();
        if (storage && !this.loggingFailed) this.recordingFailure(new Error(storage));
        if (!this.armSelection && !this.dispatchPermit) return;
        if (!this.visible) { this.disarm('App hidden'); return; }
        const selection = this.armSelection;
        if (selection) {
            if (this.now() >= this.armedUntil) { this.disarm('Arming window expired'); return; }
            const error = this.epochProblem(selection.epochs);
            if (error) { this.disarm(error); return; }
            const gate = D.gate(this.readings, this.services, this.now(), selection.modeId);
            if (!gate.ok) { this.disarm('Safety data became stale, invalid or unsafe: ' + gate.reasons.join(' | ')); return; }
        }
        if (this.dispatchPermit && this.now() >= this.dispatchPermit.deadline) this.disarm('Queued native dispatch permit expired; late native ticks are prohibited');
    }
    visibility(visible) {
        if (this.closed || this.visible === !!visible) return;
        this.visible = !!visible;
        if (!this.visible) this.disarm('App hidden');
        this.record('visibility', this.visible ? 'App visible' : 'App hidden; recording remains read-only');
    }
    dispatchGuard(request, consume) {
        const permit = this.dispatchPermit;
        const reject = (reason) => { this.disarm('Dispatch blocked: ' + reason); throw new Error('Native dispatch prohibited: ' + reason); };
        if (!permit || permit.used || permit.invalidated) return reject('No live single-use dispatch permit');
        if (request !== permit.request || !same(request, permit.requestValue)) return reject('Request identity or full request payload changed');
        if (!same(request, D.nativeRequest(permit.backendId, permit.modeId))) return reject('Request is not the declared exact native wrapper');
        if (this.closed || this.preview || !this.visible) return reject('App closed, hidden or preview');
        if (this.now() >= permit.deadline || !this.armedUntil || this.now() >= this.armedUntil) return reject('Permit or explicit arm deadline expired');
        if (!this.armSelection || this.armSelection.backendId !== permit.backendId || this.armSelection.modeId !== permit.modeId ||
            this.armSelection.restore !== (permit.phase === 'restore')) return reject('Arming target/phase changed');
        if (!this.trial || this.trial.id !== permit.trialId || this.trial.dispatches[permit.dispatchIndex] !== permit.entry) return reject('Retained intent identity changed');
        const epochError = this.epochProblem(permit.epochs);
        if (epochError) return reject(epochError);
        const gate = this.gate(permit.modeId, { restore: permit.phase === 'restore', allowBusy: true, allowTrial: true });
        if (!gate.ok) return reject(gate.reasons.join(' | '));
        if (gate.currentMode === permit.modeId) return reject('Target became current before invocation; no-op trial prohibited');
        if (!consume) return true;
        // The final nativeTick wrapper calls this synchronously, immediately before proxy.setValue.
        permit.used = true; this.dispatchPermit = null;
        const reading = this.readings['mdrive.statusMSystem'];
        permit.entry.invocation = { at: Date.now(), monoMs: this.now(), sessionId: this.sessionId, epochs: clone(permit.epochs),
            feedbackAfterMonoMs: null,
            sampleFloor: reading ? reading.samples : 0,
            detail: 'Single-use permit consumed immediately before proxy invocation; transport completion is a separate fact.' };
        this.trial.status = permit.phase === 'restore' ? 'restore-invoked-unconfirmed' : 'invoked-unconfirmed';
        this.armedUntil = 0; this.armSelection = null;
        try {
            this.store.flushSync(); this.persist();
            this.record('native-invocation', 'Final permit consumed for one ' + permit.phase + ' proxy invocation',
                { trialId: this.trial.id, dispatchIndex: permit.dispatchIndex, request, invocation: permit.entry.invocation }, true);
        } catch (e) { this.recordingFailure(e); throw e; }
        // Synchronous fsyncs can themselves outlast the 2-second freshness window.
        // Recheck after evidence I/O, not just before it, while still inside nativeTick.
        const finalGate = this.gate(permit.modeId, { restore: permit.phase === 'restore', allowBusy: true, allowTrial: true });
        const finalError = this.epochProblem(permit.epochs);
        if (this.now() >= permit.deadline || !finalGate.ok || finalError || finalGate.currentMode === permit.modeId ||
            request !== permit.request || !same(request, permit.requestValue)) {
            permit.entry.invocation.prevented = true;
            permit.entry.invocation.preventedReason = finalError || (!finalGate.ok ? finalGate.reasons.join(' | ') : 'Dispatch expired or request/state changed during critical evidence save');
            this.persist();
            return reject(permit.entry.invocation.preventedReason);
        }
        // Samples delivered before this final authorization are not post-invocation feedback.
        permit.entry.invocation.feedbackAfterMonoMs = this.now();
        permit.entry.invocation.sampleFloor = this.readings['mdrive.statusMSystem'].samples;
        return true;
    }
    observeTrialReading(reading) {
        if (!this.trial || !reading || this.closed) return;
        const entry = this.trial.dispatches[this.trial.dispatches.length - 1];
        if (!entry || !entry.invocation || entry.invocation.prevented || entry.observationClosed || entry.reportedMatch) return;
        const invocation = entry.invocation, age = this.now() - reading.monoMs;
        if (invocation.sessionId !== this.sessionId || typeof invocation.feedbackAfterMonoMs !== 'number' ||
            reading.samples <= invocation.sampleFloor || reading.monoMs <= invocation.feedbackAfterMonoMs ||
            age < 0 || age > D.freshMs || reading.epoch !== invocation.epochs.mdrive ||
            ['getter', 'notification'].indexOf(reading.source) < 0 || this.epochProblem(invocation.epochs)) return;
        const mode = D.currentMode(reading.value);
        entry.lastReadback = { at: Date.now(), monoMs: this.now(), reading: clone(reading), interpretation: mode };
        if (!mode.valid || mode.mode !== entry.request.modeId) return;
        entry.reportedMatch = { at: Date.now(), monoMs: this.now(), sessionId: this.sessionId, reading: clone(reading),
            modeId: mode.mode, qualifier: mode.qualifier,
            interpretation: 'Fresh post-invocation actual statusMSystem reports requested mode with valid ready/active qualifier; not physical torque proof.' };
        if (entry.phase === 'apply') this.trial.reportedMatch = clone(entry.reportedMatch);
        else this.trial.restoredReportedMatch = clone(entry.reportedMatch);
        this.trial.status = entry.phase === 'restore' ? 'restored-reported' : 'applied-reported';
        try {
            this.persist(); this.record('native-reported-match', entry.reportedMatch.interpretation,
                { trialId: this.trial.id, phase: entry.phase, evidence: entry.reportedMatch }, true);
        } catch (e) { this.recordingFailure(e); }
    }
    async nativeAction(phase, backendId, modeId) {
        const restore = phase === 'restore';
        this.requireOpen();
        const initial = this.blocker(backendId, modeId, restore, true, false);
        if (initial) throw new Error(initial);
        return this.run(restore ? 'Native restoration' : 'Native trial', async () => {
            let entry = null, sent = false, transportError = null;
            try {
                if (this.api.setLmvPolling) this.api.setLmvPolling(false);
                await this.api.refreshSafety();
                const reason = this.blocker(backendId, modeId, restore, true, true);
                if (reason) throw new Error(reason);
                const request = D.nativeRequest(backendId, modeId), gate = D.gate(this.readings, this.services, this.now(), modeId);
                if (!restore) {
                    const originalMode = gate.currentMode;
                    if (!originalMode) throw new Error('Original actual AWD mode is unknown; no request or forced-AWD fallback is permitted');
                    this.trial = { schemaVersion: 1, id: this.sessionId + '-' + (++this.sequence), sessionId: this.sessionId,
                        createdAt: Date.now(), createdMonoMs: this.now(), backendId, modeId, originalMode,
                        baseline: clone(this.baseline), before: this.capture(), originalReading: clone(this.readings['mdrive.statusMSystem']),
                        applyRequest: clone(request), restoreRequest: D.nativeRequest(backendId, originalMode),
                        dispatches: [], annotations: [], errors: [], status: 'intent-persisted',
                        reportedMatch: null, restoredReportedMatch: null };
                }
                entry = { phase, request: clone(request), intent: { at: Date.now(), monoMs: this.now(), sessionId: this.sessionId,
                    actor: 'operator', armedSelection: clone(this.armSelection), before: this.capture() },
                    invocation: null, transport: null, reportedMatch: null, lastReadback: null, observationClosed: false };
                this.trial.dispatches.push(entry);
                this.trial.status = restore ? 'restore-intent-persisted' : 'intent-persisted';
                // All original/restore data and complete intent must survive a crash before any send is possible.
                this.store.flushSync(); this.persist();
                this.record('native-intent', 'Durable operator-selected ' + phase + ' intent; not yet invoked',
                    { trialId: this.trial.id, dispatchIndex: this.trial.dispatches.length - 1, entry }, true);
                if (!this.armSelection || this.now() >= this.armedUntil) throw new Error('Arming expired or safety changed while persisting intent; no native request sent');
                this.dispatchPermit = { request, requestValue: clone(request), backendId, modeId, phase,
                    trialId: this.trial.id, entry, dispatchIndex: this.trial.dispatches.length - 1,
                    epochs: clone(this.armSelection.epochs), deadline: Math.min(this.armedUntil, this.now() + DISPATCH_MS), used: false };
                try {
                    sent = true;
                    const result = await this.api.sendNative(request);
                    entry.transport = { at: Date.now(), monoMs: this.now(), returned: true, error: null, result: clone(result),
                        interpretation: 'Native transport return only; not an ECU/physical mode confirmation.' };
                    if (!entry.invocation) throw new Error('Transport returned without consuming the final native dispatch permit; invocation is unconfirmed');
                } catch (e) {
                    transportError = e;
                    entry.transport = { at: Date.now(), monoMs: this.now(), returned: false, error: message(e),
                        interpretation: 'Error/timeout does not prove that no vehicle write occurred. Trial remains retained; no retry.' };
                    this.dispatchPermit = null; this.armedUntil = 0; this.armSelection = null;
                    this.trial.errors.push({ phase, at: Date.now(), monoMs: this.now(), error: message(e) });
                }
                this.dispatchPermit = null; this.armedUntil = 0; this.armSelection = null;
                this.persist(); this.record('native-transport', 'Native transport and vehicle feedback are separate facts',
                    { trialId: this.trial.id, phase, transport: entry.transport }, true);
                if (entry.invocation && !this.closed) {
                    let refreshError = null;
                    try { await this.api.refreshSafety(); } catch (e) { refreshError = message(e); }
                    if (refreshError) entry.feedbackRefreshError = refreshError;
                    this.observeTrialReading(this.readings['mdrive.statusMSystem']);
                    const deadline = this.now() + FEEDBACK_MS;
                    while (!this.closed && !entry.reportedMatch && this.now() < deadline && !this.storageProblem()) {
                        this.observeTrialReading(this.readings['mdrive.statusMSystem']);
                        if (!entry.reportedMatch) await pause(50);
                    }
                }
                entry.observationClosed = true; entry.completedAt = Date.now(); entry.completedMonoMs = this.now();
                entry.after = this.capture();
                if (!entry.reportedMatch || transportError) this.trial.status = 'unresolved';
                this.persist();
                this.record('native-result', 'Retained ' + phase + ' evidence; no automatic retries or restoration',
                    { trialId: this.trial.id, phase, transport: entry.transport, reportedMatch: entry.reportedMatch, status: this.trial.status }, true);
                this.notice = entry.reportedMatch ?
                    (restore ? 'Original mode freshly reported after native restoration. Trial retained: explicitly review restoration; this is not physical torque proof.' :
                        'Requested mode freshly reported after invocation. Trial retained until explicitly restored/reviewed; no physical torque claim.') :
                    'Native result unresolved. Transport return is not actual-mode confirmation; retained for explicit restoration/review, no retries.';
                if (transportError) this.notice += ' Transport unresolved: ' + message(transportError);
                if (transportError) throw transportError;
                return this.trial;
            } catch (e) {
                this.disarm('Native action ended or was blocked');
                if (this.trial) {
                    if (!entry || !entry.reportedMatch || transportError) this.trial.status = 'unresolved';
                    if (!sent) this.trial.errors.push({ phase, at: Date.now(), monoMs: this.now(), error: message(e), invocationPrevented: true });
                    try { this.persist(); } catch (failure) { this.recordingFailure(failure); }
                }
                throw e;
            } finally {
                this.dispatchPermit = null; this.armedUntil = 0; this.armSelection = null;
                if (this.api && this.api.setLmvPolling) this.api.setLmvPolling(false);
            }
        });
    }
    async apply(backendId, modeId) { return this.nativeAction('apply', backendId, modeId); }
    async restore() {
        if (!this.trial) throw new Error('No retained trial to restore');
        return this.nativeAction('restore', this.trial.backendId, this.trial.originalMode);
    }
    async resolveExternal() {
        this.requireOpen();
        return this.run('Review restoration', async () => {
            if (!this.trial) throw new Error('No retained trial to review');
            if (this.preview) throw new Error('Preview cannot verify live vehicle restoration');
            if (!this.visible) throw new Error('App must be visible for explicit restoration review');
            if (this.storageProblem()) throw new Error(this.storageProblem());
            this.disarm('Explicit read-only restoration review');
            const trial = this.trial, epochs = this.epochs(['mdrive']);
            const prior = this.readings['mdrive.statusMSystem'], sampleFloor = prior ? prior.samples : 0;
            const started = this.now();
            await this.api.read('mdrive', 'statusMSystem');
            const reading = this.readings['mdrive.statusMSystem'], problem = this.epochProblem(epochs);
            if (problem) throw new Error(problem);
            if (this.closed || !this.visible || this.trial !== trial) throw new Error('Restoration review context changed');
            if (this.storageProblem()) throw new Error(this.storageProblem());
            if (!reading || reading.samples <= sampleFloor || reading.monoMs <= started || this.now() - reading.monoMs > D.freshMs ||
                reading.epoch !== epochs.mdrive || ['getter', 'notification'].indexOf(reading.source) < 0) throw new Error('A new fresh actual MDrive sample in the same provider epoch is required for restoration review');
            const mode = D.currentMode(reading.value);
            if (!mode.valid || mode.mode !== trial.originalMode) throw new Error('Fresh actual MDrive mode does not match saved original mode; trial remains unresolved');
            const acknowledgement = this.operatorEntry('restoration-review', 'restored',
                'Operator explicitly acknowledges restoration review. Fresh actual status equals saved original; this is not physical torque proof.');
            acknowledgement.originalMode = trial.originalMode; acknowledgement.reading = clone(reading);
            trial.annotations.push(acknowledgement); trial.review = acknowledgement; trial.status = 'restoration-reviewed';
            trial.archivedAt = Date.now(); trial.archivedMonoMs = this.now();
            this.annotationArchive.push(acknowledgement); this.notes.unshift(acknowledgement); if (this.notes.length > 200) this.notes.length = 200;
            // Save the complete reviewed trial before removing the unresolved-trial pointer.
            this.persist();
            this.archivedTrials.push(trial); this.lastTrial = trial; this.trial = null;
            try { this.persist(); }
            catch (e) { this.trial = trial; this.archivedTrials.pop(); throw e; }
            this.record('restoration-reviewed', 'Explicit operator restoration review archived retained trial without any vehicle write',
                { trialId: trial.id, acknowledgement }, true);
            this.notice = 'Restoration reviewed and trial archived. Original reported mode and operator acknowledgment retained separately; no physical torque proof.';
            return trial;
        });
    }
    close() {
        if (this.closed) return;
        clearInterval(this.timer); this.disarm('App closing; no writes/replay/restoration');
        try { this.record('session-close', 'Closing read-only recorder; retained trials are never replayed', { trialId: this.trial && this.trial.id }, true); }
        catch (e) { this.recordingFailure(e); }
        try { this.persist(); } catch (e) { this.recordingFailure(e); }
        try { this.store.close(); } catch (e) { this.recordingFailure(e); }
        this.closed = true; this.dispatchPermit = null; this.armedUntil = 0; this.armSelection = null;
    }
}
module.exports = { Lab };

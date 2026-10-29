'use strict';
const D = require('./domain');

const TRIAL_FILE = 'lighting-lab-trial.json';
const BASELINE_FILE = 'lighting-lab-baseline.json';
const SNAPSHOT_FILE = 'lighting-lab-snapshot.json';
const ARM_MS = 30000;
function clone(value) { return value === undefined ? null : JSON.parse(JSON.stringify(value)); }
function message(error) { return error && error.message ? error.message : String(error); }
function pause(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function knownField(service, field) {
    const def = D.SERVICES.find((item) => item.key === service);
    return !!def && (def.fields || []).concat(def.events || []).indexOf(field) >= 0;
}

class Lab {
    constructor(options) {
        this.store = options.store; this.changed = options.changed || (() => {}); this.preview = !!options.preview;
        this.api = null; this.closed = false; this.visible = false; this.busy = false;
        this.readings = {}; this.services = {}; this.readErrors = {}; this.subscriptionErrors = {}; this.getterErrors = {}; this.events = []; this.notes = [];
        this.notice = this.preview ? 'Preview: read-only; no vehicle connection' : 'Observation only. No command has been requested.';
        this.armedUntil = 0; this.armVehicleEpoch = null; this.dispatchPermit = null; this.feedback = [];
        this.readLogAt = {}; this.loggingFailed = false; this.sequence = 0; this.startedAt = Date.now();
        this.baseline = this.store.load(BASELINE_FILE, null);
        if (this.baseline !== null && (!this.baseline || this.baseline.schemaVersion !== 1 || !this.baseline.readings)) {
            this.invalidEvidence(BASELINE_FILE); this.baseline = null;
        }
        const saved = this.store.load(TRIAL_FILE, { schemaVersion: 1, trial: null, lastTrial: null, notes: [] });
        this.trial = null; this.lastTrial = null;
        if (!saved || saved.schemaVersion !== 1 || !Object.prototype.hasOwnProperty.call(saved, 'trial') ||
            (saved.trial !== null && !this.validTrial(saved.trial)) || (saved.lastTrial && !this.validTrial(saved.lastTrial))) {
            this.invalidEvidence(TRIAL_FILE);
        } else {
            this.trial = saved.trial; this.lastTrial = saved.lastTrial || null;
            this.notes = Array.isArray(saved.notes) ? saved.notes.slice(-100) : [];
        }
        if (this.trial) {
            this.trial.status = 'unresolved'; this.trial.recoveredAt = Date.now();
            this.notice = 'Recovered unresolved trial. No command replayed. Inspect, rearm at standstill, then explicitly Restore.';
        }
        if (Object.keys(this.store.errors).length) this.notice = 'Evidence error; experiments blocked: ' + this.storageError();
        this.timer = setInterval(() => this.watchSafety(), 250);
        if (this.timer.unref) this.timer.unref();
    }
    validTrial(trial) {
        if (!trial || typeof trial.id !== 'string' || !D.control(trial.controlId) || !trial.before || !trial.before.readings ||
            !trial.restorePlan || !Array.isArray(trial.restorePlan.steps) || !trial.restorePlan.steps.length ||
            !Array.isArray(trial.dispatches) || !Array.isArray(trial.errors) || !Array.isArray(trial.annotations)) return false;
        try {
            const control = D.control(trial.controlId), steps = trial.restorePlan.steps, original = D.restore(control, trial.originalRaw);
            if (!D.validValue(control, trial.value) || JSON.stringify(trial.applyRequest) !== JSON.stringify(D.command(control, trial.value))) return false;
            if (JSON.stringify(steps[0].request) !== JSON.stringify(original.requests[0]) || JSON.stringify(steps[0].checks) !== JSON.stringify(original.checks)) return false;
            if (control.id !== 'exteriorMode') return steps.length === 1;
            if (steps.length > 3) return false;
            const seen = {};
            return steps.slice(1).every((step) => {
                if (!step || !Array.isArray(step.checks) || step.checks.length !== 1) return false;
                const check = step.checks[0], fog = D.control(check.controlId);
                if (!fog || ['frontFog', 'rearFog'].indexOf(fog.id) < 0 || seen[fog.id] || !D.validValue(fog, check.value)) return false;
                seen[fog.id] = true;
                const before = trial.before.readings[D.readKey(fog)];
                return before && D.current(fog, before.value) === check.value && JSON.stringify(step.request) === JSON.stringify(D.command(fog, check.value));
            });
        } catch (e) { return false; }
    }
    invalidEvidence(name) {
        this.store.errors[name] = 'Unsupported or invalid ' + name + '; original evidence preserved';
        this.store.blocked[name] = true;
    }
    storageError() { return Object.keys(this.store.errors).map((key) => this.store.errors[key]).join(' | '); }
    signal() { if (!this.closed) this.changed(); }
    record(kind, text, raw, required) {
        if (this.closed) { if (required) throw new Error('Lighting lab is closed'); return; }
        const event = { at: Date.now(), kind, text };
        if (raw !== undefined) event.raw = clone(raw);
        this.events.unshift(event); if (this.events.length > 80) this.events.length = 80;
        try { this.store.append(event); }
        catch (e) {
            this.loggingFailed = true; this.armedUntil = 0; this.dispatchPermit = null;
            this.notice = 'Logging failed; experiments disarmed: ' + message(e);
            this.signal(); if (required) throw e;
        }
        this.signal(); return event;
    }
    fail(label, error) {
        this.notice = label + ': ' + message(error) + (Object.keys(this.store.errors).length ? ' | Evidence: ' + this.storageError() : '');
        if (Object.keys(this.store.errors).length) { this.loggingFailed = true; this.disarm('Evidence failure', true); }
        this.record('error', this.notice);
    }
    persistTrial() {
        if (this.closed) return;
        try {
            this.store.save(TRIAL_FILE, { schemaVersion: 1, savedAt: Date.now(), trial: this.trial, lastTrial: this.lastTrial, notes: this.notes });
        } catch (e) {
            this.loggingFailed = true; this.armedUntil = 0; this.dispatchPermit = null;
            this.notice = 'Trial evidence could not be saved; experiments disarmed: ' + message(e); this.signal(); throw e;
        }
    }
    capture() {
        return { at: Date.now(), readings: clone(this.readings), services: clone(this.services), readErrors: clone(this.readErrors),
            providerEpochs: this.epochs(), visible: this.visible, preview: this.preview };
    }
    epochs() {
        const result = {};
        D.SERVICES.forEach((def) => { result[def.key] = this.api && this.api.epoch ? this.api.epoch(def.key) : null; });
        return result;
    }
    connection(key, available, detail) {
        if (this.closed || !D.SERVICES.some((def) => def.key === key)) return;
        const old = this.services[key];
        this.services[key] = { available: available === true ? true : available === false ? false : null, detail: String(detail || ''), at: Date.now() };
        if (available !== true && ((old && old.available === true) || key === 'vehicle')) this.disarm(key + ' provider lost or unavailable');
        if (!old || old.available !== this.services[key].available || old.detail !== this.services[key].detail) {
            this.record('provider', key + ': ' + detail, this.services[key]);
        }
        this.signal();
    }
    receive(service, field, raw, source) {
        if (this.closed || !knownField(service, field)) return;
        const key = service + '.' + field, at = Date.now(), previous = this.readings[key];
        let value;
        try { value = clone(raw); } catch (e) { this.readError(service, field, 'Non-JSON payload: ' + message(e)); return; }
        this.readings[key] = { value, at, samples: (previous ? previous.samples : 0) + 1, source: source || 'notification' };
        if (source === 'getter') {
            delete this.getterErrors[key];
            if (this.subscriptionErrors[key]) this.readErrors[key] = this.subscriptionErrors[key];
            else delete this.readErrors[key];
        }
        if (service === 'vehicle' && field === 'statusCarSpeed2' && D.speed(value) !== 0) this.disarm('Moving or invalid speed report');
        if (service === 'exterior' && field === 'showLightswitchOperationFeedback') {
            this.feedback.push({ at, value, sample: this.readings[key].samples });
            if (this.feedback.length > 40) this.feedback.shift();
        }
        if (!this.readLogAt[key] || at - this.readLogAt[key] >= 1000) {
            this.readLogAt[key] = at; this.record('reading', key, this.readings[key]);
        }
        this.signal();
    }
    readError(service, field, error) {
        if (this.closed || !knownField(service, field)) return;
        const key = service + '.' + field, detail = message(error);
        const previous = this.readErrors[key];
        if (detail.indexOf('Subscription:') === 0) this.subscriptionErrors[key] = detail;
        else this.getterErrors[key] = detail;
        this.readErrors[key] = [this.subscriptionErrors[key], this.getterErrors[key]].filter(Boolean).join(' | ');
        if (service === 'vehicle' && field === 'statusCarSpeed2') this.disarm('Speed getter/subscription failed');
        if (previous !== this.readErrors[key]) this.record('field-error', key + ': ' + this.readErrors[key]);
        this.signal();
    }
    subscriptionReady(service, field) {
        if (this.closed || !knownField(service, field)) return;
        const key = service + '.' + field;
        delete this.subscriptionErrors[key];
        if (this.getterErrors[key]) this.readErrors[key] = this.getterErrors[key];
        else delete this.readErrors[key];
        this.signal();
    }
    visibility(visible) {
        if (this.closed || this.visible === !!visible) return;
        this.visible = !!visible;
        if (!this.visible) this.disarm('App hidden');
        this.record('visibility', this.visible ? 'App visible' : 'App hidden'); this.signal();
    }
    disarm(reason, preserveNotice) {
        const armed = this.armedUntil > 0;
        this.armedUntil = 0; this.armVehicleEpoch = null; this.dispatchPermit = null;
        if (armed) {
            const text = 'Disarmed: ' + (reason || 'User request') + (Object.keys(this.store.errors).length ? ' | Evidence: ' + this.storageError() : '');
            if (!preserveNotice) this.notice = text;
            this.record('disarm', text);
        }
        this.signal();
    }
    watchSafety() {
        if (this.closed || !this.armedUntil) return;
        const speed = this.readings['vehicle.statusCarSpeed2'];
        if (Date.now() >= this.armedUntil) this.disarm('Arming window expired');
        else if (!this.visible) this.disarm('App hidden');
        else if (!speed || Date.now() - speed.at >= D.freshMs || D.speed(speed.value) !== 0) this.disarm('Speed is stale, invalid, or nonzero');
        else if (!this.api || !this.api.available('vehicle') || this.api.epoch('vehicle') !== this.armVehicleEpoch) this.disarm('Speed provider changed');
        else if (Object.keys(this.store.errors).length || this.loggingFailed) this.disarm('Evidence logging is not healthy');
    }
    requireOpen() { if (this.closed) throw new Error('Lighting lab is closed'); if (!this.api) throw new Error('Lighting services have not started'); }
    requireArmed() {
        this.requireOpen(); this.watchSafety();
        if (this.preview) throw new Error('Preview is observation-only');
        if (!this.visible) throw new Error('App must be visible');
        if (!this.armedUntil || Date.now() >= this.armedUntil) throw new Error('Arm explicitly at fresh, verified standstill first');
        if (this.loggingFailed || Object.keys(this.store.errors).length) throw new Error('Evidence logging is not healthy: ' + this.storageError());
    }
    tokens(service) {
        if (!this.api.available(service) || !this.api.available('vehicle')) throw new Error('Target and speed providers must be offered');
        return { service, target: this.api.epoch(service), vehicle: this.api.epoch('vehicle') };
    }
    checkTokens(tokens) {
        if (!this.api.available(tokens.service) || !this.api.available('vehicle') ||
            this.api.epoch(tokens.service) !== tokens.target || this.api.epoch('vehicle') !== tokens.vehicle ||
            this.armVehicleEpoch !== tokens.vehicle) {
            this.disarm('Provider epoch changed'); throw new Error('Provider changed; rearm and inspect before another request');
        }
    }
    async run(label, action) {
        this.requireOpen(); if (this.busy) throw new Error('Another lighting-lab action is in progress');
        this.busy = true; this.signal();
        try { return await action(); }
        catch (e) { if (!this.closed) this.fail(label, e); throw e; }
        finally { this.busy = false; this.dispatchPermit = null; this.signal(); }
    }
    async refresh() {
        return this.run('Refresh', async () => {
            await this.api.refresh(); this.notice = 'Offered getters refreshed; absent providers were not probed.'; this.signal();
        });
    }
    async captureBaseline() {
        return this.run('Baseline', async () => {
            if (this.trial) throw new Error('Baseline cannot be overwritten while a trial is unresolved');
            let refreshError = '';
            try { await this.api.refresh(); } catch (e) { refreshError = message(e); }
            const baseline = Object.assign({ schemaVersion: 1, refreshError }, this.capture());
            this.store.save(BASELINE_FILE, baseline); this.baseline = baseline;
            this.record('baseline', 'Saved raw baseline; timestamps distinguish fresh, stale and missing values', baseline, true);
            this.notice = refreshError ? 'Baseline saved with getter errors; inspect raw timestamps/errors.' : 'Raw baseline saved. This does not arm experiments.';
            return baseline;
        });
    }
    async arm() {
        return this.run('Arm', async () => {
            if (this.preview) throw new Error('Preview is observation-only');
            if (!this.visible) throw new Error('App must be visible to arm');
            if (Object.keys(this.store.errors).length) throw new Error('Resolve evidence errors before arming: ' + this.storageError());
            if (!this.api.available('vehicle')) throw new Error('Speed provider is not offered');
            const epoch = this.api.epoch('vehicle');
            const raw = await this.api.read('vehicle', 'statusCarSpeed2');
            if (this.closed || !this.visible || this.preview || this.api.epoch('vehicle') !== epoch || !this.api.available('vehicle')) throw new Error('Visibility or speed provider changed while arming');
            if (D.speed(raw) !== 0) throw new Error('Exact valid raw speed zero is required; no inferred speed scaling is accepted');
            this.record('arm', 'Explicit stationary arming requested', { speed: raw, vehicleEpoch: epoch, trialId: this.trial ? this.trial.id : null }, true);
            this.loggingFailed = false; this.armVehicleEpoch = epoch; this.armedUntil = Date.now() + ARM_MS;
            this.notice = 'Armed for 30 seconds at reported standstill. One trial only; physical effects remain unproven.';
            this.signal();
        });
    }
    async readExteriorContext() {
        for (const field of ['mainLightswitchState', 'foglightFront', 'foglightRear', 'lightswitchButtonAvailability']) {
            try { await this.api.read('exterior', field); } catch (e) { this.record('context-error', field + ': ' + message(e)); }
        }
    }
    restorePlan(control, originalRaw) {
        const plan = D.restore(control, originalRaw);
        const steps = plan.requests.map((request) => ({ request, checks: clone(plan.checks) }));
        const warnings = ['Only valid known catalog fields are restorable. Unknown/reserved fields and physical side effects are not proved restored.'];
        if (control.id === 'exteriorMode') {
            ['frontFog', 'rearFog'].forEach((id) => {
                const fog = D.control(id), reading = this.readings[D.readKey(fog)];
                if (reading && !this.getterErrors[D.readKey(fog)] && reading.source === 'getter' && Date.now() - reading.at < D.freshMs && D.current(fog, reading.value) !== undefined) {
                    const extra = D.restore(fog, reading.value);
                    extra.requests.forEach((request) => steps.push({ request, checks: clone(extra.checks) }));
                } else warnings.push(id + ' original was not freshly valid; inspect this fog state physically and with stock controls.');
            });
            warnings.push('Mode requests may affect fog or other lamps. Only known fog changes can be requested back, and only while explicitly OPERABLE. Physical lamps still require inspection.');
        }
        return { steps, warnings };
    }
    async apply(controlId, value) {
        return this.run('Apply', async () => {
            if (this.trial) throw new Error('Restore the unresolved trial before starting another');
            this.requireArmed();
            const control = D.control(controlId);
            if (!D.validValue(control, value)) throw new Error('Unsupported control/value');
            const tokens = this.tokens(control.service);
            if (control.service === 'exterior') await this.readExteriorContext();
            const original = await this.api.read(control.service, control.readField);
            this.requireArmed(); this.checkTokens(tokens);
            const plan = this.restorePlan(control, original), request = D.command(control, value);
            this.trial = { id: 'light-' + Date.now().toString(36) + '-' + (++this.sequence), controlId, value,
                status: 'prepared', createdAt: Date.now(), before: this.capture(), originalRaw: clone(original),
                restorePlan: plan, applyRequest: clone(request), applyCheck: { controlId, value },
                providerEpochs: clone(tokens), dispatches: [], errors: [], annotations: [],
                physical: { result: 'uncertain', at: null, note: 'Transport/readback is not physical confirmation' } };
            this.persistTrial(); this.record('trial-prepared', 'Known original and planned restore durably captured before dispatch', this.trial, true);
            try {
                const dispatch = await this.dispatch(request, tokens, 'apply');
                const verification = await this.verify([this.trial.applyCheck], request, dispatch, tokens);
                this.trial.applyVerification = verification; this.trial.after = this.capture();
                if (!verification.matched) throw new Error(verification.detail);
                this.trial.status = 'apply-reported'; this.persistTrial();
                this.record('apply-readback', 'Fresh reported target matches' + (request.service === 'exterior' ? ' with matching switch feedback' : '') + '; physical result is separate', verification, true);
                this.notice = 'Reported state matched; physical result unconfirmed. Trial remains pending until explicit Restore.';
            } catch (e) { this.unresolved('Apply', e); throw e; }
            finally { this.disarm('One trial requested; rearm explicitly to restore', true); }
            return this.trial;
        });
    }
    async dispatch(request, tokens, phase) {
        this.requireArmed(); this.checkTokens(tokens);
        let availability = null;
        if (request.service === 'exterior') {
            availability = await this.api.read('exterior', 'lightswitchButtonAvailability');
            if (!D.available(request, availability)) throw new Error('Exterior control is not explicitly OPERABLE; no request sent');
        }
        const speed = await this.api.read('vehicle', 'statusCarSpeed2');
        this.requireArmed(); this.checkTokens(tokens);
        if (D.speed(speed) !== 0) throw new Error('Fresh speed getter is not exact valid zero; no request sent');
        const dispatch = { phase, at: Date.now(), request: clone(request), status: 'dispatch-pending',
            speed: clone(speed), availability: clone(availability), providerEpochs: clone(tokens),
            feedbackSample: (this.readings['exterior.showLightswitchOperationFeedback'] || {}).samples || 0 };
        this.trial.status = phase === 'restore' ? 'restore-pending' : 'dispatch-pending';
        this.trial.dispatches.push(dispatch); this.persistTrial();
        this.record('dispatch-pending', 'Durable intent before SDK invocation; a crash from this point means unknown outcome', { trial: this.trial }, true);
        this.requireArmed(); this.checkTokens(tokens);
        this.dispatchPermit = { request, tokens, dispatch, speedAt: (this.readings['vehicle.statusCarSpeed2'] || {}).at, availability };
        try {
            const reply = await this.api.send(request);
            dispatch.ackAt = Date.now(); dispatch.reply = clone(reply); dispatch.status = 'transport-returned';
            this.persistTrial(); this.record('transport-returned', 'SDK returned; this is not physical success', dispatch, true);
            return dispatch;
        } catch (e) {
            dispatch.status = 'unknown'; dispatch.error = message(e); dispatch.errorAt = Date.now();
            this.disarm('Dispatch error or timeout; outcome unknown'); throw e;
        } finally { this.dispatchPermit = null; }
    }
    dispatchGuard(request, consume) {
        const permit = this.dispatchPermit;
        if (!permit || permit.request !== request || !this.trial) throw new Error('No durable stationary trial authorizes this dispatch');
        this.requireArmed(); this.checkTokens(permit.tokens);
        const speed = this.readings['vehicle.statusCarSpeed2'];
        if (!speed || speed.source !== 'getter' || speed.at !== permit.speedAt || Date.now() - speed.at >= D.freshMs || D.speed(speed.value) !== 0) {
            this.disarm('Final speed getter is no longer valid'); throw new Error('Fresh getter standstill authorization expired');
        }
        const latestAvailability = this.readings['exterior.lightswitchButtonAvailability'];
        if (!D.available(request, permit.availability) || (request.service === 'exterior' &&
            (!latestAvailability || !D.available(request, latestAvailability.value)))) throw new Error('Exterior availability authorization is missing or changed');
        if (consume) { permit.dispatch.invokedAt = Date.now(); this.dispatchPermit = null; }
    }
    async readChecks(checks) {
        const raw = {};
        for (const check of checks) {
            const control = D.control(check.controlId), key = D.readKey(control);
            if (!Object.prototype.hasOwnProperty.call(raw, key)) raw[key] = await this.api.read(control.service, control.readField);
        }
        return { at: Date.now(), raw: clone(raw), matched: checks.every((check) => D.matches(check, raw[D.readKey(D.control(check.controlId))])) };
    }
    async verify(checks, request, dispatch, tokens) {
        let last = null, error = '', feedback = null;
        const until = Date.now() + 5000;
        for (let attempt = 0; attempt < 5 && Date.now() < until; attempt++) {
            if (this.closed) throw new Error('App closed after dispatch; outcome unknown');
            if (!this.api.available(tokens.service) || !this.api.available('vehicle') || this.api.epoch(tokens.service) !== tokens.target || this.api.epoch('vehicle') !== tokens.vehicle) throw new Error('Provider changed during readback; outcome unknown');
            last = null;
            try { last = await this.readChecks(checks); } catch (e) { error = message(e); }
            if (request.service === 'exterior') {
                feedback = this.feedback.find((event) => event.at >= (dispatch.invokedAt || dispatch.at) && event.sample > dispatch.feedbackSample && D.feedbackMatches(request, event.value)) || null;
                if (feedback && feedback.value.successful !== true) {
                    return { matched: false, at: Date.now(), checks: clone(checks), getters: last, feedback: clone(feedback),
                        detail: 'Matching exterior feedback rejected or did not confirm the request; trial remains unresolved' };
                }
            }
            if (last && last.matched && (request.service !== 'exterior' || (feedback && feedback.value.successful === true))) {
                return { matched: true, at: Date.now(), checks: clone(checks), getters: last, feedback: clone(feedback), detail: 'Reported state matched; physical effect is unconfirmed' };
            }
            if (attempt < 4) await pause(250);
        }
        return { matched: false, at: Date.now(), checks: clone(checks), getters: last, feedback: clone(feedback), error,
            detail: 'Reported state or matching exterior feedback not confirmed; trial remains unresolved' + (error ? ': ' + error : '') };
    }
    unresolved(label, error) {
        if (!this.trial || this.closed) return;
        this.trial.status = 'unresolved'; this.trial.after = this.capture();
        this.trial.errors.push({ at: Date.now(), phase: label, error: message(error) });
        if (this.trial.errors.length > 40) this.trial.errors.shift();
        this.notice = label + ' unresolved: ' + message(error) + '. No automatic restore; rearm and explicitly Restore.';
        this.disarm(label + ' failed or unconfirmed', true);
        try { this.persistTrial(); } catch (e) { /* The pre-dispatch journal retains the original and restore plan. */ }
        this.record('unresolved', this.notice, this.trial);
    }
    async restore() {
        return this.run('Restore', async () => {
            if (!this.trial) throw new Error('No unresolved trial to restore');
            this.requireArmed();
            const trial = this.trial, tokens = this.tokens(D.control(trial.controlId).service);
            trial.restoreAttempts = (trial.restoreAttempts || 0) + 1;
            trial.restoreBefore = this.capture(); trial.status = 'restore-pending'; this.persistTrial();
            try {
                for (const step of trial.restorePlan.steps) {
                    this.requireArmed(); this.checkTokens(tokens);
                    const before = await this.readChecks(step.checks);
                    trial.restoreCheck = before;
                    if (before.matched) {
                        this.record('restore-no-dispatch', 'Fresh getters already match this known original; no command or feedback required', { trialId: trial.id, checks: step.checks, getters: before }, true);
                        continue;
                    }
                    const dispatch = await this.dispatch(step.request, tokens, 'restore');
                    const verification = await this.verify(step.checks, step.request, dispatch, tokens);
                    dispatch.verification = verification;
                    if (!verification.matched) throw new Error(verification.detail);
                }
                const checks = [].concat.apply([], trial.restorePlan.steps.map((step) => step.checks));
                const final = await this.readChecks(checks);
                trial.restoreVerification = final; trial.restored = this.capture();
                if (!final.matched) throw new Error('A known original changed during restore; inspect and explicitly retry');
                trial.status = 'restored'; trial.restoredAt = Date.now();
                this.record('restore-reported', 'Fresh getters match all known planned original fields. Physical lamps and unknown side effects remain unconfirmed.', trial, true);
                this.lastTrial = trial; this.trial = null;
                try { this.persistTrial(); }
                catch (e) { this.trial = trial; trial.status = 'unresolved'; throw e; }
                this.notice = 'Known reported original fields match; trial closed. Physical lamps and unknown side effects still require inspection.';
                return trial;
            } catch (e) { this.unresolved('Restore', e); throw e; }
            finally { this.disarm('Restore action ended', true); }
        });
    }
    annotate(label) {
        if (this.closed) throw new Error('Lighting lab is closed');
        if (typeof label !== 'string' || !label.trim() || label.length > 200) throw new Error('Choose a nonempty annotation of at most 200 characters');
        const note = { at: Date.now(), label: label.trim(), trialId: this.trial ? this.trial.id : this.lastTrial ? this.lastTrial.id : null };
        this.notes.push(note); if (this.notes.length > 100) this.notes.shift();
        const target = this.trial || this.lastTrial;
        if (target) { target.annotations.push(note); if (target.annotations.length > 100) target.annotations.shift(); }
        try { this.persistTrial(); this.record('annotation', note.label, note, true); this.notice = 'Physical observation note saved; no color/zone mapping inferred.'; }
        catch (e) { this.fail('Annotation evidence', e); throw e; }
        this.signal();
    }
    confirmPhysical(result) {
        if (this.closed) throw new Error('Lighting lab is closed');
        if (['yes', 'no', 'uncertain'].indexOf(result) < 0) throw new Error('Physical result must be yes, no, or uncertain');
        const target = this.trial || this.lastTrial;
        if (!target) throw new Error('No trial is available for physical confirmation');
        target.physical = { result, at: Date.now(), stage: this.trial ? 'trial' : 'after-reported-restore', note: 'User observation, independent of transport acknowledgement and reported state' };
        try { this.persistTrial(); this.record('physical-observation', 'User physical observation: ' + result, { trialId: target.id, physical: target.physical }, true); this.notice = 'Physical observation saved separately from reported-state checks.'; }
        catch (e) { this.fail('Physical observation evidence', e); throw e; }
        this.signal();
    }
    async snapshot() {
        this.requireOpen();
        const snapshot = Object.assign({ schemaVersion: 1, startedAt: this.startedAt, armedUntil: this.armedUntil, busy: this.busy,
            baseline: clone(this.baseline), trial: clone(this.trial), lastTrial: clone(this.lastTrial), notes: clone(this.notes),
            events: clone(this.events), storageErrors: clone(this.store.errors), notice: this.notice }, this.capture());
        try { this.store.save(SNAPSHOT_FILE, snapshot); this.record('snapshot', 'Saved full raw research snapshot', { file: SNAPSHOT_FILE, at: snapshot.at }, true); this.notice = 'Full raw snapshot saved to ' + SNAPSHOT_FILE; }
        catch (e) { this.fail('Snapshot', e); throw e; }
        this.signal(); return snapshot;
    }
    close() {
        if (this.closed) return;
        this.disarm('App closed'); clearInterval(this.timer);
        if (this.trial) {
            this.trial.status = 'unresolved'; this.trial.closedAt = Date.now(); this.trial.after = this.capture();
            this.trial.errors.push({ at: Date.now(), phase: 'close', error: 'App closed with unresolved trial; no automatic write or replay' });
            try { this.persistTrial(); } catch (e) { /* Earlier durable intent remains authoritative. */ }
        }
        this.record('close', 'Lab closed; no automatic vehicle writes');
        this.closed = true; this.store.close();
    }
}
module.exports = { Lab };

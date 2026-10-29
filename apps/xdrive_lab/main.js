'use strict';
const mgu = require('./kit/mgu');
const D = require('./domain');
const { Store } = require('./storage');
const { Lab } = require('./lab');
const { Services } = require('./services');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, store = new Store(ctx.dataDir);
        const visible = {}, cache = {}, counts = {}, enabledCache = {};
        let closed = false, refreshTimer = null, hideTimer = null, clock = null, actionBusy = false;
        let selectedService = D.SERVICES[0].key, selectedField = null, selectedEvent = false;
        let backendId = D.CANDIDATES[0].id, modeId = D.MODES[0].id, restorePhase = false;
        let selectedEcu = D.ECUS[0].address, did = 0xDB32, nibble = 0;
        let selectedStage = D.PROTOCOL[0].id, selectedHelp = 0;
        let fieldRows = [], frameRows = [], historyRows = [], gateRows = [];
        let rawTitle = '', rawText = '', rawPage = 0, rawLive = null, rawBack = 'MAIN';
        let lastSaved = null, lastExport = null;
        const screens = ['MAIN', 'OVERVIEW', 'PROVIDERS', 'FIELD', 'DIAGNOSTICS', 'DID', 'BASELINE',
            'EXPERIMENT', 'ARM', 'APPLY', 'RESTORE', 'EXTERNAL', 'PROTOCOL', 'STAGE', 'HISTORY', 'RAW', 'HELP'];
        const outcomes = ['observed', 'no-change', 'unexpected', 'uncertain', 'warning', 'restored'];
        const stageOutcomes = ['not-run', 'in-progress', 'observed', 'blocked', 'failed'];
        const digits = '0123456789ABCDEF'.split('');
        const help = [
            ['Scope and evidence', 'This is an xDrive research lab, not a validated drive-mode conversion. Catalog presence, an offered provider or a setter return does not prove support on this vehicle. Transport result, fresh reported status and your physical observation are recorded separately. A zero front-torque report does not establish a mechanically open clutch or 100% rear drive.'],
            ['Live safety gates', 'Native requests need fresh (at most 2 seconds) offered-provider evidence: exact zero car speed and four valid wheel RPMs, valid actual and virtual pedals at zero, actual/target selector P with actual gear N_OR_P, applied handbrake, valid DSC (DSC_AUS for RWD), ready/active actual MDrive status, operable MDrive display and RSU session explicitly false. Missing, stale, invalid or unfilled data blocks requests; there is no bypass. Do not operate this menu while driving.'],
            ['Native experiments and arming', 'Choose one of two native MDrive backends and one explicit target. AWD standard, 4WD alternative (Sport candidate only) and RWD are distinct raw candidates. The request fills unrelated members with exact catalog no-change/no-operation values, not blanket zero. Baseline, evidence storage, all gates and a visible non-preview app are required. Arm binds backend, target and apply/restore phase for at most 30 seconds. Review and Send are separate actions. Arming alone sends nothing. FES/DSC are never changed by this app.'],
            ['Unresolved trial and restore', 'Durable intent is saved before invocation. No retry, replay, automatic restore or reset occurs after errors, timeouts, hiding or restart. A retained trial blocks new trials. Refresh and inspect complete evidence. Restore original requires a separately armed explicit request. Both native and external restoration remain retained until fresh original reported mode plus your explicit acknowledgement/review permit archiving. Reported restoration is not proof of physical torque behavior. Disarm never means restore.'],
            ['Read-only diagnostics', 'DB32 manually reads LMV at 0x19. Optional LMV polling is off at startup, at most one read per second after completion, and pauses for arming/native trials. F150 identifiers and readDTCInformation are manual four-ECU reads; no DTC clearing. Custom DID allows only a selected four-ECU address and a UInt16 DID with SID 0x22. No sessions, unlocks, resets, arbitrary SID, actuations, sweeps, coding or flashing. All requests are serialized. Full envelopes, NRC, verdicts and timing are available in frame detail.'],
            ['DB32 and ECU limitations', 'LMV_G11 (0x19), VIP_G05 (0x39), IB_G05 (0x29) and GSD_F90 (0x0F) are local historical lookup hints, not current ECU identity. A positive reply must match ECU, SID and echoed DID; timeout, late and unattributed traffic are not successful matches. DB32 torque numbers are explicitly unvalidated Nm candidates. Raw actual/target/qualifier fields remain evidence, never a clutch-open inference.'],
            ['Guided ISTA workflow', 'Use Protocol for read-only baseline, manual stock FES/DSC comparisons, guided external ISTA work, transport mapping, native trials and lifecycle/thermal research. The app cannot run diagnostic clutch actuations. Perform any permitted external ISTA procedure using its actual documented tooling; record before/after markers, warnings and stage outcomes here. Stage outcomes are operator claims, not automatic acceptance. Never infer persistent mode support from one ignition cycle or an unloaded torque reading.'],
            ['Recording, retention and export', 'Every delivered sample is recorded with source, wall/monotonic time, sequence/session and provider epoch. Getter, notification and event counts are separate. Observed inter-arrival gaps are not packet-loss estimates. Snapshots do not feed historical samples into live gates. Recorder status exposes queuing, drops, errors, rotations and evictions; export includes retained raw files and counters, not an unlimited history promise. Recording errors disarm and block native writes. Export files remain on the app host/data directory; shown paths are not automatic uploads.'],
            ['Preview, visibility and shutdown', 'Preview is strictly read-only: no real proxies, diagnostic traffic, arming or native writes, even with injected observations. Native screen transitions use whole-app visibility debounce. A truly hidden app disarms but continues read-only subscriptions/recording. Shutdown closes services then flushes the lab; there are no automatic vehicle commands. Reconnect is explicit and blocked while a trial is unresolved.'],
            ['Raw fields and schema', 'All 14 providers and 42 fields are listed with exact interface, instance and catalog getter/notification permissions. Notification-only fields cannot be actively read. Field schema includes the full reachable datatype closure and catalog source hash. Complete JSON views are paginated without clipping the payload; use Previous/Next. Dynamic field evidence is live; saved baselines and snapshots remain historical. Full catalog, diagnostics, events and recorder status have separate raw views.']
        ];
        const json = (value) => value === undefined ? 'No value received' : JSON.stringify(value, null, 2);
        const brief = (value, max) => D.rawSummary(value, max || 260);
        const text = (id, value, row) => {
            const index = row || 0, key = id + ':' + index, label = String(value);
            if (cache[key] === label) return;
            cache[key] = label; ui.text(id, label, index);
        };
        const rows = (id, labels) => {
            if (!labels.length) labels = ['No retained entries'];
            if (counts[id] !== labels.length) {
                counts[id] = labels.length;
                Object.keys(cache).filter((key) => key.indexOf(id + ':') === 0).forEach((key) => delete cache[key]);
                ui.rows(id, labels.length);
            }
            labels.forEach((label, index) => text(id, label, index));
        };
        function changed() {
            if (closed || refreshTimer) return;
            refreshTimer = setTimeout(() => {
                refreshTimer = null;
                try { render(); } catch (error) { lab.notice = 'UI render error: ' + error.message; text('HOME_NOTICE', lab.notice); }
            }, 120);
        }
        const lab = new Lab({ store, changed, preview: !!ctx.preview });
        const services = new Services(ctx, lab); lab.api = services;
        ctx.xdriveLab = lab; ctx.xdriveServices = services;
        const fail = (error) => { lab.notice = error && error.message ? error.message : String(error); changed(); };
        const enabled = (id, on) => {
            on = !!on;
            if (enabledCache[id] === on) return;
            enabledCache[id] = on;
            Promise.resolve(ui.enabled(id, on)).catch(fail);
        };
        const busy = () => actionBusy || lab.busy || services.diagBusy;
        const bind = (id, action) => ui.onClick(id, async (event) => {
            if (closed) return;
            if (actionBusy) { fail(new Error('An action is already in progress; wait for its result')); return; }
            actionBusy = true; changed();
            try { await action(event || {}); } catch (error) { fail(error); }
            finally { actionBusy = false; changed(); }
        });
        const show = (name) => { render(); return ui.open(name); };
        const currentScreen = () => screens.filter((name) => visible[name])[0] || 'MAIN';
        const openRaw = (title, value, live, back) => {
            rawTitle = title; rawText = json(value); rawPage = 0; rawLive = live || null;
            rawBack = back || currentScreen(); if (rawBack === 'RAW') rawBack = 'MAIN';
            return show('RAW');
        };
        const reading = (key, field) => lab.readings[key + '.' + field];
        const service = () => D.service(selectedService);
        const field = () => D.field(selectedService, selectedField);
        const provider = (key) => {
            const state = lab.services[key];
            return !state || typeof state.available !== 'boolean' ? 'Unknown' : state.available ? 'Offered' : 'Unavailable';
        };
        const age = (sample) => {
            if (!sample) return 'Never received';
            const elapsed = Math.max(0, lab.now() - sample.monoMs);
            return Number.isFinite(elapsed) ? (elapsed / 1000).toFixed(1) + 's old | ' + (elapsed <= D.freshMs ? 'fresh' : 'STALE') : 'No monotonic age';
        };
        const hex = (value, size) => ('00000000' + value.toString(16).toUpperCase()).slice(-size);
        const original = () => lab.trial && lab.trial.originalMode;
        const restoreBackend = () => lab.trial && lab.trial.backendId;
        const target = () => restorePhase ? { backendId: restoreBackend(), modeId: original(), restore: true } :
            { backendId, modeId, restore: false };
        const blocker = (selection, armed) => lab.blocked(selection.backendId, selection.modeId, selection.restore, !!armed);
        const currentMode = () => {
            const sample = reading('mdrive', 'statusMSystem'), state = lab.services.mdrive;
            const mode = D.currentMode(sample && sample.value), elapsed = sample ? lab.now() - sample.monoMs : Infinity;
            if (!sample || !state || state.available !== true || sample.epoch !== state.epoch || elapsed < 0 || elapsed > D.freshMs) {
                return { valid: false, mode: null, qualifier: mode.qualifier,
                    detail: 'No fresh same-provider AWD report. Last raw interpretation: ' + mode.detail };
            }
            return mode;
        };
        const modeLabel = (id) => {
            const found = D.MODES.find((entry) => entry.id === id); return found ? found.label : String(id || 'Unknown');
        };
        const request = (selection) => D.nativeRequest(selection.backendId, selection.modeId);
        const requestDetail = (selection) => {
            if (!selection.backendId || !selection.modeId) return 'No retained original target / backend';
            return 'Phase: ' + (selection.restore ? 'RESTORE original' : 'APPLY candidate') + '\nBackend: ' + selection.backendId +
                '\nTarget: ' + modeLabel(selection.modeId) + '\nExact request: ' + json(request(selection));
        };
        const diagnosticBlocker = () => ctx.preview ? 'Preview prohibits real diagnostic traffic' :
            lab.busy ? 'Native operation in progress' : services.diagBusy ? 'Diagnostic request in progress' :
                lab.armRemaining() > 0 ? 'Armed: diagnostics paused' :
                    services.diagBlocked ? 'Diagnostic quarantine after timeout/provider failure; explicit reconnect required (blocked while trial unresolved)' :
                        provider('tasu') !== 'Offered' ? 'TASU provider is not offered' : '';
        const ensureDiagnostic = () => {
            const reason = diagnosticBlocker(); if (reason) throw new Error(reason);
        };
        const diagnose = async (title, action, back) => {
            ensureDiagnostic();
            const result = await action(), results = Array.isArray(result) ? result : [result];
            lab.notice = title + ': ' + results.map((entry) => entry.status + (entry.detail ? ' - ' + entry.detail : '')).join(' | ') +
                '. These are transport/read outcomes, not physical drivetrain proof.';
            return openRaw(title + ' / complete result', result, null, back || 'DIAGNOSTICS');
        };
        const schema = () => {
            const entry = selectedEvent ? null : field(), types = {}, catalog = D.catalog;
            function visit(ref) {
                if (!ref || Object.prototype.hasOwnProperty.call(types, ref)) return;
                const type = catalog.datatypes[ref];
                if (!type) return;
                types[ref] = type;
                function references(value) {
                    if (!value || typeof value !== 'object') return;
                    if (value.dataRef) visit(value.dataRef);
                    Object.keys(value).forEach((key) => { if (key !== 'dataRef') references(value[key]); });
                }
                references(type);
            }
            if (entry) visit(entry.dataRef);
            return { source: catalog.source, sourceSha256: catalog.sourceSha256, provider: service(),
                field: entry || { event: selectedField, note: 'Broadcast envelope; see provider schema / complete catalog' }, datatypes: types };
        };
        function render() {
            if (closed) return;
            const safety = lab.safety(modeId), actual = currentMode(), stats = store.stats();
            const errors = Object.keys(store.errors || {}).map((key) => key + ': ' + store.errors[key]).join(' | ');
            const notice = String(lab.notice || 'Observation is read-only until a specific request is armed.') +
                (errors ? '\nEVIDENCE STORAGE ERROR: ' + errors : '');
            screens.forEach((name) => text((name === 'MAIN' ? 'HOME' : name) + '_NOTICE', notice));
            const state = (ctx.preview ? 'PREVIEW: no vehicle writes / diagnostics | ' : '') +
                (lab.armRemaining() > 0 ? 'ARMED ' + lab.armRemaining() + 's' : 'DISARMED') +
                (busy() ? ' | BUSY' : '') + (lab.trial ? ' | UNRESOLVED TRIAL' : '') +
                '\nActual reported: ' + modeLabel(actual.mode) +
                '\nSelected candidate: ' + backendId + ' / ' + modeLabel(modeId) +
                (lab.armRemaining() > 0 && lab.armSelection ? '\nAuthorization: ' + lab.armSelection.backendId + ' / ' +
                    modeLabel(lab.armSelection.modeId) + ' / ' + (lab.armSelection.restore ? 'RESTORE' : 'APPLY') : '');
            text('HOME_SAFETY', state);
            text('HOME_STATE', 'Live gates: ' + (safety.ok ? 'eligible (arming still required)' :
                safety.reasons.length + ' BLOCKED checks; inspect Live gates') +
                '\nBaseline: ' + (lab.baseline ? 'Saved historical evidence' : 'Not captured') +
                '\nOffered providers: ' + D.SERVICES.filter((entry) => lab.services[entry.key] &&
                    lab.services[entry.key].available === true).length + ' / ' + D.SERVICES.length);
            enabled('HOME_RETRY', !busy() && !lab.trial);
            text('HOME_RETRY', lab.trial ? 'Reconnect BLOCKED: unresolved trial' : 'Reconnect offered providers (read only)');
            enabled('HOME_DISARM', true);
            if (visible.OVERVIEW) {
                text('OVERVIEW_STATE', state + '\nGates apply to selected ' + modeLabel(modeId) +
                    '; configuration/display are not actual mode.\n' + safety.reasons.join('\n'));
                gateRows = safety.checks || [];
                rows('OVERVIEW_CHECKS', gateRows.map((entry) => (entry.ok ? 'OK ' : 'BLOCKED ') + entry.label + ' | ' + entry.detail));
            }
            if (visible.PROVIDERS) {
                rows('PROVIDERS_LIST', D.SERVICES.map((entry) => entry.label + ' | ' + provider(entry.key) +
                    ' | fields ' + entry.fields.length));
                const selected = service(), providerState = lab.services[selectedService];
                text('PROVIDERS_STATE', selected.iface + '\nInstance: ' + selected.instance + ' | service ID ' + selected.serviceId +
                    ' | version ' + json(selected.version) + '\n' + brief(providerState, 420));
                fieldRows = selected.fields.map((entry) => ({ name: entry.name, getter: entry.getter, notify: entry.notify, event: false }))
                    .concat((selected.events || []).map((name) => ({ name, event: true })));
                rows('PROVIDERS_FIELDS', fieldRows.map((entry) => entry.name + ' | ' +
                    (entry.event ? 'broadcast' : (entry.getter ? 'getter ' : '') + (entry.notify ? 'notification' : '')) +
                    ' | ' + age(reading(selectedService, entry.name)) +
                    (lab.readErrors[selectedService + '.' + entry.name] ? ' | ERROR: ' + brief(lab.readErrors[selectedService + '.' + entry.name]) : '')));
            }
            if (visible.FIELD) {
                const sample = reading(selectedService, selectedField), descriptor = selectedEvent ? null : field();
                text('FIELD_TITLE', selectedService + '.' + selectedField + ' | ' + provider(selectedService));
                text('FIELD_STATE', age(sample) + '\nPermissions: ' + (selectedEvent ? 'broadcast only' : descriptor && descriptor.getter ?
                    'getter' + (descriptor.notify ? ' + notification' : '') : 'notification-only; no active read') +
                    '\nSource: ' + (sample ? sample.source : 'None') + ' | samples ' + (sample ? sample.samples : 0) +
                    '\nGetter/notification/event: ' + (sample ? [sample.getterSamples, sample.notificationSamples, sample.eventSamples].join('/') : '0/0/0') +
                    '\nObserved gap ms last/min/max: ' + (sample ? [sample.lastGapMs, sample.minGapMs, sample.maxGapMs].join('/') : 'None') +
                    '\nRead error: ' + brief(lab.readErrors[selectedService + '.' + selectedField] || 'None'));
                text('FIELD_VALUE', sample ? brief(sample.value, 650) + '\nOpen complete reading below; summary is not the full payload.' : 'No sample; absence does not prove capability.');
                enabled('FIELD_REFRESH', !busy() && !!descriptor && descriptor.getter && provider(selectedService) === 'Offered');
            }
            if (visible.DIAGNOSTICS || visible.DID) {
                const reason = diagnosticBlocker();
                text('DIAGNOSTICS_STATE', 'TASU: ' + provider('tasu') + ' | LMV polling: ' + (services.polling ? 'ON (opt-in)' : 'OFF') +
                    '\n' + (reason || 'Manual reads available; no automatic retry') + '\nRetained diagnostic events: ' + lab.diagnostics.length);
                ['DIAGNOSTICS_DB32', 'DIAGNOSTICS_IDENTIFY', 'DIAGNOSTICS_FAULTS', 'DID_SEND'].forEach((id) => enabled(id, !reason && !busy()));
                enabled('DIAGNOSTICS_POLL', !reason && !busy());
                text('DIAGNOSTICS_POLL', reason ? 'Polling BLOCKED: ' + reason : 'Enable / explicitly resume opt-in LMV DB32 polling');
                enabled('DIAGNOSTICS_STOP', !actionBusy || !!services.polling);
                frameRows = lab.diagnostics.slice();
                rows('DIAGNOSTICS_FRAMES', frameRows.map((entry, index) => '#' + (frameRows.length - index) + ' | ' + brief(entry.evidence || entry, 200)));
                const ecu = D.ECUS.find((entry) => entry.address === selectedEcu);
                text('DID_STATE', 'ECU 0x' + hex(selectedEcu, 2) + ' | ' + ecu.label + ' | lookup variant: ' + ecu.variant +
                    '\nDID 0x' + hex(did, 4) + ' (' + did + '), nibble ' + (nibble + 1) + ' selected\nRequest: SID 22, data [' + hex(did >> 8, 2) + ' ' + hex(did & 255, 2) +
                    ']\n' + (reason || 'Ready for one explicit read'));
                rows('DID_TARGETS', D.ECUS.map((entry) => (entry.address === selectedEcu ? '> ' : '') + '0x' + hex(entry.address, 2) + ' ' + entry.label + ' / ' + entry.variant));
                rows('DID_NIBBLES', [0, 1, 2, 3].map((index) => (index === nibble ? '> ' : '') + 'Digit ' + (index + 1) + ': ' + hex(did, 4)[index]));
                rows('DID_VALUES', digits.map((digit) => 'Set selected digit to ' + digit));
            }
            if (visible.BASELINE) {
                text('BASELINE_STATE', 'Baseline: ' + (lab.baseline ? 'Saved (historical, never live gate input)' : 'Not captured') +
                    '\nTrial: ' + (lab.trial ? 'Unresolved; baseline replacement blocked' : 'None') +
                    '\nLatest snapshot: ' + brief(lastSaved) + '\nLatest export: ' + brief(lastExport));
                text('BASELINE_RETENTION', 'Recorder / retention summary (open complete status below):\n' + brief(stats, 700) +
                    '\nExports contain retained journal files and explicit retention/drop/error counters; not unlimited history.');
                enabled('BASELINE_CAPTURE', !busy() && !lab.trial);
                enabled('BASELINE_RAW', !!lab.baseline);
                enabled('BASELINE_SNAPSHOT', !busy()); enabled('BASELINE_EXPORT', !busy());
                enabled('BASELINE_LAST', !!(lastSaved || lastExport));
            }
            if (visible.EXPERIMENT) {
                const selection = { backendId, modeId, restore: false }, reason = blocker(selection, false);
                text('EXPERIMENT_STATE', state + '\nEligibility: ' + (reason || 'Eligible for target-bound arming; not yet permission to send'));
                rows('EXPERIMENT_BACKENDS', D.CANDIDATES.map((entry) => (entry.id === backendId ? '> ' : '') + entry.label + ' | ' + entry.field + '.' + entry.member));
                rows('EXPERIMENT_MODES', D.MODES.map((entry) => (entry.id === modeId ? '> ' : '') + entry.label +
                    ' | actual=' + entry.actual + ', display=' + entry.display));
                enabled('EXPERIMENT_ARM', !busy() && !reason);
                text('EXPERIMENT_ARM', reason ? 'Arm BLOCKED: ' + reason : 'Review arming: ' + backendId + ' / ' + modeLabel(modeId));
                const sendReason = blocker(selection, true);
                text('EXPERIMENT_APPLY', sendReason ? 'Send BLOCKED: ' + sendReason : 'Review explicit armed request');
                enabled('EXPERIMENT_APPLY', !busy() && !sendReason);
            }
            if (visible.ARM || visible.APPLY) {
                const selection = target(), armReason = blocker(selection, false), sendReason = blocker(selection, true);
                const detail = requestDetail(selection) + '\n' + state;
                text('ARM_DETAILS', detail + '\n' + (armReason ? 'BLOCKED: ' + armReason : 'Ready for explicit arming'));
                text('APPLY_DETAILS', detail + '\n' + (sendReason ? 'BLOCKED: ' + sendReason : 'Ready for one explicit invocation') +
                    '\nTransport return, reported match and operator outcome remain separate evidence.');
                enabled('ARM_CONFIRM', !busy() && !armReason);
                enabled('APPLY_CONFIRM', !busy() && !sendReason);
                text('APPLY_CONFIRM', sendReason ? 'Send BLOCKED: ' + sendReason : selection.restore ? 'Send one armed RESTORE request' : 'Send one armed APPLY request');
            }
            if (visible.RESTORE || visible.EXTERNAL) {
                const selection = { backendId: restoreBackend(), modeId: original(), restore: true };
                const reason = lab.trial ? blocker(selection, false) : 'No retained unresolved trial';
                text('RESTORE_STATE', 'Trial: ' + (lab.trial ? 'Retained; inspect complete evidence' : 'None') +
                    '\nOriginal reported target: ' + modeLabel(original()) + ' | backend ' + (restoreBackend() || 'None') +
                    '\nCurrent: ' + modeLabel(actual.mode) + ' | ' + age(reading('mdrive', 'statusMSystem')) +
                    '\n' + (reason ? 'Native restore BLOCKED: ' + reason : 'Eligible to review separate restore arming'));
                enabled('RESTORE_RAW', !!(lab.trial || lab.lastTrial));
                enabled('RESTORE_ARM', !!lab.trial && !busy() && !reason);
                const sendReason = lab.trial ? blocker(selection, true) : 'No retained trial';
                enabled('RESTORE_CONFIRM', !!lab.trial && !busy() && !sendReason);
                text('RESTORE_CONFIRM', sendReason ? 'Restore send BLOCKED: ' + sendReason : 'Review armed original-mode restore');
                enabled('RESTORE_EXTERNAL', !!lab.trial && !busy());
                text('EXTERNAL_STATE', 'Retained original: ' + modeLabel(original()) + '\nFresh actual reported: ' + modeLabel(actual.mode) +
                    ' | ' + age(reading('mdrive', 'statusMSystem')) + '\n' + actual.detail +
                    '\nAcknowledgement below invokes read-only original-state verification, not a setter.');
                enabled('EXTERNAL_CONFIRM', !!lab.trial && !busy());
            }
            if (visible.PROTOCOL) rows('PROTOCOL_STAGES', D.PROTOCOL.map((entry) => entry.title + ' | ' +
                brief(lab.protocolResults[entry.id] || 'not-run', 130)));
            if (visible.STAGE) {
                const stage = D.PROTOCOL.find((entry) => entry.id === selectedStage);
                text('STAGE_DETAIL', stage.title + '\nProcedure: ' + (typeof stage.detail === 'string' ? stage.detail : json(stage.detail)) +
                    '\nAcceptance: ' + (typeof stage.acceptance === 'string' ? stage.acceptance : json(stage.acceptance)));
                text('STAGE_RESULT', 'Operator-attributed saved outcome: ' + brief(lab.protocolResults[selectedStage] || 'not-run', 500));
                rows('STAGE_OUTCOMES', stageOutcomes.map((outcome) => 'Record stage outcome: ' + outcome));
            }
            if (visible.HISTORY) {
                text('HISTORY_STATE', 'Retained trial: ' + (lab.trial ? 'Unresolved' : 'None') + ' | last archived: ' + (lab.lastTrial ? 'Available' : 'None') +
                    '\nMarkers/outcomes include timestamped snapshots and operator attribution; they are not automatic physical proof.');
                rows('HISTORY_MARKERS', D.MARKERS.map((entry) => entry.label));
                rows('HISTORY_OUTCOMES', outcomes.map((outcome) => 'Record operator outcome: ' + outcome));
                historyRows = lab.events.slice().reverse();
                rows('HISTORY_EVENTS', historyRows.map((entry) => brief(entry, 240)));
                enabled('HISTORY_TRIAL', !!(lab.trial || lab.lastTrial));
            }
            if (visible.RAW) {
                if (rawLive) rawText = json(rawLive());
                const pageSize = 900, pages = Math.max(1, Math.ceil(rawText.length / pageSize));
                rawPage = Math.min(Math.max(0, rawPage), pages - 1);
                text('RAW_TITLE', rawTitle);
                text('RAW_POSITION', 'Page ' + (rawPage + 1) + ' / ' + pages + ' | characters ' + (rawPage * pageSize + 1) +
                    '..' + Math.min(rawText.length, (rawPage + 1) * pageSize) + ' of ' + rawText.length + (rawLive ? ' | LIVE view' : ' | fixed view'));
                const rawLines = [];
                rawText.slice(rawPage * pageSize, (rawPage + 1) * pageSize).split('\n').forEach((line) => {
                    const characters = Array.from(line);
                    if (!characters.length) rawLines.push('');
                    for (let at = 0; at < characters.length; at += 48) rawLines.push(characters.slice(at, at + 48).join(''));
                });
                rows('RAW_BODY', rawLines);
                enabled('RAW_PREV', rawPage > 0); enabled('RAW_NEXT', rawPage < pages - 1);
            }
            if (visible.HELP) {
                rows('HELP_TOPICS', help.map((entry) => entry[0]));
                text('HELP_BODY', help[selectedHelp][0] + '\n' + help[selectedHelp][1]);
            }
        }
        ['OVERVIEW', 'PROVIDERS', 'DIAGNOSTICS', 'BASELINE', 'EXPERIMENT', 'RESTORE', 'PROTOCOL', 'HISTORY', 'HELP'].forEach((name) => {
            bind('HOME_' + name, () => { if (name === 'EXPERIMENT') restorePhase = false; return show(name); });
            bind(name + '_HOME', () => show('MAIN'));
        });
        bind('HOME_DISARM', () => lab.disarm('Explicit operator disarm; not restoration'));
        bind('HOME_RETRY', async () => {
            if (lab.trial) throw new Error('Reconnect blocked: unresolved trial; inspect restoration review');
            if (lab.busy || services.diagBusy) throw new Error('Reconnect blocked: operation in progress');
            lab.disarm('Explicit provider reconnect'); services.setLmvPolling(false); await services.retry();
        });
        bind('OVERVIEW_REFRESH', () => services.refreshSafety());
        bind('OVERVIEW_CHECKS', (event) => { if (gateRows[event.row]) return openRaw('Live gate check', gateRows[event.row], null, 'OVERVIEW'); });
        bind('OVERVIEW_RAW', () => openRaw('Live gates and complete current evidence', { safety: lab.safety(modeId), snapshot: lab.capture() }, null, 'OVERVIEW'));
        bind('PROVIDERS_LIST', (event) => { if (D.SERVICES[event.row]) selectedService = D.SERVICES[event.row].key; });
        bind('PROVIDERS_FIELDS', (event) => {
            const selected = fieldRows[event.row]; if (!selected) return;
            selectedField = selected.name; selectedEvent = selected.event; return show('FIELD');
        });
        bind('PROVIDERS_SCHEMA', () => openRaw('Complete provider schema / state', { schema: service(), state: lab.services[selectedService] }, null, 'PROVIDERS'));
        bind('PROVIDERS_CATALOG', () => openRaw('Complete catalog and source identity', D.catalog, null, 'PROVIDERS'));
        bind('PROVIDERS_REFRESH', () => services.refresh());
        bind('FIELD_RAW', () => openRaw(selectedService + '.' + selectedField, reading(selectedService, selectedField), () => reading(selectedService, selectedField), 'FIELD'));
        bind('FIELD_SCHEMA', () => openRaw('Complete field datatype closure', schema(), null, 'FIELD'));
        bind('FIELD_REFRESH', () => {
            if (selectedEvent || !field() || !field().getter) throw new Error('Catalog declares no getter; wait for notification / event');
            return services.read(selectedService, selectedField);
        });
        bind('FIELD_BACK', () => show('PROVIDERS'));
        bind('DIAGNOSTICS_DB32', () => diagnose('LMV 0x19 DID DB32', () => services.probe(0x19, 0xDB32)));
        bind('DIAGNOSTICS_IDENTIFY', () => diagnose('F150 identifiers (up to four ECU reads; stops on quarantine)', () => services.identifyAll()));
        bind('DIAGNOSTICS_FAULTS', () => diagnose('Fault reads (up to four ECUs; no clearing)', () => services.readFaultsAll()));
        bind('DIAGNOSTICS_POLL', () => {
            ensureDiagnostic();
            services.setLmvPolling(true); lab.notice = 'LMV DB32 polling explicitly enabled; transport failures stop it without retry.';
        });
        bind('DIAGNOSTICS_STOP', () => { services.setLmvPolling(false); lab.notice = 'LMV polling stopped; no automatic resume.'; });
        bind('DIAGNOSTICS_CUSTOM', () => show('DID'));
        bind('DIAGNOSTICS_FRAMES', (event) => { if (frameRows[event.row]) return openRaw('Complete TASU request / frame / verdict evidence', frameRows[event.row], null, 'DIAGNOSTICS'); });
        bind('DIAGNOSTICS_RAW', () => openRaw('All retained diagnostic evidence', lab.diagnostics, null, 'DIAGNOSTICS'));
        bind('DID_TARGETS', (event) => { if (D.ECUS[event.row]) selectedEcu = D.ECUS[event.row].address; });
        bind('DID_NIBBLES', (event) => { if (event.row >= 0 && event.row < 4) nibble = event.row; });
        bind('DID_VALUES', (event) => {
            if (!digits[event.row]) return;
            const value = hex(did, 4).split(''); value[nibble] = digits[event.row]; did = parseInt(value.join(''), 16);
        });
        bind('DID_DB32', () => { did = 0xDB32; }); bind('DID_F150', () => { did = 0xF150; });
        bind('DID_SEND', () => {
            ensureDiagnostic();
            if (!Number.isInteger(did) || did < 0 || did > 65535) throw new Error('DID must be UInt16');
            return diagnose('Custom read ECU 0x' + hex(selectedEcu, 2) + ' DID 0x' + hex(did, 4), () => services.probe(selectedEcu, did), 'DID');
        });
        bind('DID_BACK', () => show('DIAGNOSTICS'));
        bind('BASELINE_CAPTURE', () => lab.captureBaseline());
        bind('BASELINE_RAW', () => openRaw('Historical baseline (not live gate input)', lab.baseline, null, 'BASELINE'));
        bind('BASELINE_SNAPSHOT', async () => {
            lastSaved = await lab.snapshot(); lab.notice = 'Snapshot saved: ' + brief(lastSaved, 500);
            return openRaw('Saved snapshot result', lastSaved, null, 'BASELINE');
        });
        bind('BASELINE_EXPORT', async () => {
            lastExport = await lab.exportEvidence(); lab.notice = 'Export saved: ' + json(lastExport);
            return openRaw('Evidence export location / result', lastExport, null, 'BASELINE');
        });
        bind('BASELINE_STATS', () => openRaw('Complete recorder retention / errors', { stats: store.stats(), errors: store.errors, blocked: store.blocked }, null, 'BASELINE'));
        bind('BASELINE_LAST', () => openRaw('Latest snapshot and export results', { snapshot: lastSaved, export: lastExport }, null, 'BASELINE'));
        bind('EXPERIMENT_BACKENDS', (event) => {
            if (!D.CANDIDATES[event.row]) return;
            lab.disarm('Backend selection changed'); backendId = D.CANDIDATES[event.row].id; restorePhase = false;
        });
        bind('EXPERIMENT_MODES', (event) => {
            if (!D.MODES[event.row]) return;
            lab.disarm('Mode selection changed'); modeId = D.MODES[event.row].id; restorePhase = false;
        });
        bind('EXPERIMENT_REQUEST', () => openRaw('Exact native request and write datatype schema',
            { request: D.nativeRequest(backendId, modeId), writeTypes: D.catalog.writeTypes, catalogSource: D.catalog.sourceSha256 }, null, 'EXPERIMENT'));
        bind('EXPERIMENT_REFRESH', () => services.refreshSafety());
        bind('EXPERIMENT_ARM', () => { restorePhase = false; return show('ARM'); });
        bind('EXPERIMENT_APPLY', () => {
            restorePhase = false; const reason = blocker(target(), true); if (reason) throw new Error(reason); return show('APPLY');
        });
        bind('ARM_CONFIRM', async () => {
            const selection = target();
            await lab.arm(selection.backendId, selection.modeId, selection.restore);
            return show(selection.restore ? 'RESTORE' : 'EXPERIMENT');
        });
        bind('ARM_DISARM', () => lab.disarm('Explicit operator disarm; not restoration'));
        bind('ARM_BACK', () => show(restorePhase ? 'RESTORE' : 'EXPERIMENT'));
        bind('APPLY_CONFIRM', async () => {
            const selection = target(), reason = blocker(selection, true);
            if (reason) throw new Error(reason);
            if (selection.restore) await lab.restore(); else await lab.apply(selection.backendId, selection.modeId);
            return show('RESTORE');
        });
        bind('APPLY_CANCEL', () => show(restorePhase ? 'RESTORE' : 'EXPERIMENT'));
        bind('RESTORE_RAW', () => openRaw('Retained / last archived trial', lab.trial || lab.lastTrial, null, 'RESTORE'));
        bind('RESTORE_REFRESH', () => services.refreshSafety());
        bind('RESTORE_ARM', () => {
            if (!lab.trial) throw new Error('No unresolved trial'); restorePhase = true; return show('ARM');
        });
        bind('RESTORE_CONFIRM', () => {
            restorePhase = true; const reason = blocker(target(), true); if (reason) throw new Error(reason); return show('APPLY');
        });
        bind('RESTORE_EXTERNAL', () => show('EXTERNAL'));
        bind('EXTERNAL_CONFIRM', async () => { await lab.resolveExternal(); return show('RESTORE'); });
        bind('EXTERNAL_BACK', () => show('RESTORE'));
        bind('PROTOCOL_STAGES', (event) => {
            if (!D.PROTOCOL[event.row]) return; selectedStage = D.PROTOCOL[event.row].id; return show('STAGE');
        });
        bind('PROTOCOL_RESULTS', () => openRaw('Complete protocol outcomes', lab.protocolResults, null, 'PROTOCOL'));
        bind('STAGE_OUTCOMES', (event) => { if (stageOutcomes[event.row]) return lab.protocol(selectedStage, stageOutcomes[event.row]); });
        bind('STAGE_RAW', () => openRaw('Complete protocol stage and retained outcome',
            { stage: D.PROTOCOL.find((entry) => entry.id === selectedStage), outcome: lab.protocolResults[selectedStage] }, null, 'STAGE'));
        bind('STAGE_BACK', () => show('PROTOCOL'));
        bind('HISTORY_MARKERS', (event) => { if (D.MARKERS[event.row]) return lab.mark(D.MARKERS[event.row].id); });
        bind('HISTORY_OUTCOMES', (event) => { if (outcomes[event.row]) return lab.annotate(outcomes[event.row]); });
        bind('HISTORY_TRIAL', () => openRaw('Retained / last archived trial', lab.trial || lab.lastTrial, null, 'HISTORY'));
        bind('HISTORY_EVENTS', (event) => { if (historyRows[event.row]) return openRaw('Complete recorded event', historyRows[event.row], null, 'HISTORY'); });
        bind('HISTORY_NOTES', () => openRaw('Complete retained operator notes', lab.notes, null, 'HISTORY'));
        bind('HISTORY_RAW', () => openRaw('Complete retained event history', lab.events, null, 'HISTORY'));
        bind('RAW_PREV', () => { rawPage = Math.max(0, rawPage - 1); });
        bind('RAW_NEXT', () => { rawPage += 1; });
        bind('RAW_BACK', () => show(rawBack)); bind('RAW_HOME', () => show('MAIN'));
        bind('HELP_TOPICS', (event) => { if (help[event.row]) selectedHelp = event.row; });
        ui.onVisible((name, on) => {
            if (closed) return;
            visible[name] = !!on;
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            if (Object.keys(visible).some((key) => visible[key])) lab.visibility(true);
            else hideTimer = setTimeout(() => {
                hideTimer = null;
                if (!closed && !Object.keys(visible).some((key) => visible[key])) lab.visibility(false);
            }, 100);
            changed();
        });
        const close = () => {
            if (closed) return;
            closed = true;
            clearTimeout(refreshTimer); clearTimeout(hideTimer); clearInterval(clock);
            try { services.close(); } finally { lab.visibility(false); lab.close(); }
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        clock = setInterval(changed, 500);
        render();
        // Discovery can outlast the host's start deadline; keep menus usable while providers settle.
        services.start().catch(fail).then(changed);
    }
});

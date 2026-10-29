'use strict';
const mgu = require('./kit/mgu');
const D = require('./domain');
const { Store } = require('./storage');
const { Lab } = require('./lab');
const { Services } = require('./services');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, store = new Store(ctx.dataDir);
        const visible = {}, cache = {}, counts = {}, enabledState = {};
        let closed = false, refreshTimer = null, hideTimer = null, clock = null, actionBusy = false;
        let selectedService = D.SERVICES[0].key, selectedField = null, selectedControl = null, draft;
        let fieldRows = [], controlRows = [], choiceRows = [], historyRows = [];
        let rawTitle = '', rawText = '', rawPage = 0, rawLive = null, annotationZone = null;
        const zones = ['Cabin overall', 'Dashboard', 'Front doors', 'Rear doors', 'Footwells', 'Contour line', 'Other / unknown zone'];
        const observedColors = ['White', 'Warm white', 'Amber / orange', 'Red', 'Pink', 'Purple', 'Blue', 'Cyan', 'Green', 'Mixed colors', 'Off / no visible light', 'Uncertain'];
        const annotations = [
            'Stock lighting menu changed manually; compare raw readings',
            'Stock brightness changed manually; compare raw readings',
            'Stock driving mode changed manually; compare raw readings',
            'Physical brightness increased', 'Physical brightness decreased',
            'No visible brightness change', 'Unexpected lighting side effect observed',
            'Original lighting appears restored physically', 'Physical result uncertain'
        ];
        const text = (id, value, row) => {
            const index = row || 0, key = id + ':' + index, label = String(value);
            if (cache[key] === label) return;
            cache[key] = label; ui.text(id, label, index);
        };
        const rows = (id, labels) => {
            if (!labels.length) labels = ['Waiting for data'];
            if (counts[id] !== labels.length) {
                counts[id] = labels.length;
                Object.keys(cache).filter((key) => key.indexOf(id + ':') === 0).forEach((key) => delete cache[key]);
                ui.rows(id, labels.length);
            }
            labels.forEach((label, index) => text(id, label, index));
        };
        function changed() {
            if (closed || refreshTimer) return;
            refreshTimer = setTimeout(() => { refreshTimer = null; render(); }, 120);
        }
        const lab = new Lab({ store, changed, preview: !!ctx.preview });
        const services = new Services(ctx, lab); lab.api = services;
        const json = (value) => value === undefined ? 'No value received' : JSON.stringify(value, null, 2);
        const compact = (value) => value === undefined ? 'No value received' : JSON.stringify(value);
        const brief = (value) => {
            const label = compact(value);
            return label.length <= 360 ? label : label.slice(0, 360) + ' [open complete evidence below]';
        };
        const age = (at) => at ? Math.max(0, Math.floor((Date.now() - at) / 1000)) + 's ago' : 'Never received';
        const provider = (key) => {
            const state = lab.services[key];
            return !state || state.available === null || state.available === undefined ? 'Unknown' : state.available ? 'Offered' : 'Unavailable';
        };
        const service = () => D.SERVICES.find((entry) => entry.key === selectedService);
        const fieldName = (entry) => typeof entry === 'string' ? entry : entry.name || entry.field;
        const reading = (key, field) => lab.readings[key + '.' + field];
        const fieldError = (key, field) => (lab.readErrors || {})[key + '.' + field] || '';
        const currentControl = () => D.control(selectedControl);
        const currentValue = (control) => {
            const value = control && lab.readings[D.readKey(control)];
            return control && value ? D.current(control, value.value) : undefined;
        };
        const busy = () => actionBusy || lab.busy;
        const errors = () => Object.keys(store.errors || {}).map((key) => key + ': ' + store.errors[key]).join(' | ');
        const fail = (error) => { lab.notice = error && error.message ? error.message : String(error); changed(); };
        const enabled = (id, on) => {
            on = !!on;
            if (enabledState[id] === on) return;
            enabledState[id] = on;
            Promise.resolve(ui.enabled(id, on)).catch(fail);
        };
        const perform = async (action) => {
            if (busy()) throw new Error('An operation is in progress; wait for its result');
            actionBusy = true; changed();
            try { return await action(); } finally { actionBusy = false; changed(); }
        };
        const bind = (id, action) => ui.onClick(id, async (event) => {
            if (closed) return;
            try { await action(event || {}); } catch (error) { fail(error); }
            changed();
        });
        const show = (name) => { render(); return ui.open(name); };
        const openRaw = (title, value, live) => {
            rawTitle = title; rawText = json(value); rawPage = 0; rawLive = live || null;
            return show('RAW');
        };
        const requireControl = () => {
            const control = currentControl();
            if (!control) throw new Error('Select an experiment control first');
            return control;
        };
        const blocked = (control, armed) => {
            if (ctx.preview) return 'preview prohibits lighting writes';
            if (busy()) return 'operation in progress';
            if (lab.trial) return 'unresolved trial; Restore before another experiment';
            if (!lab.services[control.service] || lab.services[control.service].available !== true) return 'provider is not offered';
            if (currentValue(control) === undefined) return 'original is missing, invalid, reserved or unfilled';
            if (control.requireIndividual) {
                const original = lab.readings[D.readKey(control)];
                if (!original || D.current(D.control('menu'), original.value) === undefined) return 'valid original menu required for individual-mode restoration';
            }
            if (!D.validValue(control, draft)) return 'choose a valid draft value';
            if (control.service === 'exterior') {
                const availability = reading('exterior', 'lightswitchButtonAvailability');
                if (!availability || Date.now() - availability.at > D.freshMs ||
                    !D.available(D.command(control, draft), availability.value)) return 'fresh explicit OPERABLE button availability is required';
            }
            if (errors()) return 'evidence storage error';
            if (armed) {
                const speed = reading('vehicle', 'statusCarSpeed2');
                if (!speed || Date.now() - speed.at > D.freshMs || D.speed(speed.value) !== 0) return 'fresh exact-zero speed is required';
                if (lab.armedUntil <= Date.now()) return 'disarmed; open Home and arm while stationary';
            }
            return '';
        };
        const setNumber = (delta) => {
            const control = requireControl();
            if (control.type !== 'number') throw new Error('This control uses the value picker');
            if (draft === undefined) throw new Error('Load a valid current value or choose the minimum first');
            const next = Math.max(control.min, Math.min(control.max, draft + delta));
            if (!D.validValue(control, next)) throw new Error('Value is outside the permitted raw range');
            draft = next;
        };
        const fieldDescription = () => {
            const value = reading(selectedService, selectedField), error = fieldError(selectedService, selectedField);
            if (!value) return 'No payload received; absence is not a hardware capability result.' + (error ? '\nField error: ' + error : '');
            return 'Received ' + age(value.at) + ' | source: ' + (value.source || 'Unknown') +
                ' | samples: ' + (value.samples || 0) +
                ' | ' + (Date.now() - value.at <= D.freshMs ? 'Fresh by observation window' : 'Stale') +
                (error ? '\nField error: ' + error : '');
        };
        function render() {
            if (closed) return;
            const speed = reading('vehicle', 'statusCarSpeed2'), now = Date.now();
            const zero = speed && now - speed.at <= D.freshMs && D.speed(speed.value) === 0;
            const armed = lab.armedUntil > now;
            const safety = (ctx.preview ? 'PREVIEW: writes prohibited. ' : '') +
                (zero ? 'Fresh raw standstill observed' : 'Standstill NOT established: speed missing, stale, invalid or moving') +
                ' | ' + (armed ? 'ARMED ' + Math.ceil((lab.armedUntil - now) / 1000) + 's' : 'DISARMED') +
                (busy() ? ' | BUSY' : '') + (lab.trial ? ' | UNRESOLVED TRIAL: no new experiment or reconnect' : '');
            const notice = String(lab.notice || 'Observation is read-only until explicitly armed.') + (errors() ? ' | Evidence storage: ' + errors() : '');
            text('HOME_SAFETY', safety); text('HOME_NOTICE', notice);
            text('HOME_STATE', 'Providers: ' + D.SERVICES.map((entry) => entry.key + '=' + provider(entry.key)).join(' | ') +
                '\nBaseline: ' + (lab.baseline ? 'Saved' : 'Not captured') + ' | Trial: ' + (lab.trial ? 'Retained; inspect History and Restore' : 'None'));
            text('HOME_ARM', armed ? 'Armed: expires in ' + Math.ceil((lab.armedUntil - now) / 1000) + 's' : 'Arm stationary experiment (30 seconds)');
            text('HOME_RESTORE', lab.trial ? 'Restore retained trial (requires rearm)' : 'Restore: no retained trial');
            text('HOME_RETRY', lab.trial ? 'Reconnect BLOCKED: unresolved trial' : 'Reconnect offered services');
            enabled('HOME_RETRY', !busy() && !lab.trial);
            enabled('HOME_RESTORE', !!lab.trial && !busy());
            enabled('HOME_ARM', !busy() && !ctx.preview);
            enabled('ARM_CONFIRM', !busy() && !ctx.preview && !errors());
            enabled('BASELINE_CAPTURE', !busy() && !lab.trial);
            enabled('BASELINE_SNAPSHOT', !busy());
            enabled('BASELINE_RAW', !!lab.baseline);
            enabled('BASELINE_TRIAL_RAW', !!lab.trial);
            enabled('HISTORY_TRIAL_RAW', !!(lab.trial || lab.lastTrial));
            ['HISTORY_YES', 'HISTORY_NO', 'HISTORY_UNCERTAIN'].forEach((id) => enabled(id, !busy() && !!(lab.trial || lab.lastTrial)));
            const restoreControl = lab.trial && D.control(lab.trial.controlId);
            const restoreProvider = restoreControl && lab.services[restoreControl.service];
            const restoreReason = !lab.trial ? 'no retained trial' : ctx.preview ? 'preview is read-only' :
                busy() ? 'operation in progress' : errors() ? 'evidence storage error' :
                    !restoreProvider || restoreProvider.available !== true ? 'original provider is not offered' :
                        !armed ? 're-arm while stationary' : !zero ? 'fresh standstill required' : '';
            enabled('RESTORE_CONFIRM', !restoreReason);
            enabled('OBSERVE_REFRESH', !busy());
            ['OBSERVE', 'FIELD', 'EXPERIMENT', 'EDITOR', 'NUMBER', 'BASELINE', 'HISTORY', 'ANNOTATE', 'ZONE', 'COLOR', 'RAW', 'ARM', 'APPLY', 'RESTORE'].forEach((name) => text(name + '_NOTICE', notice));
            if (visible.OBSERVE) {
                rows('OBSERVE_SERVICES', D.SERVICES.map((entry) => {
                    const state = lab.services[entry.key];
                    return entry.label + ' | ' + provider(entry.key) + (state && state.detail ? ' | ' + state.detail : '');
                }));
                const selected = service();
                fieldRows = selected.fields.map((field) => ({ field: fieldName(field), event: false }))
                    .concat((selected.events || []).map((field) => ({ field: fieldName(field), event: true })));
                text('OBSERVE_PROVIDER', selected.label + ' | ' + selected.iface + ' / instance ' + selected.instance +
                    '\n' + json(lab.services[selected.key]));
                rows('OBSERVE_FIELDS', fieldRows.map((entry) => {
                    const value = reading(selectedService, entry.field);
                    return (entry.event ? 'Event: ' : '') + entry.field + ' | ' + (value ? age(value.at) : 'No data') +
                        (fieldError(selectedService, entry.field) ? ' | Read error: ' + fieldError(selectedService, entry.field) : '');
                }));
            }
            if (visible.FIELD) {
                const value = reading(selectedService, selectedField);
                text('FIELD_TITLE', selectedService + '.' + selectedField + ' | ' + provider(selectedService));
                text('FIELD_STATE', fieldDescription());
                text('FIELD_RAW', value ? brief(value.value) : 'Waiting for data');
                text('FIELD_PROVIDER', 'Provider details: ' + json(lab.services[selectedService]));
                enabled('FIELD_REFRESH', !busy() && !!lab.services[selectedService] && lab.services[selectedService].available === true &&
                    service().fields.some((field) => fieldName(field) === selectedField));
            }
            if (visible.EXPERIMENT) {
                controlRows = D.CONTROLS.map((control) => control.id);
                text('EXPERIMENT_SAFETY', safety);
                rows('EXPERIMENT_CONTROLS', D.CONTROLS.map((control) => control.label + ' | ' + provider(control.service) +
                    ' | current: ' + compact(currentValue(control)) + (currentValue(control) === undefined ? ' | BLOCKED: no valid original' : '') +
                    (control.experimental ? ' | Experimental' : '')));
            }
            if (visible.EDITOR || visible.APPLY || visible.NUMBER) {
                const control = currentControl();
                if (control) {
                    const value = lab.readings[D.readKey(control)];
                    text('EDITOR_TITLE', control.label + ' | ' + provider(control.service) + (control.experimental ? ' | EXPERIMENTAL' : ''));
                    text('EDITOR_HELP', control.help + (control.type === 'number' ? '\nPermitted raw range ' + control.min + '..' + control.max + '; not RGB or a proven percentage.' : ''));
                    text('EDITOR_STATE', 'Current: ' + compact(currentValue(control)) + ' | ' + (value ? age(value.at) : 'No reading') +
                        '\nDraft: ' + compact(draft) + '\n' + safety);
                    text('EDITOR_PICK', control.type === 'number' ? 'Edit numeric draft (local only)' : 'Choose explicit value');
                    const reason = blocked(control, false), dispatchReason = blocked(control, true);
                    text('EDITOR_APPLY', reason ? 'Apply BLOCKED: ' + reason : 'Review explicit Apply request');
                    text('APPLY_CONFIRM', dispatchReason ? 'Send BLOCKED: ' + dispatchReason : 'Send this one armed stationary trial');
                    enabled('EDITOR_APPLY', !reason);
                    enabled('APPLY_CONFIRM', !dispatchReason);
                    enabled('EDITOR_REFRESH', !busy() && !!lab.services[control.service] && lab.services[control.service].available === true);
                    enabled('EDITOR_LOAD', currentValue(control) !== undefined);
                    text('NUMBER_STATE', control.label + '\nRaw draft: ' + compact(draft) + '\nRange: ' + control.min + '..' + control.max + '; no RGB/degree/percent assumption.');
                    text('APPLY_DETAILS', control.label + '\nTarget raw value: ' + compact(draft) + '\n' + safety +
                        (dispatchReason ? '\nBLOCKED: ' + dispatchReason : '') +
                        '\nProvider presence and catalog entries do not prove hardware support. Setter acknowledgement is not physical success.');
                }
            }
            if (visible.BASELINE) {
                text('BASELINE_STATE', lab.baseline ? 'Baseline saved. Open raw evidence below; capture is blocked while a trial remains unresolved.' : 'No baseline saved. Capture fresh offered-provider readings before experimentation.');
                text('BASELINE_TRIAL', lab.trial ? 'Retained unresolved trial. Baseline cannot be overwritten; Restore requires explicit rearm.' : 'No unresolved trial. Snapshot records evidence without writing lighting.');
            }
            if (visible.HISTORY) {
                const trial = lab.trial || lab.lastTrial;
                text('HISTORY_TRIAL', trial ? (lab.trial ? 'Unresolved trial retained:\n' : 'Last reported restore (inspect physical lamps):\n') + brief(trial) :
                    'No trial retained. Event history is evidence, not proof of physical lighting.');
                historyRows = (lab.events || []).slice(0, 40);
                rows('HISTORY_EVENTS', historyRows.map((event) => brief(event)));
                text('HISTORY_NOTES', 'Recent annotations: ' + json((lab.notes || []).slice(-12)));
            }
            if (visible.ANNOTATE) rows('ANNOTATE_LIST', annotations);
            if (visible.ZONE) rows('ZONE_LIST', zones);
            if (visible.COLOR) {
                text('COLOR_ZONE', 'Observed zone: ' + annotationZone + '. Labels describe your observation only; no mapping to raw codes is inferred.');
                rows('COLOR_LIST', observedColors);
            }
            if (visible.RAW) {
                if (rawLive) rawText = json(rawLive());
                const chunks = [];
                rawText.split('\n').forEach((line) => {
                    if (!line.length) chunks.push(' ');
                    else for (let index = 0; index < line.length; index += 180) chunks.push(line.slice(index, index + 180));
                });
                const pages = Math.max(1, Math.ceil(chunks.length / 12));
                rawPage = Math.max(0, Math.min(rawPage, pages - 1));
                text('RAW_TITLE', rawTitle + ' | page ' + (rawPage + 1) + '/' + pages);
                rows('RAW_LINES', chunks.slice(rawPage * 12, (rawPage + 1) * 12));
            }
            if (visible.ARM) text('ARM_STATE', safety);
            if (visible.RESTORE) {
                text('RESTORE_STATE', safety + '\n' + (lab.trial ? brief(lab.trial) : 'No retained trial'));
                text('RESTORE_CONFIRM', restoreReason ? 'Restore blocked: ' + restoreReason : "Send retained trial's armed Restore now");
            }
        }
        bind('HOME_OBSERVE', () => show('OBSERVE'));
        bind('HOME_EXPERIMENT', () => show('EXPERIMENT'));
        bind('HOME_BASELINE', () => show('BASELINE'));
        bind('HOME_HISTORY', () => show('HISTORY'));
        bind('HOME_HELP', () => show('HELP'));
        bind('HOME_ARM', () => show('ARM'));
        bind('HOME_DISARM', () => lab.disarm('Explicit user disarm'));
        bind('HOME_RESTORE', () => show('RESTORE'));
        bind('HOME_RETRY', () => perform(async () => {
            if (lab.trial) throw new Error('Reconnect blocked while a trial is unresolved; inspect the retained trial and Restore');
            lab.disarm('Explicit service reconnect'); await services.retry();
        }));
        bind('ARM_CONFIRM', () => perform(() => lab.arm()));
        bind('ARM_DISARM', () => lab.disarm('Explicit user disarm'));
        bind('OBSERVE_SERVICES', (event) => {
            const selected = D.SERVICES[event.row];
            if (selected) selectedService = selected.key;
        });
        bind('OBSERVE_FIELDS', (event) => {
            const selected = fieldRows[event.row];
            if (!selected) return;
            selectedField = selected.field; return show('FIELD');
        });
        bind('OBSERVE_REFRESH', () => perform(() => lab.refresh()));
        bind('FIELD_REFRESH', () => perform(async () => {
            if (!selectedField) throw new Error('Select a field first');
            await services.read(selectedService, selectedField);
        }));
        bind('FIELD_EVIDENCE', () => openRaw(selectedService + '.' + selectedField,
            reading(selectedService, selectedField), () => reading(selectedService, selectedField)));
        bind('FIELD_BACK', () => show('OBSERVE'));
        bind('EXPERIMENT_CONTROLS', (event) => {
            const id = controlRows[event.row]; if (!id) return;
            selectedControl = id; draft = currentValue(currentControl()); return show('EDITOR');
        });
        bind('EDITOR_LOAD', () => {
            const control = requireControl(), value = currentValue(control);
            if (value === undefined || !D.validValue(control, value)) throw new Error('No valid current raw value; refresh the provider first');
            draft = value;
        });
        bind('EDITOR_REFRESH', () => perform(async () => {
            const control = requireControl(); await services.read(control.service, control.readField);
        }));
        bind('EDITOR_MIN', () => {
            const control = requireControl();
            if (control.type !== 'number') throw new Error('Use the choice picker for this control');
            draft = control.min;
        });
        bind('EDITOR_PICK', () => {
            const control = requireControl();
            if (control.type === 'number') return show('NUMBER');
            choiceRows = control.type === 'bool' ? [{ value: false, label: 'False / disabled' }, { value: true, label: 'True / enabled' }] : control.choices;
            rows('VALUE_LIST', choiceRows.map((choice) => choice.label + ' | raw: ' + compact(choice.value)));
            return show('VALUE');
        });
        bind('VALUE_LIST', (event) => {
            const choice = choiceRows[event.row];
            if (!choice) return;
            draft = choice.value; return show('EDITOR');
        });
        [-100, -10, -1, 1, 10, 100].forEach((delta) => bind('EDITOR_' + (delta < 0 ? 'MINUS' : 'PLUS') + Math.abs(delta), () => setNumber(delta)));
        bind('EDITOR_APPLY', () => {
            const control = requireControl();
            const reason = blocked(control, false);
            if (reason) throw new Error('Apply blocked: ' + reason);
            return show('APPLY');
        });
        bind('APPLY_CONFIRM', () => {
            const control = requireControl(), reason = blocked(control, true);
            if (reason) throw new Error('Apply blocked: ' + reason);
            return perform(() => lab.apply(control.id, draft));
        });
        bind('APPLY_CANCEL', () => show('EDITOR'));
        bind('EDITOR_BACK', () => show('EXPERIMENT'));
        bind('VALUE_BACK', () => show('EDITOR'));
        bind('NUMBER_BACK', () => show('EDITOR'));
        bind('BASELINE_CAPTURE', () => perform(() => lab.captureBaseline()));
        bind('BASELINE_RAW', () => openRaw('Saved baseline', lab.baseline));
        bind('BASELINE_SNAPSHOT', () => perform(async () => {
            const snapshot = await lab.snapshot();
            if (snapshot !== undefined) return openRaw('Saved evidence snapshot', snapshot);
        }));
        bind('BASELINE_TRIAL_RAW', () => openRaw('Retained trial', lab.trial));
        bind('HISTORY_TRIAL_RAW', () => openRaw(lab.trial ? 'Retained unresolved trial' : 'Last reported-restored trial', lab.trial || lab.lastTrial));
        bind('HISTORY_EVENTS', (event) => {
            if (historyRows[event.row]) return openRaw('Recorded event', historyRows[event.row]);
        });
        bind('HISTORY_YES', () => lab.confirmPhysical('yes'));
        bind('HISTORY_NO', () => lab.confirmPhysical('no'));
        bind('HISTORY_UNCERTAIN', () => lab.confirmPhysical('uncertain'));
        bind('HISTORY_ANNOTATE', () => show('ANNOTATE'));
        bind('ANNOTATE_LIST', (event) => {
            if (annotations[event.row]) lab.annotate(annotations[event.row]);
        });
        bind('ANNOTATE_ZONE', () => show('ZONE'));
        bind('ZONE_LIST', (event) => {
            if (!zones[event.row]) return;
            annotationZone = zones[event.row]; return show('COLOR');
        });
        bind('COLOR_LIST', (event) => {
            if (!annotationZone || !observedColors[event.row]) return;
            lab.annotate('Physical color observation | ' + annotationZone + ' | ' + observedColors[event.row] + ' | raw-code mapping unconfirmed');
        });
        bind('RESTORE_CONFIRM', () => perform(() => lab.restore()));
        bind('RESTORE_ARM', () => show('ARM'));
        bind('RAW_PREV', () => { rawPage = Math.max(0, rawPage - 1); });
        bind('RAW_NEXT', () => { rawPage += 1; });
        ['OBSERVE', 'EXPERIMENT', 'BASELINE', 'HISTORY', 'HELP', 'RAW', 'ARM', 'RESTORE'].forEach((name) => bind(name + '_HOME', () => show('MAIN')));
        bind('ANNOTATE_BACK', () => show('HISTORY'));
        bind('ZONE_BACK', () => show('ANNOTATE'));
        bind('COLOR_BACK', () => show('ZONE'));
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
            try { lab.visibility(false); lab.close(); } finally { services.close(); }
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        clock = setInterval(changed, 500);
        render();
        try { await services.start(); } catch (error) { fail(error); }
    },
});

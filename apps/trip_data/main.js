'use strict';
const mgu = require('./kit/mgu');
const { Storage } = require('./storage');
const { Sources, mono } = require('./sources');
const { Recorder } = require('./recorder');
const V = require('./view');
const Dashboard = require('./dashboard');
const Demo = require('./demo');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, storage = new Storage(ctx.dataDir);
        let dirty = true, loop = null, closed = false, lastDraw = 0, busy = false, pendingSession = null;
        const changed = (event) => {
            if (event && /^automatic-/.test(event.type)) pendingSession = event;
            dirty = true; if (loop) loop.kick();
        };
        const sources = new Sources(ctx, changed), recorder = new Recorder(storage, sources, changed);
        Object.assign(ctx.settings.values, recorder.settings);
        let demo = ctx.settings.get('demo') === 'on' ? new Demo(recorder.settings) : null;
        const state = {
            page: ctx.settings.get('section') || 'trip', saved: null, focus: 0, focusMemory: {}, modal: null, draft: null,
            history: [], records: [], followAutomatic: true, tablePages: { fuel: 0 }, tableCoverage: { fuel: false, gears: false }, projection: null, projectionId: null,
            graphLoading: false, loadingId: null, graphRequest: 0, notice: '', noticeUntil: 0, usageBytes: null,
            graph: { metric: 'speed', axis: 'time', zoomSeconds: 0, cursorAt: null },
        };
        const pages = ['trip', 'elevation', 'fuel', 'gears', 'history'];
        const selectedTrip = () => state.saved || (demo ? demo.trip : recorder.active);
        const focusKey = () => ['history', 'records', 'menu', 'edit', 'actions'].includes(state.page) ? state.page :
            state.page + ':' + (state.saved ? state.saved.id : 'current');
        const tell = (message) => { state.notice = message; state.noticeUntil = Date.now() + 7000; changed(); };
        const action = (id, label, run, enabled, description) => ({ id, label, run, enabled: enabled !== false, description: description || '' });
        let grabbed = false, rawPosition = null, rawPressed = false, rawDeflection = 0, relayAt = -Infinity, lastSelect = -Infinity;
        const shown = () => ui.isVisible('MAIN') && (!ui.hasFocus || ui.hasFocus('MAIN'));
        function syncController() {
            const next = shown() && !!(ctx.display && ctx.display.active && ctx.display.active('MAIN'));
            if (next !== grabbed) {
                grabbed = next; rawPosition = null; rawPressed = false; rawDeflection = 0;
                if (ctx.controller) ctx.controller.grab(next);
            }
        }
        function route(page) {
            state.focusMemory[focusKey()] = state.focus;
            state.page = page;
            state.focus = state.focusMemory[focusKey()] || 0;
            changed();
        }
        async function refreshHistory() {
            if (demo) { state.history = [demo.saved]; state.records = V.records(state.history); changed(); return; }
            const loaded = storage.history().filter((s) => !recorder.active || recorder.active.id !== s.id);
            const ids = state.history.map((s) => s.id);
            state.history = ids.map((id) => loaded.find((s) => s.id === id)).filter(Boolean).concat(loaded.filter((s) => !ids.includes(s.id)));
            state.records = V.records(state.history);
            recorder.history = storage.history();
            recorder.interrupted = recorder.history.filter((s) => s.status !== 'finished' && (!recorder.active || s.id !== recorder.active.id));
            state.usageBytes = storage.usage();
            changed();
        }
        function resetProjection() {
            ++state.graphRequest; state.projection = null; state.projectionId = null; state.graphLoading = false; state.loadingId = null;
            state.graph.cursorAt = null; state.tablePages = { fuel: 0 }; state.tableCoverage = { fuel: false, gears: false };
        }
        async function loadProjection() {
            const trip = selectedTrip();
            if (trip && trip.demo) {
                state.projection = trip.id === demo.trip.id ? demo.projection : demo.savedProjection;
                state.projectionId = trip.id; state.graphLoading = false; changed(); return;
            }
            if (!trip || state.projectionId === trip.id && state.projection || state.graphLoading && state.loadingId === trip.id) return;
            const request = ++state.graphRequest, id = trip.id;
            state.graphLoading = true; state.loadingId = id; state.projection = null; changed();
            try {
                const pending = recorder.active && recorder.active.id === id ? recorder.buffer.slice() : [];
                const projection = await V.load(storage, id, pending);
                if (closed || request !== state.graphRequest || !selectedTrip() || selectedTrip().id !== id) return;
                state.projection = projection; state.projectionId = id;
            } finally {
                if (request === state.graphRequest) { state.graphLoading = false; state.loadingId = null; changed(); }
            }
        }
        async function openPage(page) {
            route(page);
            if (page === 'history' || page === 'records') await refreshHistory();
            if (['trip', 'elevation', 'fuel'].includes(page)) await loadProjection();
        }
        async function showCurrent() {
            if (state.saved) resetProjection();
            state.saved = null; state.followAutomatic = true; route('trip'); await loadProjection();
        }
        async function showSaved(trip) {
            if (!state.saved || state.saved.id !== trip.id) resetProjection();
            state.saved = trip; state.followAutomatic = false; route('trip'); await loadProjection();
        }
        async function settings() {
            if (busy) return;
            if (state.modal || state.page === 'edit') { tell('Close this dialog before opening Settings.'); return; }
            state.usageBytes = storage.usage();
            if (ctx.controller) ctx.controller.grab(false); grabbed = false;
            refreshSettings(); await ui.open('SETTINGS');
        }
        async function exclusive(fn) {
            if (busy) { tell('An operation is already in progress.'); return; }
            busy = true; changed();
            try { await fn(); } finally { busy = false; changed(); }
        }
        async function start() {
            recorder.start(); state.saved = null; state.followAutomatic = true;
            resetProjection(); route('trip'); await loadProjection(); tell('Recording started');
        }
        async function finish() {
            const trip = recorder.finish('manual');
            resetProjection(); await refreshHistory();
            state.focusMemory.history = Math.max(0, state.history.findIndex((s) => s.id === trip.id));
            await showSaved(trip); tell('Trip saved');
        }
        async function recover() {
            const id = state.saved && state.saved.id; if (!id) return;
            await recorder.recover(id); state.saved = null; state.followAutomatic = true;
            resetProjection(); route('trip'); await loadProjection();
            tell('Trip recovered. The missing interval remains a gap.');
        }
        async function closeInterrupted() {
            if (!state.saved) return;
            const trip = await recorder.closeInterrupted(state.saved.id);
            resetProjection(); await refreshHistory(); await showSaved(trip);
            tell('Closed at the last saved sample.');
        }
        function confirmDelete() {
            const target = state.saved;
            if (!target || target.status !== 'finished') return;
            state.notice = ''; state.noticeUntil = 0;
            state.modal = { title: 'Delete saved trip?', message: target.name,
                detail: 'Its recording and annotation will be permanently deleted.', focus: 0,
                actions: [action('cancel', 'Cancel', () => { state.modal = null; changed(); }),
                    action('delete', 'Delete trip', () => exclusive(async () => {
                        if (recorder.active && recorder.active.id === target.id) throw new Error('Cannot delete the active trip');
                        storage.delete(target.id); state.modal = null; state.saved = null; resetProjection();
                        await refreshHistory(); route('history'); tell('Saved trip deleted');
                    }))] };
            changed();
        }
        function edit() {
            const trip = state.saved;
            if (!trip || trip.status !== 'finished') return;
            state.draft = { name: trip.name, annotation: trip.annotation || '', field: 'name', caret: trip.name.length, lower: false };
            route('edit'); state.focus = 0;
        }
        function keyboard() {
            const d = state.draft; if (!d) return [];
            const insert = (character) => {
                const limit = d.field === 'name' ? 48 : 160, value = d[d.field];
                if (value.length >= limit) { tell('Character limit reached.'); return; }
                d[d.field] = value.slice(0, d.caret) + character + value.slice(d.caret); d.caret += character.length; changed();
            };
            const letters = (d.lower ? 'abcdefghijklmnopqrstuvwxyz' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') + '0123456789';
            const keys = letters.split('').map((character) => action('key_' + character, character, () => insert(character)));
            [' ', '-', '.', ',', '/', ':', '_'].forEach((character) => keys.push(action('key_' + character, character === ' ' ? 'Space' : character, () => insert(character))));
            keys.push(action('left', '<', () => { d.caret = Math.max(0, d.caret - 1); changed(); }));
            keys.push(action('right', '>', () => { d.caret = Math.min(d[d.field].length, d.caret + 1); changed(); }));
            keys.push(action('erase', 'Erase', () => {
                if (d.caret > 0) { const value = d[d.field]; d[d.field] = value.slice(0, d.caret - 1) + value.slice(d.caret); d.caret--; changed(); }
            }));
            keys.push(action('case', 'Case', () => { d.lower = !d.lower; changed(); }));
            keys.push(action('field', 'Name / Note', () => { d.field = d.field === 'name' ? 'annotation' : 'name'; d.caret = d[d.field].length; changed(); }));
            keys.push(action('save', 'Save', () => exclusive(async () => {
                state.saved = storage.edit(state.saved.id, d.name.trim(), d.annotation.trim());
                state.history = state.history.map((s) => s.id === state.saved.id ? state.saved : s);
                state.draft = null; route('trip'); tell('Trip details saved');
            })));
            keys.push(action('cancel', 'Cancel', () => { state.draft = null; route('trip'); }));
            return keys;
        }
        function tablePage(delta) {
            const trip = selectedTrip(), bands = trip ? trip.policy.speedBands : recorder.settings.speedBands;
            const count = Math.ceil((bands.length + 2) / 8);
            state.tablePages.fuel = ((state.tablePages.fuel || 0) + delta + count) % count;
            changed();
        }
        function pageActions() {
            const saved = state.saved, active = recorder.active;
            if (state.page === 'trip') {
                if (demo) return [
                    action('current', 'Current trip', showCurrent),
                    action('history', 'Trip history', () => openPage('history')),
                ];
                if (!saved) return [
                    action('record', active ? 'Finish trip' : 'Start trip', () => exclusive(active ? finish : start), !!active || !recorder.interrupted.length),
                    action('menu', 'Page menu', () => route('menu')),
                    action('history', 'Trip history', () => openPage('history')),
                ];
                return [
                    action('actions', 'Trip actions', () => route('actions')), action('history', 'Trip history', () => openPage('history')),
                ];
            }
            if (state.page === 'history') return state.history.map((s) => action(s.id, s.name, () => showSaved(s))).concat([
                action('records', 'History records', () => openPage('records')),
                action('refresh', 'Refresh history', refreshHistory), action('current', 'Current trip', showCurrent), action('menu', 'Page menu', () => route('menu')),
            ]);
            if (state.page === 'records') return state.records.map((record) => action(record.id, record.label,
                () => showSaved(record.trip), !!record.trip, record.detail)).concat([
                action('history', 'Trip history', () => openPage('history')), action('current', 'Current trip', showCurrent),
            ]);
            if (state.page === 'menu') return [
                action('current', 'Current trip', showCurrent, true, active ? 'Recording / ' + V.duration(active.stats.durationMs) : 'Start and review your current drive'),
                action('history', 'Trip history', () => openPage('history'), true, recorder.interrupted.length ? 'Interrupted trips await recovery' : 'Saved trips, notes and recovery'),
                action('records', 'History records', () => openPage('records'), true, 'Observed speed, elevation, distance and economy records'),
                action('settings', 'Settings', settings, true, 'Recording detail, units and presentation'),
            ];
            if (state.page === 'actions') return [
                action('edit', 'Rename / annotate', edit, !!saved && saved.status === 'finished', 'Edit the saved trip with the graphical keyboard'),
                action('delete', 'Delete saved trip', confirmDelete, !!saved && saved.status === 'finished', 'Review and confirm before deleting'),
                action('recover', 'Recover recording', () => exclusive(recover), !!saved && saved.status !== 'finished' &&
                    saved.policy.calculationVersion === 2 && !active, 'Continue GPS recording with an explicit missing interval; legacy speed trips can only be closed'),
                action('close', 'Close interrupted trip', () => exclusive(closeInterrupted), !!saved && saved.status !== 'finished' && !active, 'Keep only the samples already recorded'),
            ];
            if (state.page === 'elevation') return [];
            const columns = () => action('columns', state.tableCoverage[state.page] ? 'Columns: Coverage' : 'Columns: Totals', () => {
                state.tableCoverage[state.page] = !state.tableCoverage[state.page]; changed();
            });
            if (state.page === 'fuel') return [
                action('previousRows', 'Slower bands', () => tablePage(-1)),
                action('nextRows', 'Faster bands', () => tablePage(1)),
                columns(),
            ];
            if (state.page === 'gears') return [columns()];
            if (state.page === 'edit') return keyboard();
            return [];
        }
        function availableActions() {
            const actions = pageActions();
            if (['menu', 'actions', 'edit'].includes(state.page)) return actions;
            return actions.concat([
                action('previous', 'Previous page', () => changePage(-1)),
                action('next', 'Next page', () => changePage(1)),
                action('settings', 'Settings', settings),
            ]);
        }
        function move(steps) {
            if (busy) return;
            if (state.modal) { state.modal.focus = (state.modal.focus + steps % 2 + 2) % 2; changed(); return; }
            const count = availableActions().length;
            if (count) state.focus = (state.focus + steps % count + count) % count;
            changed();
        }
        async function select() {
            if (busy || Date.now() - lastSelect < 160) return;
            lastSelect = Date.now();
            const list = state.modal ? state.modal.actions : availableActions(), index = state.modal ? state.modal.focus : state.focus;
            const chosen = list[index]; if (!chosen) return;
            if (!chosen.enabled) {
                tell(state.page === 'records' ? chosen.description || 'No eligible recorded trip for this record.' :
                    recorder.interrupted.length && !recorder.active ? 'Recover or close interrupted trips in History first.' :
                        'This action is unavailable for the selected trip.');
                return;
            }
            await chosen.run(); changed();
        }
        function back() {
            if (busy) return;
            if (state.modal) { state.modal = null; changed(); return; }
            if (state.page === 'edit') { state.draft = null; route('trip'); return; }
            if (state.page === 'records') { route('history'); return; }
            if (['elevation', 'fuel', 'gears', 'actions'].includes(state.page)) { route('trip'); return; }
            if (state.page === 'trip' && state.saved) { route('history'); return; }
            if (state.page === 'menu') return showCurrent();
            route('menu');
        }
        async function changePage(steps) {
            if (busy) return;
            if (state.modal || state.page === 'edit') { back(); return; }
            const index = pages.indexOf(state.page === 'records' ? 'history' : state.page);
            await openPage(pages[(index + steps + pages.length) % pages.length]);
        }
        const bind = (name, fn) => ui.onClick(name, async () => {
            try { await fn(); } catch (e) { tell(e.message); ctx.log.warn(e); }
            if (ui.isVisible('SETTINGS')) refreshSettings();
            changed();
        });
        const labels = {};
        function nativeText(name, value) { if (labels[name] !== value) { labels[name] = value; ui.text(name, value); } }
        function refreshSettings() {
            const p = recorder.settings;
            const gps = sources.sample(mono()).gps;
            const age = (ms) => Number.isFinite(ms) ? V.number(ms / 1000, 's') : 'unknown';
            const gpsStatus = sources.mode === 'full' ? 'GPS ' + (gps.positionState || gps.state) +
                ': fix age ' + age(gps.fixAgeMs) + ', receipt age ' + age(gps.ageMs) : 'GPS distance collects while recording';
            nativeText('PREF_DETAIL', 'Recording interval: ' + p.sampleMs + ' ms (fixed per trip)');
            nativeText('PREF_AUTO', 'Automatic engine-session recording: ' + recorder.automaticStatus());
            nativeText('PREF_ALTITUDE', 'Elevation noise deadband: ' + p.altitudeThresholdFt + ' ft');
            nativeText('PREF_SMOOTH', 'Display graph smoothing: ' + (p.smoothing ? 'on' : 'off'));
            nativeText('PREF_BANDS', 'New trips: 0-10 mph, then 10 mph bands to 200 mph; 200+ and unknown remain separate. Saved trips retain their recorded bands.');
            nativeText('PREF_STORAGE', 'Trip storage: ' + (state.usageBytes === null ? '--' : (state.usageBytes / 1048576).toFixed(3)) + ' MiB' +
                (storage.usageIncomplete ? ' (partial scan)' : '') + '. All recordings are retained; nothing is automatically deleted.');
            nativeText('PREF_DEMO', 'Demo data: ' + (demo ? 'on / memory only' : 'off'));
            nativeText('PREF_NOTICE', recorder.error || state.notice || storage.errors.join(' | ') ||
                (demo ? 'SIMULATED DATA. Demo trips are never recorded or added to real history.' :
                    gpsStatus + '. WGS84 degrees/accuracy unverified. RPM sessions are not ignition; stop/start may split trips. App must be running. Fuel/MPG unavailable.'));
        }
        const setting = (name, key, options) => bind(name, () => {
            const value = recorder.settings[key], next = options ? options[(options.indexOf(value) + 1) % options.length] : !value;
            recorder.configure(key, next);
            Object.assign(ctx.settings.values, recorder.settings);
            refreshSettings();
        });
        setting('PREF_DETAIL', 'sampleMs', [500, 1000, 2000]); setting('PREF_AUTO', 'automatic');
        setting('PREF_ALTITUDE', 'altitudeThresholdFt', [5, 10, 20]); setting('PREF_SMOOTH', 'smoothing');
        bind('PREF_RETRY', () => { recorder.retrySources(); tell('Retrying vehicle providers'); refreshSettings(); });
        bind('PREF_BACK', () => ui.open('MAIN'));
        bind('PREF_DEMO', () => {
            if (busy || recorder.active) { tell('Finish the recording before changing demo mode.'); return; }
            ctx.settings.set('demo', demo ? 'off' : 'on');
        });
        ctx.settings.onChange((key) => {
            if (key !== 'demo') return;
            const enabled = ctx.settings.get('demo') === 'on';
            if (enabled === !!demo) return;
            if (busy || recorder.active) {
                ctx.settings.set('demo', demo ? 'on' : 'off');
                tell('Finish the recording before changing demo mode.'); return;
            }
            demo = enabled ? new Demo(recorder.settings) : null;
            recorder.setAutomaticEnabled(!demo && !ctx.preview);
            state.saved = null; state.followAutomatic = true; state.modal = null; state.draft = null;
            resetProjection(); route('trip');
            Promise.resolve(refreshHistory()).then(loadProjection).catch((e) => tell(e.message));
            refreshSettings(); changed();
        });
        if (ctx.onTab) ctx.onTab((index) => {
            if (!busy && !state.modal && state.page !== 'edit' && pages[index]) {
                openPage(pages[index]).catch((e) => tell(e.message));
            }
        });
        async function raw(v) {
            if (!grabbed || !shown() || !v) return;
            if ([15, 'SIGNAL_UNGUELTIG'].includes(v.frontRotaryEncoderPushButton) && [15, 'SIGNAL_UNGUELTIG'].includes(v.frontRotaryEncoderDeflection)) return;
            const pressed = [1, 2, 'DREHGEBER_KURZ_GEDRUECKT', 'DREHGEBER_LANG_GEDRUECKT'].includes(v.frontRotaryEncoderPushButton);
            const pos = v.frontRotaryEncoderOperation, deflection = v.frontRotaryEncoderDeflection;
            if (Number.isInteger(pos) && pos >= 0 && pos < 65535) {
                if (rawPosition !== null) {
                    const delta = ((pos - rawPosition + 32768) & 0xffff) - 32768;
                    if (delta && Math.abs(delta) <= 64) move(Math.max(-16, Math.min(16, delta)));
                }
                rawPosition = pos;
            }
            const directions = { 1: 'up', 4: 'right', 7: 'down', 10: 'left',
                NORD_KURZ_GEDRUECKT: 'up', OST_KURZ_GEDRUECKT: 'right', SUED_KURZ_GEDRUECKT: 'down', WEST_KURZ_GEDRUECKT: 'left' };
            const direction = directions[deflection], previousDirection = rawDeflection;
            rawDeflection = direction || 0;
            const previousPressed = rawPressed; rawPressed = pressed;
            if (direction && direction !== previousDirection) {
                if (direction === 'left') await back();
                else if (direction === 'right') await changePage(1);
                else move(direction === 'up' ? -1 : 1);
            }
            if (pressed && !previousPressed) await select();
        }
        const safelyRaw = (v) => { Promise.resolve(raw(v)).catch((e) => { tell(e.message); ctx.log.warn(e); }); };
        if (ctx.controller && ctx.controller.onInput) ctx.controller.onInput((v) => { relayAt = Date.now(); safelyRaw(v); });
        let controllerWatch = null;
        const openingController = ctx.signals.watch('de.bmw.infotainment.controlelements.FrontCCU', '1', {
            statusRotaryEncoderState: (v) => { if (Date.now() - relayAt > 1000) safelyRaw(v); },
        }, ctx.log);
        Promise.resolve(openingController).then((watch) => {
            controllerWatch = watch;
            if (closed && watch && watch.shutdown) watch.shutdown();
        }).catch((e) => ctx.log.warn('Controller: ' + e.message));
        ui.onVisible((name, visible) => {
            if (name === 'SETTINGS' && visible) refreshSettings();
            syncController(); changed();
        });
        if (ui.onFocus) ui.onFocus(() => { syncController(); changed(); });
        const close = () => {
            if (closed) return;
            closed = true; ++state.graphRequest;
            if (ctx.controller) ctx.controller.grab(false);
            if (loop) loop.stop();
            recorder.close();
            if (controllerWatch && controllerWatch.shutdown) Promise.resolve(controllerWatch.shutdown()).catch((e) => ctx.log.warn(e));
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        recorder.setAutomaticEnabled(!demo && !ctx.preview);
        await refreshHistory();
        await loadProjection();
        loop = ctx.loop('MAIN', 30, async () => {
            if (closed) return;
            syncController();
            if (pendingSession && !busy && !state.modal && state.page !== 'edit') {
                const event = pendingSession; pendingSession = null;
                await refreshHistory();
                if (state.followAutomatic) {
                    state.saved = event.type === 'automatic-stop' ? event.trip : null;
                    resetProjection(); await loadProjection();
                }
                tell(event.type === 'automatic-start' ? 'Engine running / recording started' : 'Engine stopped / trip saved');
            }
            const now = Date.now();
            if (demo) {
                if (now - lastDraw < 1000 / 30) return;
                demo.advance(now);
            } else if (!dirty && now - lastDraw < 1000) return;
            dirty = false; lastDraw = now;
            const trip = selectedTrip();
            if (trip && recorder.active && trip.id === recorder.active.id && state.projectionId === trip.id && state.projection) {
                recorder.recent.forEach((row) => state.projection.add(row));
            }
            const actions = availableActions();
            state.focus = Math.max(0, Math.min(state.focus, Math.max(0, actions.length - 1)));
            const errors = storage.errors.concat(storage.historyErrors || []);
            const notice = recorder.error || (state.noticeUntil > now ? state.notice : '') || (errors.length ? errors[0] : '') ||
                (state.page === 'trip' && !state.saved && recorder.interrupted.length && !demo ? 'Interrupted trips are waiting in History.' : '') ||
                (demo ? 'SIMULATED DATA / not recorded' : '');
            const vm = Object.assign({}, state, {
                actions, trip, currentTrip: demo ? demo.trip : recorder.active, saved: !!state.saved, focus: state.focus, demo: !!demo,
                tablePage: state.tablePages[state.page] || 0, tableCoverage: !!state.tableCoverage[state.page], smoothing: recorder.settings.smoothing,
                live: demo ? demo.live : sources.sample(mono()), speedBands: recorder.settings.speedBands, notice, busy,
                projection: trip && state.projectionId === trip.id ? state.projection : null,
            });
            await ui.image('MAIN_GFX', Dashboard.draw(ctx, vm));
        });
        refreshSettings(); changed();
    },
});

'use strict';
const mgu = require('./kit/mgu');
const { Diag } = require('./kit/diag');
const { Storage, bulkDeletable } = require('./storage');
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
        const sources = new Sources(ctx, changed, Diag), recorder = new Recorder(storage, sources, changed);
        Object.assign(ctx.settings.values, recorder.settings);
        let demo = ctx.settings.get('demo') === 'on' ? new Demo(recorder.settings) : null;
        const state = {
            page: ctx.settings.get('section') || 'trip', saved: null, focus: 0, focusMemory: {}, modal: null, draft: null,
            history: [], historyPage: 0, historySelection: null, records: [], recordsPage: 0, followAutomatic: true, tablePages: { fuel: 0 }, tableCoverage: { fuel: false, gears: false }, projection: null, projectionId: null,
            graphLoading: false, loadingId: null, graphRequest: 0, notice: '', noticeUntil: 0, usageBytes: null,
            graph: { metric: 'speed', axis: 'time', zoomSeconds: 0, cursorAt: null },
        };
        const pages = ['trip', 'elevation', 'fuel', 'gears', 'history', 'records'];
        const selectedTrip = () => state.saved || (demo ? demo.trip : recorder.active);
        const focusKey = () => ['history', 'records', 'edit'].includes(state.page) ? state.page :
            state.page + ':' + (state.saved ? state.saved.id : 'current');
        const tell = (message) => { state.notice = message; state.noticeUntil = Date.now() + 7000; changed(); };
        const action = (id, label, run, enabled, description) => ({ id, label, run, enabled: enabled !== false, description: description || '' });
        function route(page, saved = state.saved) {
            state.focusMemory[focusKey()] = state.focus;
            if (page !== 'history') state.historySelection = null;
            state.page = page; state.saved = saved;
            state.focus = state.focusMemory[focusKey()] || 0;
            changed();
        }
        async function refreshHistory() {
            if (demo) { state.history = [demo.saved]; state.records = V.records(state.history); changed(); return; }
            recorder.history = storage.history();
            state.history = recorder.history.filter((s) => !recorder.active || recorder.active.id !== s.id);
            if (state.historySelection) {
                state.historySelection = new Set(state.history.filter((s) => bulkDeletable(s) && state.historySelection.has(s.id)).map((s) => s.id));
            }
            state.historyPage = Math.min(state.historyPage, Math.max(0, Math.ceil(state.history.length / 4) - 1));
            state.records = V.records(state.history);
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
            if (state.saved && [page, state.page].some((p) => p === 'history' || p === 'records')) {
                resetProjection(); state.followAutomatic = true; route(page, null);
            } else route(page);
            if (page === 'history' || page === 'records') await refreshHistory();
            if (['trip', 'elevation', 'fuel', 'gears'].includes(page)) await loadProjection();
        }
        async function showCurrent() {
            if (state.saved) resetProjection();
            state.followAutomatic = true; route('trip', null); await loadProjection();
        }
        async function showSaved(trip) {
            if (!state.saved || state.saved.id !== trip.id) resetProjection();
            state.followAutomatic = false; route('trip', trip); await loadProjection();
        }
        async function settings() {
            if (busy) return;
            if (state.modal || state.page === 'edit') { tell('Close this dialog before opening Settings.'); return; }
            state.usageBytes = storage.usage();
            refreshSettings(); await ui.open('SETTINGS');
        }
        async function exclusive(fn) {
            if (busy) { tell('An operation is already in progress.'); return; }
            busy = true; changed();
            try { await fn(); } finally { busy = false; changed(); }
        }
        async function start() {
            recorder.start(); state.followAutomatic = true;
            resetProjection(); route('trip', null); await loadProjection(); tell('Recording started');
        }
        async function finish() {
            const trip = recorder.finish('manual');
            resetProjection(); await refreshHistory();
            state.focusMemory.history = Math.max(0, state.history.findIndex((s) => s.id === trip.id));
            await showSaved(trip); tell('Trip saved');
        }
        async function recover() {
            const id = state.saved && state.saved.id; if (!id) return;
            await recorder.recover(id); state.followAutomatic = true;
            resetProjection(); route('trip', null); await loadProjection();
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
                        storage.delete(target.id); state.modal = null; resetProjection();
                        state.followAutomatic = true; route('history', null);
                        await refreshHistory(); tell('Saved trip deleted');
                    }))] };
            changed();
        }
        async function toggleFavorite() {
            const trip = state.saved;
            if (!trip || trip.demo || recorder.active && recorder.active.id === trip.id) return;
            state.saved = storage.setFavorite(trip.id, !trip.favorite);
            await refreshHistory();
            tell(state.saved.favorite ? 'Trip added to favorites' : 'Trip removed from favorites');
        }
        function confirmBulkDelete(trips, selected) {
            if (!trips.length) return;
            const ids = trips.map((trip) => trip.id);
            state.notice = ''; state.noticeUntil = 0;
            state.modal = {
                title: selected ? 'Delete selected trips?' : 'Delete all unfavorited trips?',
                message: ids.length + (ids.length === 1 ? ' trip will be permanently deleted.' : ' trips will be permanently deleted.'),
                detail: 'Favorites and in-progress recordings are protected.', focus: 0,
                actions: [action('cancel', 'Cancel', () => { state.modal = null; changed(); }),
                    action('deleteMany', 'Delete trips', () => exclusive(async () => {
                        const eligibleIds = ids.filter((id) => !recorder.active || recorder.active.id !== id);
                        const result = storage.deleteMany(eligibleIds);
                        result.failures.forEach((error) => ctx.log.warn(error));
                        state.modal = null; state.historySelection = null;
                        await refreshHistory(); state.focus = state.historyPage * 4;
                        const skipped = ids.length - result.deleted;
                        tell('Deleted ' + result.deleted + (result.deleted === 1 ? ' trip' : ' trips') +
                            (skipped ? '. ' + skipped + ' could not be deleted.' : '.'));
                    }))],
            };
            changed();
        }
        function historyActions() {
            const selection = state.historySelection;
            const rows = state.history.map((trip) => {
                if (!selection) return action(trip.id, trip.name, () => showSaved(trip));
                return action('select:' + trip.id, trip.name, () => {
                    if (selection.has(trip.id)) selection.delete(trip.id); else selection.add(trip.id);
                }, bulkDeletable(trip), 'This trip is protected from bulk deletion.');
            });
            if (demo || !state.history.length) return rows;
            const eligible = state.history.filter(bulkDeletable);
            if (selection) {
                const selected = eligible.filter((trip) => selection.has(trip.id));
                return rows.concat([
                    action('cancelSelection', 'Cancel selection', () => { state.historySelection = null; state.focus = state.historyPage * 4; }),
                    action('deleteSelected', 'Delete selected (' + selected.length + ')', () => confirmBulkDelete(selected, true), selected.length > 0, 'Select one or more trips.'),
                ]);
            }
            if (!eligible.length) return rows;
            return rows.concat([
                action('selectTrips', 'Select trips', () => { state.historySelection = new Set(); state.focus = state.historyPage * 4; }),
                action('deleteUnfavorited', 'Delete unfavorited', () => confirmBulkDelete(eligible, false)),
            ]);
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
            if (state.page === 'history') return historyActions();
            if (state.page === 'records') return state.records.map((record) => action(record.id, record.label,
                () => showSaved(record.trip), !!record.trip, record.detail));
            if (state.page === 'trip') {
                if (!saved) {
                    const recording = active && active.status === 'recording';
                    return [action(recording ? 'finish' : 'start', recording ? 'Finish trip' : 'Start trip',
                        () => exclusive(recording ? finish : start), !demo, 'Turn off Demo data in Settings to record a trip.')];
                }
                if (saved.demo) return [];
                const favorite = action('favorite', saved.favorite ? 'Remove favorite' : 'Favorite trip', () => exclusive(toggleFavorite));
                if (saved.status === 'finished') return [
                    favorite,
                    action('edit', 'Rename / annotate', edit),
                    action('delete', 'Delete saved trip', confirmDelete),
                ];
                return [
                    favorite,
                    action('recover', 'Recover recording', () => exclusive(recover), [2, 3, 4].includes(saved.policy.calculationVersion) && !active,
                        active ? 'Finish the active trip first.' : 'This recording can be closed at the last saved sample.'),
                    action('close', 'Close interrupted trip', () => exclusive(closeInterrupted), !active, 'Finish the active trip first.'),
                ];
            }
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
        async function activate(index, id, page, tripId) {
            if (busy || Date.now() - lastSelect < 160 || page !== (state.modal ? 'modal' : state.page)) return;
            const trip = selectedTrip();
            if (page === 'trip' && tripId !== (trip && trip.id)) return;
            const list = state.modal ? state.modal.actions : pageActions();
            const chosen = list[index]; if (!chosen || chosen.id !== id) return;
            lastSelect = Date.now();
            if (state.modal) state.modal.focus = index;
            else state.focus = index;
            if (!chosen.enabled) {
                tell(chosen.description || 'This action is unavailable for the selected trip.');
                return;
            }
            try { await chosen.run(); }
            catch (e) { tell(e.message); ctx.log.warn(e); }
            changed();
        }
        let lastSelect = -Infinity;
        function changeHistoryPage(delta) {
            const count = Math.max(1, Math.ceil(state.history.length / 4));
            state.historyPage = Math.max(0, Math.min(count - 1, state.historyPage + delta));
            state.focus = state.historyPage * 4; changed();
        }
        function changeRecordsPage(delta) {
            const count = Math.max(1, Math.ceil(state.records.length / 2));
            state.recordsPage = Math.max(0, Math.min(count - 1, state.recordsPage + delta));
            state.focus = state.recordsPage * 2; changed();
        }
        const bind = (name, fn) => ui.onClick(name, async () => {
            try { await fn(); } catch (e) { tell(e.message); ctx.log.warn(e); }
            if (ui.isVisible('SETTINGS')) refreshSettings();
            changed();
        });
        let fallbackRecord = null;
        // Standard and software layouts use the native button when they cannot activate canvas controls.
        if (ctx.hideButton) ctx.hideButton('BTN_RECORD');
        bind('BTN_RECORD', () => {
            if (busy || state.modal || state.page === 'edit' || ctx.display.own()) return;
            if (fallbackRecord) return activate(0, fallbackRecord.id, 'trip', fallbackRecord.tripId);
            return showCurrent();
        });
        bind('BTN_SETTINGS', settings);
        const labels = {};
        function nativeText(name, value) { if (labels[name] !== value) { labels[name] = value; ui.text(name, value); } }
        function refreshSettings() {
            const p = recorder.settings;
            const gps = sources.sample(mono()).gps;
            const age = (ms) => Number.isFinite(ms) ? V.number(ms / 1000, 's') : 'unknown';
            const gpsStatus = sources.mode === 'full' ? 'GPS ' + (gps.positionState || gps.state) +
                ': fix age ' + age(gps.fixAgeMs) + ', receipt age ' + age(gps.ageMs) : 'GPS position/elevation collects while recording';
            nativeText('PREF_AUTO', 'Automatic engine-session recording: ' + recorder.automaticStatus());
            nativeText('PREF_SMOOTH', 'Display graph smoothing: ' + (p.smoothing ? 'on' : 'off'));
            nativeText('PREF_BANDS', 'New trips: 0-10 mph, then 10 mph bands to 200 mph; 200+ and unknown remain separate. Saved trips retain their recorded bands.');
            nativeText('PREF_STORAGE', 'Trip storage: ' + (state.usageBytes === null ? '--' : (state.usageBytes / 1048576).toFixed(3)) + ' MiB' +
                (storage.usageIncomplete ? ' (partial scan)' : '') + '. All recordings are retained; nothing is automatically deleted.');
            nativeText('PREF_DEMO', 'Demo data: ' + (demo ? 'on / memory only' : 'off'));
            nativeText('PREF_NOTICE', recorder.error || state.notice || storage.errors.join(' | ') ||
                (demo ? 'SIMULATED DATA. Demo trips are never recorded or added to real history.' :
                    'New trips use vehicle-speed distance and CDS engine status. ' + gpsStatus +
                    '. GPS reference/accuracy unverified. Engine sessions are not ignition; stop/start may split trips. App must be running. Fuel uses DME diagnostics and the calibrated CDS injection counter when supported.'));
        }
        const setting = (name, key) => bind(name, () => {
            recorder.configure(key, !recorder.settings[key]);
            Object.assign(ctx.settings.values, recorder.settings);
            refreshSettings();
        });
        setting('PREF_AUTO', 'automatic'); setting('PREF_SMOOTH', 'smoothing');
        bind('PREF_RETRY', () => { recorder.retrySources(); tell('Retrying vehicle providers'); refreshSettings(); });
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
            state.followAutomatic = true; state.modal = null; state.draft = null;
            resetProjection(); route('trip', null);
            Promise.resolve(refreshHistory()).then(loadProjection).catch((e) => tell(e.message));
            refreshSettings(); changed();
        });
        if (ctx.onTab) ctx.onTab((index) => {
            const page = pages[index];
            if (busy || state.modal || state.page === 'edit' || !page) return;
            const open = page === 'trip' && state.page === 'trip' && state.saved ? showCurrent() : openPage(page);
            open.catch((e) => tell(e.message));
        });
        ui.onVisible((name, visible) => {
            if (name === 'SETTINGS' && visible) refreshSettings();
            changed();
        });
        if (ui.onFocus) ui.onFocus(changed);
        if (ctx.onLayout) ctx.onLayout(changed);
        const close = () => {
            if (closed) return;
            closed = true; ++state.graphRequest;
            if (loop) loop.stop();
            recorder.close();
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        recorder.setAutomaticEnabled(!demo && !ctx.preview);
        await refreshHistory();
        await loadProjection();
        loop = ctx.loop('MAIN', 30, async () => {
            if (closed) return;
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
            const actions = pageActions();
            state.focus = Math.max(0, Math.min(state.focus, Math.max(0, actions.length - 1)));
            const errors = storage.errors.concat(storage.historyErrors || []);
            const notice = recorder.error || (state.noticeUntil > now ? state.notice : '') || (errors.length ? errors[0] : '') ||
                (state.page === 'trip' && !state.saved && recorder.interrupted.length && !demo ? 'Interrupted trips are waiting in History.' : '') ||
                (demo ? 'SIMULATED DATA / not recorded' : '');
            const vm = Object.assign({}, state, {
                actions, trip, currentTrip: demo ? demo.trip : recorder.active, saved: !!state.saved, focus: state.focus, demo: !!demo,
                tablePage: state.tablePages[state.page] || 0, tableCoverage: !!state.tableCoverage[state.page], smoothing: recorder.settings.smoothing,
                live: demo ? demo.live : sources.sample(mono()), speedBands: recorder.settings.speedBands, notice, busy,
                activate, historyPageSize: 4, changeHistoryPage, changeRecordsPage,
                projection: trip && state.projectionId === trip.id ? state.projection : null,
            });
            const frame = Dashboard.draw(ctx, vm);
            const record = !frame.own && state.page === 'trip' && !state.saved ? actions[0] : null;
            fallbackRecord = record ? { id: record.id, tripId: trip && trip.id } : null;
            if (!frame.own) nativeText('BTN_RECORD', record ? record.label : 'Trip');
            await ui.image('MAIN_GFX', frame);
        });
        refreshSettings(); changed();
    },
});

'use strict';
const mgu = require('./kit/mgu');
const { Diag } = require('./kit/diag');
const { Storage, bulkDeletable } = require('./storage');
const { Sources, mono } = require('./sources');
const { Recorder } = require('./recorder');
const V = require('./view');
const Dashboard = require('./dashboard');
const Demo = require('./demo');

const PAGES = ['trip', 'elevation', 'fuel', 'gears', 'history', 'records'];
const TABS = ['Trip', 'Elevation', 'Fuel', 'Gears', 'History', 'Records'];
const DATA_PAGES = PAGES.slice(0, 4);
const HISTORY_ROWS = 4, RECORDS_ROWS = 4, BAND_ROWS = 8, NATIVE_ROWS = 10;
const PREF_ROWS = ['PREF_AUTO', 'PREF_SMOOTH', 'PREF_SECTION', 'PREF_DEMO', 'PREF_RETRY', 'PREF_STORAGE', 'PREF_NOTICE'];
const action = (id, label, run, options) => Object.assign({ id, label, run }, options);
const pageCount = (items, size) => Math.max(1, Math.ceil(items.length / size));

function background(ctx) {
    const storage = new Storage(ctx.dataDir);
    const model = { storage, projection: null, onChange: null, closed: false };
    let graphGap = false;
    function changed(event) {
        if (model.closed) return;
        if (event && event.type === 'start') {
            graphGap = false;
            model.projection = new V.Projection();
        } else if (event && event.type === 'sample' && model.projection) {
            try {
                model.projection.add(graphGap ? Object.assign({}, event.row, { gapBefore: true }) : event.row);
                graphGap = false;
            } catch (error) {
                if (!graphGap) ctx.log.warn(error);
                graphGap = true;
            }
        } else if (event && event.type === 'finish') {
            event.projection = model.projection;
            model.projection = null;
        }
        if (model.onChange) model.onChange(event);
    }
    const sources = new Sources(ctx, changed, Diag);
    const recorder = new Recorder(storage, sources, changed, ctx.log);
    Object.assign(model, { sources, recorder });
    recorder.setVehicleEnabled(!ctx.preview && ctx.settings.get('demo') !== 'on');

    function close() {
        if (model.closed) return;
        model.closed = true;
        try { recorder.close(); } catch (error) { ctx.log.warn(error); }
        if (model.onChange) model.onChange({ type: 'closed' });
    }
    if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
    process.once('exit', close);
    if (!ctx.preview) {
        const terminate = () => { close(); process.exit(0); };
        process.once('SIGTERM', terminate);
        process.once('SIGINT', terminate);
    }
    return model;
}

mgu.run({
    background,
    start(ctx) {
        const { ui, log } = ctx;
        const model = ctx.background || background(ctx);
        const { storage, sources, recorder } = model;
        const initial = ctx.settings.get('section');
        const state = {
            page: PAGES.includes(initial) ? initial : 'trip', saved: null, backPage: null, detail: null,
            history: [], records: [], historyPage: 0, recordsPage: 0, selection: null,
            fuelPage: 0, coverage: { fuel: false, gears: false }, modal: null, draft: null,
            notice: '', noticeUntil: 0, revision: 0,
        };
        let loop, demo = null, dirty = true, historyDirty = true;
        let lastDraw = -Infinity, lastRecord = -Infinity, fallbackRecord = null, liveError = '';
        let nativeOpen = false, nativePage = false, nativeItems = [], nativeRender = 0;
        let storageUsage = 'Unavailable';

        function tell(message) {
            state.notice = message;
            state.noticeUntil = mono() + 5500;
            dirty = true;
        }
        function report(error) {
            log.warn(error);
            tell(error.message || String(error));
        }
        function invalidate() {
            state.revision++;
            dirty = true;
        }
        function route(page, saved = state.saved) {
            if ((saved && saved.id) !== (state.saved && state.saved.id)) {
                state.detail = null;
                state.fuelPage = 0;
                state.coverage = { fuel: false, gears: false };
            }
            if (page !== 'history') state.selection = null;
            state.page = page;
            state.saved = saved;
            if (!saved) state.backPage = null;
            invalidate();
        }
        function markHistoryDirty() {
            historyDirty = true;
            dirty = true;
            if (nativeOpen && nativePage) {
                setImmediate(() => {
                    if (nativeOpen && !model.closed && !state.modal) renderNativeMenu().catch(report);
                });
            }
        }
        function refreshHistory() {
            if (!historyDirty) return;
            historyDirty = false;
            state.history = demo ? [demo.saved] : recorder.history();
            state.records = V.records(state.history.filter((trip) => !recorder.pending.has(trip.id)));
            state.historyPage = Math.min(state.historyPage, pageCount(state.history, HISTORY_ROWS) - 1);
            state.recordsPage = Math.min(state.recordsPage, pageCount(state.records, RECORDS_ROWS) - 1);
            if (state.selection) {
                state.selection = new Set(state.history.filter((trip) => bulkDeletable(trip) && state.selection.has(trip.id)).map((trip) => trip.id));
            }
            invalidate();
        }
        function openPage(page) {
            const list = page === 'history' || page === 'records';
            const current = page === 'trip' && state.page === 'trip';
            route(page, list || current ? null : state.saved);
            if (list) {
                historyDirty = true;
                refreshHistory();
            }
        }
        function openSaved(trip, backPage, projection, page = 'trip') {
            route(page, trip);
            state.backPage = backPage;
            if (trip.demo || projection) {
                state.detail = { projection: trip.demo ? demo.savedProjection : projection };
                return;
            }
            if (state.detail) return;
            const detail = { loading: true };
            state.detail = detail;
            const cancelled = () => model.closed || state.detail !== detail;
            V.load(storage, trip, recorder.pendingSamples(trip.id), cancelled).then((result) => {
                if (!cancelled()) Object.assign(detail, result);
            }).catch((error) => {
                if (!cancelled()) {
                    log.warn(error);
                    detail.error = true;
                }
            }).then(() => {
                if (!cancelled()) {
                    detail.loading = false;
                    dirty = true;
                }
            });
        }

        model.onChange = (event) => {
            dirty = true;
            if (!event) return;
            if (event.type === 'closed') {
                if (loop) loop.stop();
            } else if (event.type === 'start') {
                if (DATA_PAGES.includes(state.page) && !state.backPage && !state.modal) route(state.page, null);
                state.noticeUntil = 0;
            } else if (event.type === 'finish') {
                markHistoryDirty();
                if (DATA_PAGES.includes(state.page) && !state.saved && !state.modal)
                    openSaved(event.trip, null, event.projection, state.page);
                tell(recorder.pending.has(event.trip.id) ? 'Trip ended. Save pending.' : 'Trip saved');
            } else if (event.type === 'stored') {
                markHistoryDirty();
            }
        };

        function recordAction() {
            const activeId = recorder.active && recorder.active.id;
            const label = activeId ? 'End trip' : demo ? 'Start real trip' : 'Start trip';
            return action('record-trip', label, () => {
                const now = mono();
                if (activeId !== (recorder.active && recorder.active.id) || now - lastRecord < 350) return;
                lastRecord = now;
                if (activeId) recorder.finish();
                else {
                    if (demo) chooseDemo(false);
                    recorder.start();
                    route('trip', null);
                }
            }, { tone: activeId ? 'end' : 'start', width: 230 });
        }
        async function activate(item, revision = state.revision) {
            if (model.closed || !item || item.disabled || revision !== state.revision) return;
            try { await item.run(); } catch (error) { report(error); }
            dirty = true;
        }
        function closeModal() {
            if (!state.modal) return;
            state.modal = null;
            invalidate();
        }
        function confirmDelete(trips, bulk, title) {
            if (!trips.length) return;
            const ids = trips.map((trip) => trip.id);
            state.modal = {
                title,
                message: bulk ? ids.length + (ids.length === 1 ? ' trip will be deleted.' : ' trips will be deleted.') : V.tripTitle(trips[0]),
                detail: bulk ? 'Favorited trips are kept.' : 'The trip and its saved samples will be deleted.',
                actions: [
                    action('cancel-delete', 'Cancel', closeModal),
                    action('confirm-delete', 'Delete', () => {
                        const result = recorder.deleteTrips(ids, bulk);
                        result.failures.forEach((error) => log.warn(error));
                        if (!result.deleted) {
                            tell(result.failures[0] ? result.failures[0].message : 'Could not delete the trip');
                            return;
                        }
                        closeModal();
                        state.selection = null;
                        if (!bulk) route('history', null);
                        markHistoryDirty();
                        refreshHistory();
                        tell('Deleted ' + result.deleted + (result.deleted === 1 ? ' trip' : ' trips') +
                            (result.failures.length ? '. ' + result.failures.length + ' could not be deleted.' : '.'));
                    }, { tone: 'end' }),
                ],
            };
            state.noticeUntil = 0;
            invalidate();
        }
        function edit() {
            const trip = state.saved;
            state.draft = { id: trip.id, name: trip.name, annotation: trip.annotation || '', field: 'name', caret: trip.name.length, lower: false };
            route('edit');
        }
        function finishEdit() {
            state.draft = null;
            route('trip');
        }
        function editor() {
            const d = state.draft, limit = d.field === 'name' ? 48 : 160;
            const insert = (character) => {
                const value = d[d.field];
                if (value.length >= limit) { tell('Character limit reached'); return; }
                d[d.field] = value.slice(0, d.caret) + character + value.slice(d.caret);
                d.caret++;
            };
            const keys = (d.lower ? 'abcdefghijklmnopqrstuvwxyz' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') + '0123456789 -,./:_';
            return {
                title: d.field === 'name' ? 'Trip name' : 'Trip note',
                tools: [
                    action('field', d.field === 'name' ? 'Edit note' : 'Edit name', () => {
                        d.field = d.field === 'name' ? 'annotation' : 'name';
                        d.caret = d[d.field].length;
                        invalidate();
                    }, { width: 142 }),
                    action('case', d.lower ? 'ABC' : 'abc', () => { d.lower = !d.lower; invalidate(); }, { width: 94 }),
                    action('caret-left', '<', () => { d.caret = Math.max(0, d.caret - 1); }, { width: 66 }),
                    action('caret-right', '>', () => { d.caret = Math.min(d[d.field].length, d.caret + 1); }, { width: 66 }),
                    action('erase', 'Erase', () => {
                        if (d.caret > 0) {
                            d[d.field] = d[d.field].slice(0, d.caret - 1) + d[d.field].slice(d.caret);
                            d.caret--;
                        }
                    }, { width: 109 }),
                    action('clear', 'Clear', () => { d[d.field] = ''; d.caret = 0; }, { width: 109 }),
                    action('cancel-edit', 'Cancel', finishEdit, { width: 112 }),
                    action('save-edit', 'Save', () => {
                        state.saved = recorder.edit(d.id, d.name, d.annotation);
                        finishEdit();
                        markHistoryDirty();
                        tell('Trip details saved');
                    }, { width: 110, tone: 'start' }),
                ],
                keys: keys.split('').map((character) => action('key:' + character, character === ' ' ? 'Space' : character, () => insert(character))),
            };
        }
        function pageTools(current, total, set) {
            if (total <= 1) return [];
            return [
                action('prev', 'Prev', () => { set(current - 1); invalidate(); }, { disabled: current === 0, width: 92 }),
                action('next', 'Next', () => { set(current + 1); invalidate(); }, { disabled: current + 1 === total, width: 92 }),
            ];
        }
        function historyView() {
            const count = state.history.length, page = state.historyPage, total = pageCount(state.history, HISTORY_ROWS);
            const selection = state.selection;
            const tools = pageTools(page, total, (value) => { state.historyPage = value; });
            const eligible = demo ? [] : state.history.filter(bulkDeletable);
            if (selection) {
                const selected = eligible.filter((trip) => selection.has(trip.id));
                tools.push(action('cancel-select', 'Cancel', () => { state.selection = null; invalidate(); }, { width: 115 }));
                tools.push(action('delete-selected', 'Delete (' + selected.length + ')',
                    () => confirmDelete(selected, true, 'Delete selected trips?'), { width: 146, disabled: !selected.length }));
            } else if (eligible.length) {
                tools.push(action('select', 'Select', () => { state.selection = new Set(); invalidate(); }, { width: 108 }));
                tools.push(action('delete-unfavorited', 'Delete unfavorited',
                    () => confirmDelete(eligible, true, 'Delete unfavorited trips?'), { width: 230 }));
            }
            const rows = state.history.slice(page * HISTORY_ROWS, (page + 1) * HISTORY_ROWS).map((trip) => ({
                trip, checked: !!selection && selection.has(trip.id), status: V.tripStatus(trip, recorder.pending.has(trip.id)),
                action: action('trip:' + trip.id, V.tripTitle(trip), () => {
                    if (!selection) openSaved(trip, 'history');
                    else {
                        if (selection.has(trip.id)) selection.delete(trip.id);
                        else selection.add(trip.id);
                        invalidate();
                    }
                }, { disabled: !!selection && !bulkDeletable(trip) }),
            }));
            return {
                title: selection ? selection.size + ' selected' : count + (count === 1 ? ' trip' : ' trips'),
                subtitle: total > 1 ? 'Page ' + (page + 1) + ' of ' + total : '',
                tools, rows, selection: !!selection,
            };
        }
        function recordsView() {
            const page = state.recordsPage, total = pageCount(state.records, RECORDS_ROWS);
            return {
                title: 'Trip records',
                subtitle: 'At least 95% coverage' + (total > 1 ? '  /  Page ' + (page + 1) + ' of ' + total : ''),
                tools: pageTools(page, total, (value) => { state.recordsPage = value; }),
                rows: state.records.slice(page * RECORDS_ROWS, (page + 1) * RECORDS_ROWS).map((record) => ({
                    record, action: action('record:' + record.id, record.label, () => openSaved(record.trip, 'records'), { disabled: !record.trip }),
                })),
            };
        }
        const selectedTrip = () => state.saved ? Object.assign({}, state.saved, state.detail && state.detail.restored) :
            demo ? demo.trip : recorder.active;
        function pageView() {
            if (state.page === 'history') return historyView();
            if (state.page === 'records') return recordsView();
            if (state.page === 'edit') return editor();
            const saved = state.saved, tools = [];
            const trip = selectedTrip();
            const title = saved ? V.tripTitle(saved) : demo ? 'Demo trip' : recorder.active ? 'Recording trip' : 'Ready to record';
            const started = trip && V.date(trip.startedAt);
            const context = state.page === 'trip' ? '' : 'M850i / US';
            let subtitle = [started, context].filter(Boolean).join('  /  ');
            if (saved) {
                subtitle = [V.tripStatus(saved, recorder.pending.has(saved.id)), title === started ? '' : started,
                    context, saved.favorite ? 'Favorite' : '', saved.annotation].filter(Boolean).join('  /  ');
                const back = state.backPage ? 'Back to ' + TABS[PAGES.indexOf(state.backPage)].toLowerCase() : 'History';
                tools.push(action('back-to-list', back, () => openPage(state.backPage || 'history'), { width: state.backPage ? 180 : 120 }));
                if (state.page === 'trip' && !saved.demo) {
                    tools.push(action('favorite', saved.favorite ? 'Unfavorite' : 'Favorite', () => {
                        state.saved = recorder.favorite(saved.id);
                        markHistoryDirty();
                        invalidate();
                    }, { width: 150 }));
                    tools.push(action('edit', 'Edit details', edit, { width: 154 }));
                    tools.push(action('delete', 'Delete', () => confirmDelete([saved], false, 'Delete this trip?'), { width: 112 }));
                }
            }
            const bands = trip && Array.isArray(trip.policy.speedBands) && trip.policy.speedBands.length ? trip.policy.speedBands : recorder.settings.speedBands;
            if (state.page === 'fuel') {
                const pages = Math.ceil((bands.length + 2) / BAND_ROWS);
                state.fuelPage = Math.min(state.fuelPage, pages - 1);
                tools.push(...pageTools(state.fuelPage, pages, (value) => { state.fuelPage = value; }));
            }
            if (state.page === 'fuel' || state.page === 'gears') {
                const page = state.page;
                tools.push(action('coverage', state.coverage[page] ? 'Show totals' : 'Show coverage', () => {
                    state.coverage[page] = !state.coverage[page];
                    invalidate();
                }, { width: 185 }));
            }
            return { title, subtitle, tools, bands };
        }

        const labels = {};
        function nativeText(name, value) {
            if (labels[name] === value) return Promise.resolve();
            labels[name] = value;
            return Promise.resolve().then(() => ui.text(name, value)).catch((error) => {
                if (labels[name] === value) delete labels[name];
                log.warn(error);
            });
        }
        function nativeView() {
            const notice = state.noticeUntil > mono() ? state.notice : '';
            if (state.modal) return { title: state.modal.title + '\n' + (notice || state.modal.message), items: state.modal.actions };
            if (!nativePage || !state.saved && !['history', 'records'].includes(state.page)) {
                const items = PAGES.map((page, i) => action('view:' + page, TABS[i], () => {
                    openPage(page);
                    if (page === 'history' || page === 'records') nativePage = true;
                    else return ui.close('SETTINGS');
                }));
                items.push(action('settings', 'Settings', () => showNative(false)));
                if (state.saved && state.page === 'trip') items.unshift(action('manage-trip', 'Saved trip options', () => { nativePage = true; }));
                if (state.page === 'fuel' || state.page === 'gears') items.unshift(...pageView().tools.filter((item) => item.id !== 'back-to-list'));
                return { title: notice || 'Choose a page', items };
            }
            if (state.page === 'history' || state.page === 'records') refreshHistory();
            const view = pageView(), items = [action('browse', 'All pages', () => { nativePage = false; })];
            if (state.saved) {
                items.push(action('show-trip', 'View trip', () => ui.close('SETTINGS')));
                items.push(...view.tools.filter((item) => item.id !== 'edit'));
            } else {
                items.push(...view.tools);
                view.rows.forEach((row) => {
                    const label = row.trip ? (row.checked ? '[Selected] ' : '') + row.action.label +
                        (row.trip.favorite ? ' [Favorite]' : '') + (row.status ? ' / ' + row.status : '') :
                        row.action.label + (row.record.trip ? ' / ' + V.number(row.record.value, row.record.unit) : ' / Unavailable');
                    items.push(Object.assign({}, row.action, { label }));
                });
            }
            return { title: [view.title, notice || view.subtitle].filter(Boolean).join(' / '), items };
        }
        async function renderNativeMenu() {
            const render = ++nativeRender, { title, items } = nativeView(), revision = state.revision;
            nativeItems = [];
            const updates = [nativeText('BROWSE_INFO', title)];
            for (let i = 0; i < NATIVE_ROWS; i++) {
                const name = 'BROWSE_' + i, item = items[i];
                updates.push(ui.visible(name, !!item));
                if (item) updates.push(nativeText(name, item.label), ui.enabled(name, !item.disabled));
            }
            await Promise.all(updates);
            if (render === nativeRender) nativeItems = items.map((item) => ({ item, revision }));
        }
        async function showNative(browse) {
            nativeOpen = browse;
            nativePage = false;
            const updates = PREF_ROWS.map((name) => ui.visible(name, !browse));
            updates.push(ui.visible('BROWSE_INFO', browse), nativeText('SETTINGS_TITLE', browse ? 'Browse Trip Data' : 'Trip Data settings'));
            if (browse) {
                updates.push(renderNativeMenu());
            } else {
                nativeItems = [];
                ++nativeRender;
                for (let i = 0; i < NATIVE_ROWS; i++) updates.push(ui.visible('BROWSE_' + i, false));
                try {
                    storageUsage = (storage.usage() / 1048576).toFixed(3) + ' MiB' + (storage.usageIncomplete ? ' (partial)' : '');
                } catch (error) {
                    log.warn(error);
                    storageUsage = 'Unavailable';
                }
                refreshSettings();
            }
            await Promise.all(updates);
        }
        function refreshSettings() {
            const notice = state.noticeUntil > mono() ? state.notice : '';
            const vehicle = sources.lifecycle(mono());
            const provider = vehicle.driveState === null && !demo ? 'Waiting for drive-readiness data. Engine status is the auto-start fallback.' :
                'Trips end when drive readiness ends.';
            const status = recorder.settingsError || recorder.notice() || notice || recorder.historyError || storage.historyErrors[0] || storage.errors[0] || provider;
            nativeText('PREF_AUTO', 'Auto-start trips  /  ' + recorder.automaticStatus());
            nativeText('PREF_SMOOTH', 'Smooth graphs  /  ' + (recorder.settings.smoothing ? 'On' : 'Off'));
            nativeText('PREF_DEMO', 'Demo data  /  ' + (demo ? 'On' : 'Off'));
            nativeText('PREF_SECTION', 'Startup page  /  ' + (TABS[PAGES.indexOf(ctx.settings.get('section'))] || 'Trip'));
            nativeText('PREF_STORAGE', 'Trip storage  /  ' + storageUsage);
            nativeText('PREF_NOTICE', status);
        }
        function configure(key, value) {
            recorder.configure(key, value);
            Object.assign(ctx.settings.values, recorder.settings);
        }
        function setDemo(on) {
            if (on === !!demo) return true;
            if (on && recorder.active) { tell('End the recording to open demo data'); return false; }
            try { demo = on ? new Demo(recorder.settings) : null; }
            catch (error) { report(error); return false; }
            recorder.setVehicleEnabled(!demo && !ctx.preview);
            state.historyPage = 0;
            state.recordsPage = 0;
            state.selection = null;
            state.modal = null;
            state.draft = null;
            markHistoryDirty();
            route('trip', null);
            return true;
        }
        function chooseDemo(on) {
            if (setDemo(on)) configure('demo', on ? 'on' : 'off');
        }

        const bind = (name, fn) => ui.onClick(name, async () => {
            try { await fn(); } catch (error) { report(error); }
        });
        if (ctx.display.hideButton) ctx.display.hideButton('BTN_RECORD');
        bind('BTN_RECORD', () => {
            if (ctx.display.own() || state.modal || state.page === 'edit') return;
            return activate(fallbackRecord || (!recorder.active ? recordAction() : null));
        });
        bind('BTN_SETTINGS', async () => {
            if (state.modal || state.page === 'edit') return;
            // The kit suppresses its canvas and controller capture while the native SETTINGS state is open.
            await showNative(!ctx.display.own());
            await ui.open('SETTINGS');
        });
        for (let i = 0; i < NATIVE_ROWS; i++) {
            bind('BROWSE_' + i, async () => {
                const selected = nativeItems[i];
                if (!selected || !nativeOpen) return;
                await activate(selected.item, selected.revision);
                if (nativeOpen) await renderNativeMenu();
            });
        }
        bind('PREF_AUTO', () => { configure('automatic', !recorder.settings.automatic); refreshSettings(); });
        bind('PREF_SMOOTH', () => { configure('smoothing', !recorder.settings.smoothing); refreshSettings(); });
        bind('PREF_RETRY', () => { recorder.retrySources(); tell('Reconnecting to vehicle data'); refreshSettings(); });
        bind('PREF_SECTION', () => {
            const index = PAGES.indexOf(ctx.settings.get('section'));
            configure('section', PAGES[(index + 1) % PAGES.length]);
            refreshSettings();
        });
        bind('PREF_DEMO', () => { chooseDemo(!demo); refreshSettings(); });
        ctx.settings.onChange((key) => {
            if (key === 'demo') {
                if (!setDemo(ctx.settings.get('demo') === 'on')) ctx.settings.values.demo = demo ? 'on' : 'off';
                recorder.settings.demo = ctx.settings.get('demo');
                if (ui.isVisible('SETTINGS') && !nativeOpen) refreshSettings();
            } else if (key === 'section') recorder.settings.section = ctx.settings.get('section');
        });
        if (ctx.onTab) ctx.onTab((index) => {
            if (!state.modal && state.page !== 'edit' && PAGES[index]) openPage(PAGES[index]);
        });
        ui.onVisible((name, visible) => {
            if (name === 'MAIN' && !visible && !nativeOpen) closeModal();
            if (name === 'SETTINGS' && !visible) {
                nativeOpen = false;
                nativeItems = [];
                ++nativeRender;
                closeModal();
            }
            dirty = true;
        });
        if (ctx.onLayout) ctx.onLayout(() => {
            if (!ctx.display.own() && !nativeOpen) {
                if (state.page === 'edit') finishEdit();
                closeModal();
            }
            dirty = true;
        });

        function liveSnapshot(now) {
            if (demo) return demo.live;
            try {
                const values = sources.sample(now, false);
                liveError = '';
                return values;
            } catch (error) {
                if (liveError !== error.message) log.warn(error);
                liveError = error.message;
                return {};
            }
        }
        Object.assign(ctx.settings.values, recorder.settings);
        if (ctx.settings.get('demo') === 'on') {
            setDemo(true);
            route(PAGES.includes(initial) ? initial : 'trip', null);
        }
        recorder.setVehicleEnabled(!demo && !ctx.preview);
        loop = ctx.loop('MAIN', 8, async () => {
            if (model.closed) return;
            const now = mono(), elapsed = now - lastDraw;
            if (elapsed < (ctx.display.own() ? 100 : 200) || (!dirty && !demo && elapsed < 900)) return;
            if (demo) demo.advance(Math.min(Date.now(), demo.at + 1000));
            if (state.page === 'history' || state.page === 'records') refreshHistory();

            dirty = false;
            lastDraw = now;
            const trip = selectedTrip(), saved = !!state.saved, detail = state.detail;
            const revision = state.revision, controls = pageView();
            const toast = state.noticeUntil > now ? state.notice : '';
            const record = recordAction();
            const frame = Dashboard.draw(ctx, Object.assign({}, controls, {
                tabs: TABS, selectedTab: state.page === 'edit' ? 0 : PAGES.indexOf(state.page), page: state.page,
                trip, saved, demo: !!demo, recording: !!recorder.active, modal: state.modal, draft: state.draft,
                notice: toast || recorder.notice(), toast, record, activate: (item) => activate(item, revision), bandRows: BAND_ROWS,
                tablePage: state.fuelPage, tableCoverage: state.coverage[state.page], smoothing: recorder.settings.smoothing,
                live: !saved && state.page === 'trip' ? liveSnapshot(now) : null,
                projection: saved ? detail && detail.projection : demo ? demo.projection : model.projection,
                graphLoading: saved && detail && detail.loading, graphError: saved && detail && detail.error,
                graphSkipped: saved && detail && detail.skipped,
            }));
            if (!frame.own) {
                fallbackRecord = record;
                nativeText('BTN_RECORD', record.label);
            } else fallbackRecord = null;
            await ui.image('MAIN_GFX', frame);
        });
    },
});

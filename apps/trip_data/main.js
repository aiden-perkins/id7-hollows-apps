'use strict';
const mgu = require('./kit/mgu');
const { Storage } = require('./storage');
const { Sources, NOTES } = require('./sources');
const { Recorder } = require('./recorder');
const V = require('./view');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, visible = {}, cache = {};
        let closed = false, rendering = false, timer = null, notice = '', busy = false;
        let selectedId = null, saved = null, history = [], projection = null, graphTrip = null, graphLoading = false, graphRequest = 0;
        let draft = null, editField = 'name', editPosition = 0, usageBytes = null;
        const graph = { metric: 'speed', axis: 'time', zoomSeconds: 0, cursor: 100, maxIntervalMs: 5000 };
        const zooms = [0, 60, 300, 900, 3600];
        const text = (id, value) => {
            value = String(value);
            if (cache[id] === value) return;
            cache[id] = value; ui.text(id, value);
        };
        const rows = async (id, labels) => {
            const key = id + ':count';
            if (cache[key] !== labels.length) { cache[key] = labels.length; await ui.rows(id, labels.length); }
            for (let i = 0; i < labels.length; i++) {
                const rowKey = id + ':' + i;
                if (cache[rowKey] !== labels[i]) { cache[rowKey] = labels[i]; await ui.text(id, labels[i], i); }
            }
        };
        const storage = new Storage(ctx.dataDir);
        const sources = new Sources(ctx, () => {});
        const recorder = new Recorder(storage, sources, () => {});
        const trip = () => selectedId ? saved : recorder.active;
        const title = (s) => !s ? 'No trip selected' : (selectedId ? s.name + ' | ' + V.date(s.startedAt) : 'Current trip | ' + V.date(s.startedAt));
        const summaryState = () => selectedId ? 'SUMMARY' : 'MAIN';
        async function parent(child, name) {
            const c = ui.comp(child), p = ui.comp(name);
            if (c && p && c.setProperty && p.getId) {
                let timeout;
                try {
                    await Promise.race([c.setProperty('ParentState', p.getId(), 'UInt'), new Promise((resolve, reject) => {
                        timeout = setTimeout(() => reject(new Error('Native Back target timed out; use the on-screen Back control')), 2000);
                    })]);
                } catch (e) { notice = e.message; ctx.log.warn(e); }
                finally { clearTimeout(timeout); }
            }
        }
        async function show(name) { await ui.open(name); }
        async function summary(s) { if (graphTrip !== s.id) projection = null; selectedId = s.id; saved = s; await show('SUMMARY'); }
        async function current() { if (!recorder.active || graphTrip !== recorder.active.id) projection = null; selectedId = null; saved = null; await show('MAIN'); }
        async function refreshHistory() {
            const loaded = storage.history().filter((s) => !recorder.active || s.id !== recorder.active.id);
            if (selectedId && history.some((s) => s.id === selectedId)) {
                const oldIds = history.map((s) => s.id);
                history = oldIds.map((id) => loaded.find((s) => s.id === id)).filter(Boolean)
                    .concat(loaded.filter((s) => !oldIds.includes(s.id)));
            } else history = loaded;
            usageBytes = storage.usage();
            await rows('HISTORY_LIST', history.length ? history.map((s) => s.name + ' | ' + V.date(s.startedAt) + ' | ' +
                (s.status === 'recording' ? 'interrupted (process restart)' : s.status) + ' | ' + V.number(s.stats.durationMs / 1000, 's') +
                ' | ' + (s.stats.speedMs ? V.number(s.stats.distanceMiles, 'mi') : 'distance unavailable')) : ['No saved trips']);
        }
        async function prepareGraph(metric) {
            const s = trip(); if (!s) throw new Error('No trip selected');
            if (metric) graph.metric = metric;
            graph.maxIntervalMs = s.policy.maxIntervalMs;
            if (graphTrip === s.id && projection) return;
            const request = ++graphRequest; graphLoading = true; notice = 'Loading recorded graph samples...';
            try {
                const extra = recorder.active && recorder.active.id === s.id ? recorder.buffer.slice() : [];
                const loaded = await V.load(storage, s.id, extra);
                if (closed || request !== graphRequest) return;
                projection = loaded; graphTrip = s.id; notice = '';
            } finally { if (request === graphRequest) graphLoading = false; }
        }
        async function openView(name, metric) {
            if (!trip()) throw new Error('No trip selected');
            await parent(name, summaryState());
            await show(name);
            if (name === 'GRAPHS') await rows('GRAPH_CURSOR', Array.from({ length: 101 }, (_, i) => 'Cursor ' + i + '% through visible points'));
            if (name === 'GRAPHS' || name === 'ELEVATION') await prepareGraph(metric);
        }
        async function exclusive(action) {
            if (busy) throw new Error('An operation is already in progress');
            busy = true;
            try { return await action(); } finally { busy = false; }
        }
        const bind = (id, fn) => ui.onClick(id, async (ev) => {
            try { await fn(ev); } catch (e) { notice = e.message; ctx.log.warn(e); }
            render();
        });
        const enable = (id, value) => {
            if (cache[id + ':enabled'] === value) return;
            cache[id + ':enabled'] = value; ui.enabled(id, value);
        };
        async function render() {
            if (closed || rendering) return;
            rendering = true;
            try {
                const errors = storage.errors.concat(storage.historyErrors || []);
                const message = recorder.error || notice || (errors.length ? errors.join(' | ') : '');
                if (visible.MAIN) {
                    const s = recorder.active;
                    text('CURRENT_STATE', s ? 'Current trip | ' + s.status : 'No active trip' +
                        (recorder.interrupted.length ? ' | interrupted trips await recovery in History' : ' | Start manually to record'));
                    text('CURRENT_TOTALS', s ? V.totals(s) : 'No trip totals before Start.');
                    const live = sources.sample(require('./sources').mono());
                    text('CURRENT_SOURCE', s ? 'Current speed: ' + V.number(live.speed.state === 'live' ? live.speed.value : null, 'mph') +
                        ' | Latest altitude: ' + V.number(live.gps.state === 'live' ? live.gps.altitudeFt : null, 'ft') +
                        ' | Gear: ' + (live.gear.state === 'live' ? live.gear.value : 'unknown') : 'GPS coordinates and height will be recorded independently.');
                    text('CURRENT_AUTO', 'Automatic ignition recording: ' + (recorder.settings.automatic ? 'requested, unavailable' : 'off') + '. ' + NOTES.ignition);
                    text('CURRENT_NOTICE', message || 'Recording continues across this app’s pages while its process remains alive. Hidden/sleep operation is unproven.');
                    enable('CURRENT_START', !s && !busy); enable('CURRENT_FINISH', !!s && !busy);
                    ['GRAPHS', 'ELEVATION', 'FUEL', 'GEARS'].forEach((n) => enable('CURRENT_' + n, !!s));
                }
                if (visible.SUMMARY && saved) {
                    text('SUMMARY_TITLE', title(saved));
                    text('SUMMARY_STATE', (saved.status === 'recording' ? 'Interrupted recording detected after process restart' : saved.status) +
                        ' | End: ' + V.date(saved.endedAt) + ' | ' + (saved.finishReason || saved.interruptionReason || ''));
                    text('SUMMARY_TOTALS', V.totals(saved));
                    text('SUMMARY_NOTES', saved.annotation || 'No annotation');
                    text('SUMMARY_GAPS', 'Recovery intervals: ' + saved.gaps.length + ' | ' +
                        (saved.gaps.length ? saved.gaps.map((g) => V.date(g.after) + ' to ' + V.date(g.before) + ': ' + g.reason).join('\n') : 'None recorded') +
                        ' | Recovery downtime is not added to recorded duration.');
                    text('SUMMARY_NOTICE', message);
                    enable('SUMMARY_RECOVER', saved.status !== 'finished' && !recorder.active && !busy);
                    enable('SUMMARY_CLOSE', saved.status !== 'finished' && !recorder.active && !busy);
                    enable('SUMMARY_EDIT', saved.status === 'finished' && !busy);
                    enable('SUMMARY_DELETE', saved.status === 'finished' && !busy);
                }
                const s = trip();
                if (s && (visible.GRAPHS || visible.ELEVATION || visible.FUEL || visible.GEARS)) {
                    if (recorder.active && recorder.active.id === s.id && projection && graphTrip === s.id) {
                        recorder.recent.forEach((r) => projection.add(r));
                    }
                    ['GRAPHS', 'ELEVATION', 'FUEL', 'GEARS'].forEach((name) => {
                        if (visible[name]) text(name + '_TRIP', title(s));
                    });
                    if (visible.GRAPHS) {
                        text('GRAPH_OPTIONS', graph.metric + ' | ' + graph.axis + ' axis | ' +
                            (graph.zoomSeconds ? 'last ' + graph.zoomSeconds + ' seconds' : 'full trip') +
                            ' | MPG window 60 s | display projection, totals unaffected');
                        text('GRAPH_CURSOR_VALUE', V.cursor(graphTrip === s.id ? projection : null, graph));
                        text('GRAPH_NOTICE', graphLoading ? 'Loading...' : message || 'Rotate in the cursor list to move; press to confirm. Missing samples remain gaps.');
                        await ui.image('GRAPH_IMAGE', V.graph(!graphLoading && graphTrip === s.id ? projection : null, graph, title(s), recorder.settings.smoothing));
                    }
                    if (visible.ELEVATION) {
                        text('ELEVATION_TOTALS', V.elevation(s));
                        await ui.image('ELEVATION_IMAGE', V.graph(!graphLoading && graphTrip === s.id ? projection : null, Object.assign({}, graph, { metric: 'altitude', axis: 'time' }), title(s), recorder.settings.smoothing));
                        text('ELEVATION_NOTICE', message || NOTES.gps);
                    }
                    if (visible.FUEL) { text('FUEL_TOTALS', V.fuel(s)); text('FUEL_NOTICE', message || NOTES.fuel); }
                    if (visible.GEARS) { text('GEARS_TOTALS', V.gears(s)); text('GEARS_NOTICE', message || s.policy.gear + ' | ' + NOTES.rpm); }
                }
                if (visible.HISTORY) text('HISTORY_NOTICE', message || 'Selecting a saved trip does not stop the current recording.');
                if (visible.PREFERENCES) {
                    text('PREF_FIXED', 'US units | 3 decimal measurement places | h:mm:ss AM/PM M-D-YYYY | Moving means > 1 mph; stationary time remains recorded.');
                    text('PREF_DETAIL', 'Sample interval: ' + recorder.settings.sampleMs + ' ms (fixed per trip)');
                    text('PREF_AUTO', 'Automatic ignition recording: ' + (recorder.settings.automatic ? 'requested, unavailable' : 'off') + ' | validated source required');
                    text('PREF_ALTITUDE', 'Elevation deadband: ' + recorder.settings.altitudeThresholdFt + ' ft (fixed per trip)');
                    text('PREF_SMOOTH', 'Display graph smoothing: ' + (recorder.settings.smoothing ? 'on' : 'off') + ' (does not change totals)');
                    text('PREF_BANDS', 'Speed-band boundaries: ' + recorder.settings.speedBands.join(', ') + ' mph (fixed per trip)');
                    text('PREF_STORAGE', 'Trip storage used: ' + V.number(usageBytes === null ? null : usageBytes / 1048576, 'MiB') +
                        (storage.usageIncomplete ? ' (partial scan)' : '') + ' | Retain all trips; no automatic deletion. Available filesystem space cannot be established by this Node runtime.');
                    text('PREF_NOTICE', message || 'No maximum recording duration. Chunks/checkpoints are saved every 5 seconds or 64 rows; a storage failure interrupts recording and preserves saved data.');
                }
                if (visible.DELETE_TRIP) text('DELETE_NOTICE', message);
                if (visible.EDIT_METADATA && draft) {
                    const limit = editField === 'name' ? 48 : 160, value = draft[editField].padEnd(limit, ' ');
                    text('EDIT_PREVIEW', editField + ': ' + value.slice(Math.max(0, editPosition - 15), editPosition) + '[' +
                        (value[editPosition] === ' ' ? '_' : value[editPosition]) + ']' + value.slice(editPosition + 1, editPosition + 25));
                    text('EDIT_POSITION', 'Character ' + (editPosition + 1) + '/' + limit + ' | Save commits both fields; Back cancels uncommitted changes.');
                    text('EDIT_NOTICE', message);
                }
            } catch (e) { notice = 'Display: ' + e.message; ctx.log.warn(e); }
            finally { rendering = false; }
        }
        bind('CURRENT_START', () => exclusive(() => { recorder.start(); selectedId = null; graphTrip = null; projection = null; notice = 'Recording started manually'; }));
        bind('CURRENT_FINISH', () => exclusive(async () => { const s = recorder.finish('manual'); await summary(s); graphTrip = null; }));
        bind('CURRENT_MENU', () => show('MENU'));
        bind('CURRENT_RETRY', () => { sources.retry(); notice = 'Retrying vehicle providers'; });
        ['CURRENT', 'SUMMARY'].forEach((prefix) => {
            ['GRAPHS', 'ELEVATION', 'FUEL', 'GEARS'].forEach((name) => bind(prefix + '_' + name, () => openView(name, name === 'ELEVATION' ? 'altitude' : null)));
        });
        bind('MENU_CURRENT', current);
        bind('MENU_HISTORY', async () => { await refreshHistory(); await show('HISTORY'); });
        bind('MENU_SETTINGS', async () => { usageBytes = storage.usage(); await show('PREFERENCES'); });
        bind('HISTORY_LIST', (ev) => { const s = history[ev.row]; if (s) return summary(s); });
        bind('HISTORY_REFRESH', refreshHistory);
        bind('HISTORY_MENU', () => show('MENU'));
        bind('SUMMARY_HISTORY', async () => { await refreshHistory(); await show('HISTORY'); });
        bind('SUMMARY_RECOVER', () => exclusive(async () => { await recorder.recover(saved.id); graphTrip = null; projection = null; notice = 'Recovered with an explicit missing interval'; await current(); }));
        bind('SUMMARY_CLOSE', () => exclusive(async () => { const s = await recorder.closeInterrupted(saved.id); await summary(s); }));
        bind('SUMMARY_DELETE', async () => { text('DELETE_TITLE', title(saved)); await show('DELETE_TRIP'); });
        bind('DELETE_CONFIRM', () => exclusive(async () => {
            if (!saved || recorder.active && recorder.active.id === saved.id) throw new Error('Cannot delete the active trip');
            storage.delete(saved.id); saved = null; selectedId = null; graphTrip = null; projection = null;
            await refreshHistory(); recorder.history = storage.history(); recorder.interrupted = recorder.history.filter((s) => s.status !== 'finished' && (!recorder.active || s.id !== recorder.active.id));
            notice = 'Trip deleted'; await show('HISTORY');
        }));
        bind('DELETE_CANCEL', () => show('SUMMARY'));
        bind('SUMMARY_EDIT', () => {
            if (!saved || saved.status !== 'finished') throw new Error('Close interrupted recording before editing');
            draft = { name: saved.name, annotation: saved.annotation || '' }; editPosition = 0; editField = 'name';
            return show('EDIT_METADATA');
        });
        bind('EDIT_FIELD', () => { editField = editField === 'name' ? 'annotation' : 'name'; editPosition = 0; });
        bind('EDIT_PREV', () => { const limit = editField === 'name' ? 48 : 160; editPosition = (editPosition + limit - 1) % limit; });
        bind('EDIT_NEXT', () => { const limit = editField === 'name' ? 48 : 160; editPosition = (editPosition + 1) % limit; });
        const characters = ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.:,/';
        bind('EDIT_CHARACTER', async () => { await rows('CHARACTER_LIST', characters.split('').map((c) => c === ' ' ? 'Space / erase' : c)); await show('CHARACTERS'); });
        bind('CHARACTER_LIST', (ev) => {
            if (draft && characters[ev.row] !== undefined) {
                const limit = editField === 'name' ? 48 : 160, value = draft[editField].padEnd(limit, ' ');
                draft[editField] = value.slice(0, editPosition) + characters[ev.row] + value.slice(editPosition + 1);
            }
            return show('EDIT_METADATA');
        });
        bind('EDIT_SAVE', () => exclusive(async () => { if (!draft || !saved) return; saved = storage.edit(saved.id, draft.name.trim(), draft.annotation.trim()); draft = null; await show('SUMMARY'); }));
        bind('EDIT_CANCEL', () => { draft = null; return show('SUMMARY'); });
        ['GRAPHS', 'ELEVATION', 'FUEL', 'GEARS'].forEach((name) => bind(name + '_BACK', () => show(summaryState())));
        bind('ELEVATION_GRAPH', () => openView('GRAPHS', 'altitude'));
        bind('FUEL_GRAPH', () => openView('GRAPHS', 'mpg'));
        bind('GRAPH_TYPE', () => { const list = ['speed', 'altitude', 'mpg']; graph.metric = list[(list.indexOf(graph.metric) + 1) % list.length]; });
        bind('GRAPH_AXIS', () => { graph.axis = graph.axis === 'time' ? 'distance' : 'time'; });
        bind('GRAPH_CURSOR', (ev) => { if (Number.isInteger(ev.row) && ev.row >= 0 && ev.row <= 100) graph.cursor = ev.row; });
        const cursorComp = ui.comp('GRAPH_CURSOR');
        if (cursorComp && cursorComp.on) cursorComp.on('focus', (ev) => {
            if (ev && Number.isInteger(ev.row) && ev.row >= 0 && ev.row <= 100) { graph.cursor = ev.row; render(); }
        });
        bind('GRAPH_PREV', () => { graph.cursor = Math.max(0, graph.cursor - 1); });
        bind('GRAPH_NEXT', () => { graph.cursor = Math.min(100, graph.cursor + 1); });
        bind('GRAPH_ZOOM', async () => { await rows('ZOOM_LIST', zooms.map((s) => s ? 'Last ' + s + ' seconds' : 'Full trip')); await show('ZOOM'); });
        bind('ZOOM_LIST', (ev) => { if (zooms[ev.row] !== undefined) graph.zoomSeconds = zooms[ev.row]; return show('GRAPHS'); });
        const zoomComp = ui.comp('ZOOM_LIST');
        if (zoomComp && zoomComp.on) zoomComp.on('focus', (ev) => {
            if (ev && zooms[ev.row] !== undefined) { graph.zoomSeconds = zooms[ev.row]; text('ZOOM_VALUE', graph.zoomSeconds ? 'Last ' + graph.zoomSeconds + ' seconds' : 'Full trip'); }
        });
        bind('PREF_DETAIL', () => { const list = [500, 1000, 2000]; recorder.configure('sampleMs', list[(list.indexOf(recorder.settings.sampleMs) + 1) % list.length]); });
        bind('PREF_AUTO', () => recorder.configure('automatic', !recorder.settings.automatic));
        bind('PREF_ALTITUDE', () => { const list = [5, 10, 20]; recorder.configure('altitudeThresholdFt', list[(list.indexOf(recorder.settings.altitudeThresholdFt) + 1) % list.length]); });
        bind('PREF_SMOOTH', () => recorder.configure('smoothing', !recorder.settings.smoothing));
        bind('PREF_BANDS', () => {
            const presets = [[15, 30, 45, 60, 80], [10, 20, 30, 40, 60], [20, 40, 60, 80, 100]];
            const index = presets.findIndex((v) => v.join(',') === recorder.settings.speedBands.join(','));
            recorder.configure('speedBands', presets[(index + 1) % presets.length]);
        });
        bind('PREF_MENU', () => show('MENU'));
        ui.onVisible((name, on) => {
            visible[name] = on;
            render();
        });
        const close = () => { if (closed) return; closed = true; ++graphRequest; clearInterval(timer); recorder.close(); };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        await parent('MAIN', 'MENU'); await parent('HISTORY', 'MENU'); await parent('PREFERENCES', 'MENU');
        await parent('SUMMARY', 'HISTORY'); await parent('DELETE_TRIP', 'SUMMARY');
        await parent('EDIT_METADATA', 'SUMMARY'); await parent('CHARACTERS', 'EDIT_METADATA'); await parent('ZOOM', 'GRAPHS');
        visible.MAIN = ui.isVisible('MAIN');
        timer = setInterval(render, 1000); if (timer.unref) timer.unref();
        await render();
    },
});

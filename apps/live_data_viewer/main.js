'use strict';
const mgu = require('./kit/mgu');
const D = require('./definitions');
const { Storage } = require('./storage');
const { Model } = require('./model');
const { Services } = require('./services');
const V = require('./view');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, storage = new Storage(ctx.dataDir);
        let closed = false, timer = null, rendering = false, pendingRefresh = false;
        let currentPage = null, selected = null, notice = '', lastGraph = 0, lastDraw = 0;
        const states = { temperatures: 'TEMPERATURES', driving: 'DRIVING', health: 'HEALTH' };
        const titles = { temperatures: 'Temperatures', driving: 'Driving and drivetrain', health: 'Engine health' };
        const visible = {}, labels = {}, counts = {};
        const setText = (id, value) => {
            value = String(value);
            if (labels[id] === value) return;
            labels[id] = value; ui.text(id, value);
        };
        const rows = async (id, values) => {
            if (counts[id] !== values.length) { counts[id] = values.length; await ui.rows(id, values.length); }
            for (let i = 0; i < values.length; i++) {
                const key = id + ':' + i, value = values[i];
                if (labels[key] === value) continue;
                labels[key] = value;
                await ui.text(id, value, i);
            }
        };
        const refresh = () => { pendingRefresh = true; };
        const model = new Model(storage, refresh), services = new Services(ctx, model);
        const pageDefs = (page) => D.definitions.filter((d) => d.page === page || page === 'temperatures' && d.id.indexOf('tyreTemp') === 0);
        const selectedDef = () => D.definitions.find((d) => d.id === selected);
        const collect = () => {
            const pageVisible = currentPage && (visible[states[currentPage]] || visible.DETAILS);
            services.activate(pageVisible ? pageDefs(currentPage).map((d) => d.id) : []);
        };
        const openPage = async (page) => {
            currentPage = page; notice = '';
            await ui.open(states[page]); refresh();
        };
        const backToPage = async () => {
            if (currentPage) await ui.open(states[currentPage]);
            else await ui.open('MAIN');
            refresh();
        };
        const openDetails = async (d) => {
            selected = d.id; notice = ''; lastGraph = 0;
            const detail = ui.comp('DETAILS'), parent = ui.comp(states[currentPage || d.page]);
            // Native Back must return to the originating list, retaining its row focus.
            if (detail && parent && detail.setProperty && parent.getId) {
                await detail.setProperty('ParentState', parent.getId(), 'UInt');
            }
            await ui.open('DETAILS'); refresh();
        };
        const bind = (id, action) => ui.onClick(id, async (ev) => {
            try { await action(ev); }
            catch (e) { notice = e.message; ctx.log.warn(e); }
            refresh();
        });
        async function render() {
            if (closed || rendering) return;
            rendering = true; pendingRefresh = false;
            try {
                const banner = 'Observation session since ' + V.date(model.startedAt) + '; ignition boundary unavailable. Extrema cover collected valid samples only.';
                setText('HOME_SESSION', banner);
                setText('HOME_NOTICE', storage.error || notice || 'Choose a category to collect its data. Unsupported readings remain visible.');
                if (visible.MAIN) await rows('HOME_PAGES', model.settings.order.map((id) => titles[id]));
                for (const page of Object.keys(states)) {
                    if (!visible[states[page]] || visible.DETAILS) continue;
                    const defs = pageDefs(page), list = states[page] + '_READINGS';
                    setText(states[page] + '_SESSION', banner);
                    setText(states[page] + '_NOTICE', storage.error || notice || 'Select a reading for source, quality, recent graph and snapshot.');
                    if (counts[list] !== defs.length) { counts[list] = defs.length; await ui.rows(list, defs.length); }
                    for (let i = 0; i < defs.length; i++) {
                        const d = defs[i], value = V.summary(model, d), key = list + ':' + i;
                        const title = d.group + ' / ' + d.name;
                        if (labels[key] === title + value) continue;
                        labels[key] = title + value;
                        await ui.cells(list, i, { Text1stRow: title, Text2ndRow: value });
                    }
                    if (page === 'driving' && Date.now() - lastGraph >= model.settings.refreshMs) {
                        await ui.image('DRIVING_GRAPH', V.graph(model, D.definitions.find((d) => d.id === 'altitude')));
                        lastGraph = Date.now();
                    }
                }
                if (visible.DETAILS && selectedDef()) {
                    const d = selectedDef(), r = model.readings[d.id], s = model.state(d);
                    const times = r.arrivals, span = times.length > 1 ? times[times.length - 1] - times[0] : 0;
                    setText('DETAIL_TITLE', d.group + ' / ' + d.name);
                    setText('DETAIL_VALUE', V.summary(model, d));
                    setText('DETAIL_SOURCE', d.source ? D.IF[d.source] + ' / instance ' + (d.instance || '1') +
                        ' / ' + d.field + (d.member ? ' / ' + d.member : '') : d.lead || 'No validated source identified');
                    setText('DETAIL_NOTES', d.notes + ' | Kind: ' + d.kind + (d.position ? ' | Position: ' + d.position + '; ' + d.positionBasis : ''));
                    setText('DETAIL_AGE', 'Last delivery: ' + V.date(r.at) + (r.at ? ' | age ' + ((Date.now() - r.at) / 1000).toFixed(3) + ' s' : '') +
                        ' | ' + (r.collecting ? 'Collecting this category' : 'Collection paused') +
                        ' | ' + (span > 0 ? ((times.length - 1) * 1000 / span).toFixed(3) + ' deliveries/s' : 'Delivery rate unknown') +
                        ' (includes getter replies; source sample timestamps unavailable)');
                    setText('DETAIL_QUALITY', 'State: ' + s.state + ' | ' + (s.note || '') + ' | Quality: ' +
                        (r.decoded.quality || 'No source quality decoded') + ' | freshness limit ' + (d.staleMs / 1000) + ' s');
                    setText('DETAIL_EXTREMA', d.numeric ? 'Observed minimum ' + V.value(r.min, d.unit) + ' / maximum ' + V.value(r.max, d.unit) +
                        ' | ' + banner : 'Extrema unavailable: no validated numeric measurement');
                    setText('DETAIL_NOTICE', storage.error || notice || 'Save snapshot records data and quality; it does not take a screenshot.');
                    if (Date.now() - lastGraph >= model.settings.refreshMs) {
                        await ui.image('DETAIL_GRAPH', V.graph(model, d)); lastGraph = Date.now();
                    }
                }
                if (visible.PREFERENCES) {
                    setText('PREF_FIXED', 'US units | 3 decimal places for measurements | h:mm:ss AM/PM M-D-YYYY. IDs, counters and labels retain natural formats.');
                    setText('PREF_TREND', 'Recent graph window: ' + model.settings.trendSeconds + ' seconds');
                    setText('PREF_RATE', 'Display / getter refresh preference: ' + model.settings.refreshMs + ' ms');
                    setText('PREF_ORDER', 'Category order: ' + model.settings.order.map((id) => titles[id]).join(', '));
                    setText('PREF_NOTES', 'Only the visible category is collected. TPMS reads are bounded to 5 seconds; event rates are provider-controlled. Trend history is limited to 10 minutes and 1,201 points per numeric signal. Ignition is unconfirmed: no automatic trip reset or cross-restart extrema reuse.');
                    setText('PREF_NOTICE', storage.error || notice);
                }
            } catch (e) { notice = 'Display update: ' + e.message; ctx.log.warn(e); }
            finally { rendering = false; }
        }
        bind('HOME_PAGES', (ev) => {
            const page = model.settings.order[ev.row]; if (page) return openPage(page);
        });
        bind('HOME_SETTINGS', () => ui.open('PREFERENCES'));
        bind('HOME_RESET', () => ui.open('RESET_SESSION'));
        Object.keys(states).forEach((page) => {
            bind(states[page] + '_READINGS', (ev) => {
                const d = pageDefs(page)[ev.row]; if (d) return openDetails(d);
            });
            bind(states[page] + '_HOME', () => ui.open('MAIN'));
            bind(states[page] + '_RETRY', () => {
                services.activate(pageDefs(page).map((d) => d.id), true); notice = 'Reconnecting this category';
            });
        });
        bind('DETAIL_BACK', backToPage);
        bind('DETAIL_SAVE', async () => {
            const d = selectedDef(); if (!d) return;
            notice = 'Saving selected reading...'; refresh();
            notice = 'Saved ' + await services.snapshot(d);
        });
        bind('DETAIL_RETRY', () => { collect(); services.activate(services.ids, true); notice = 'Reconnecting this category'; });
        bind('PREF_TREND', () => {
            const options = [60, 180, 600]; model.configure('trendSeconds', options[(options.indexOf(model.settings.trendSeconds) + 1) % options.length]); lastGraph = 0;
        });
        bind('PREF_RATE', () => {
            const options = [500, 1000, 2000]; model.configure('refreshMs', options[(options.indexOf(model.settings.refreshMs) + 1) % options.length]);
        });
        bind('PREF_ORDER', () => {
            const next = model.settings.order.slice(); next.push(next.shift()); model.configure('order', next);
        });
        bind('PREF_HOME', () => ui.open('MAIN'));
        bind('RESET_CONFIRM', () => { model.reset(); notice = 'Observation session reset'; return ui.open('MAIN'); });
        bind('RESET_CANCEL', () => ui.open('MAIN'));
        ui.onVisible((name, on) => {
            if (closed) return;
            visible[name] = on;
            const page = Object.keys(states).find((id) => states[id] === name);
            if (on && page) currentPage = page;
            if (on) lastGraph = 0;
            collect(); refresh();
        });
        const close = () => {
            if (closed) return;
            closed = true; clearInterval(timer); services.close();
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        timer = setInterval(() => {
            // Render at the selected cadence; incoming notifications coalesce in shared state.
            if (Date.now() - lastDraw >= model.settings.refreshMs &&
                (pendingRefresh || Object.keys(visible).some((id) => visible[id]))) {
                lastDraw = Date.now(); render();
            }
        }, 250);
        if (timer.unref) timer.unref();
        Object.keys(states).forEach((id) => { visible[states[id]] = ui.isVisible(states[id]); });
        visible.MAIN = ui.isVisible('MAIN');
        await rows('HOME_PAGES', model.settings.order.map((id) => titles[id]));
        await render(); collect();
    },
});

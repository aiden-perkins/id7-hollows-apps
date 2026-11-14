'use strict';
const mgu = require('./kit/mgu');
const D = require('./definitions');
const { Storage } = require('./storage');
const { Model } = require('./model');
const { Services } = require('./services');
const V = require('./view');
const Demo = require('./demo');
const { Bm3Feed } = require('./bm3_feed');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, storage = new Storage(ctx.dataDir);
        let closed = false, loop = null, dirty = true, immediate = true, lastDraw = 0, activeKey = '';
        const section = ctx.settings.get('section') || 'driving';
        const state = { page: section === 'dynamics' ? 'driving' : section, exhaustMode: null, notice: '', noticeUntil: 0 };
        ctx.settings.values.section = state.page;
        const changed = () => { dirty = true; if (loop) loop.kick(); };
        const model = new Model(storage, changed, (error) => { tell(error.message); ctx.log.warn(error); });
        Object.assign(ctx.settings.values, model.settings, { categoryOrder: model.settings.order.join(',') });
        ctx.settings.schema.filter((s) => s.type === 'text').forEach((s) => { ctx.settings.values[s.key] = s.default; });
        ctx.settings.values.lastError = storage.error || 'None';
        let demo = ctx.settings.get('demo') === 'on' ? new Demo(model.settings, ctx.settings.get('demoDriveMode')) : null;
        let services = demo ? null : new Services(ctx, model);
        const bm3 = new Bm3Feed(ctx, changed);
        let collectionGeneration = 0, transition = Promise.resolve(), retiredDrain = Promise.resolve();
        const shown = () => ui.isVisible('MAIN') && !ui.isVisible('SETTINGS') &&
            !(ctx.display && ctx.display.sheet) && (!ui.hasFocus || ui.hasFocus('MAIN'));
        const tell = (message) => {
            state.notice = message; state.noticeUntil = Date.now() + 5000;
            ctx.settings.values.lastError = message;
            ui.cells('SET_LASTERROR', 0, { Text1stRow: 'Last error', Text2ndRow: message });
            immediate = true; changed();
        };
        const pageDefs = (page) => D.definitions.filter((d) => d.id === 'driveMode' ||
            d.page === page || d.pages && d.pages.includes(page));
        function collect(force) {
            if (closed) return;
            const current = services, visible = shown(), useBm3 = !demo && visible && state.page === 'bm3';
            const ids = !demo && visible && !useBm3 ? pageDefs(state.page).map((d) => d.id) : [];
            const engine = model.settings.bm3Engine;
            const key = [!!demo, state.page, visible, engine, ids.join(',')].join(':');
            if (!force && key === activeKey) return;
            activeKey = key;
            const generation = ++collectionGeneration;
            // Cancel queued legacy reads immediately. New collection waits for native
            // sends AND BM3 temporary-definition cleanup, including rapid tab changes.
            if (current) current.activate([], false, state.page);
            const drained = bm3.stop();
            transition = transition.catch((e) => ctx.log.warn(e)).then(async () => {
                await drained; await retiredDrain;
                if (current) await current.diagnostic.idle();
                if (closed || generation !== collectionGeneration || current !== services) return;
                if (useBm3) bm3.start(engine);
                else if (current) current.activate(ids, force, state.page);
            }).catch((e) => { if (!closed) { tell(e.message); ctx.log.warn(e); } });
        }
        async function setExhaust(mode) {
            if (closed || !shown()) return;
            try {
                const generation = collectionGeneration;
                if (demo) throw new Error('Exhaust disabled in demo');
                await transition;
                if (closed || generation !== collectionGeneration || !shown()) return;
                if (state.page === 'bm3') throw new Error('Exhaust control disabled during BM3 acquisition');
                if (!services) throw new Error('Vehicle services unavailable');
                await services.setExhaust(mode);
                if (!closed) state.exhaustMode = mode;
            } catch (e) {
                tell(e.message || 'Exhaust request failed'); ctx.log.warn(e);
            }
            immediate = true; changed();
        }
        function configure(key, value) {
            model.configure(key, value);
            Object.assign(ctx.settings.values, model.settings, { categoryOrder: model.settings.order.join(',') });
            if (demo) demo.settings = model.settings;
        }
        ctx.settings.onChange((key) => {
            if (closed) return;
            try {
                if (key === 'trendSeconds' || key === 'refreshMs' || key === 'boostSource') configure(key, ctx.settings.get(key));
                else if (key === 'categoryOrder') configure('order', ctx.settings.get(key).split(','));
                else if (key === 'bm3Engine') { configure(key, ctx.settings.get(key)); collect(true); }
                else if (key === 'demoDriveMode') {
                    if (demo) demo.driveMode = ctx.settings.get('demoDriveMode');
                }
                else if (key === 'demo') {
                    const enabled = ctx.settings.get('demo') === 'on';
                    if (enabled === !!demo) return;
                    if (services) {
                        const previous = services;
                        previous.activate([], false, state.page); previous.close(); services = null; model.activate([]);
                        retiredDrain = Promise.all([retiredDrain, previous.diagnostic.idle()]);
                    }
                    demo = enabled ? new Demo(model.settings, ctx.settings.get('demoDriveMode')) : null;
                    state.exhaustMode = null;
                    if (!demo) services = new Services(ctx, model);
                    activeKey = ''; collect(true);
                }
            } catch (e) {
                tell(e.message || 'Settings save failed'); ctx.log.warn(e);
            }
            immediate = true; changed();
        });
        if (ctx.onTab) ctx.onTab((index) => {
            if (closed) return;
            if (index === model.settings.order.length) {
                const button = ui.comp('BTN_SETTINGS');
                if (button) button.emit('action', {});
                return;
            }
            if (!model.settings.order[index]) return;
            state.page = model.settings.order[index];
            collect(); immediate = true; changed();
        });
        ui.onVisible(() => {
            if (closed) return;
            collect(); immediate = true; changed();
        });
        if (ui.onFocus) ui.onFocus(() => { if (!closed) { collect(); immediate = true; changed(); } });
        if (ctx.onLayout) ctx.onLayout(() => { if (!closed) { immediate = true; changed(); } });
        const close = async () => {
            if (closed) return;
            closed = true; collectionGeneration++;
            if (loop) loop.stop();
            if (services) services.activate([], false, state.page);
            try { await bm3.stop(); }
            catch (e) { ctx.log.warn(e); }
            finally { if (services) services.close(); }
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        loop = ctx.loop('MAIN', 60, async () => {
            if (closed) return;
            collect();
            const visible = shown(), sheet = ctx.display && ctx.display.sheet;
            if (!visible && !(sheet && ui.isVisible('MAIN') && !ui.isVisible('SETTINGS'))) return;
            if (!visible && !dirty && !immediate) return;
            const now = Date.now();
            if (!immediate && now - lastDraw < 1000 / 60) return;
            if (!demo && !dirty && now - lastDraw < 1000) return;
            if (demo && visible) demo.advance(now);
            dirty = false; immediate = false; lastDraw = now;
            await ui.image('MAIN_GFX', V.draw(ctx, Object.assign({}, state, { model: demo || model, demo: !!demo,
                bm3, setExhaust, notice: state.noticeUntil > now ? state.notice : '' })));
        });
        collect(); changed();
    },
});

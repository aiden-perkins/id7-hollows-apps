'use strict';
const mgu = require('./kit/mgu');
const D = require('./definitions');
const { Storage, currentPage } = require('./storage');
const { Model } = require('./model');
const { Services } = require('./services');
const V = require('./view');
const themeFor = require('./themes');
const Demo = require('./demo');
const { Bm3Feed } = require('./bm3_feed');

const statusIds = ['driveMode'].concat(require('./status').ids);
const drivingIds = D.definitions.filter((d) => d.page === 'driving' || d.pages && d.pages.includes('driving'))
    .map((d) => d.id);

mgu.run({
    async start(ctx) {
        ctx.theme = () => themeFor(ctx.settings.get('colorTheme'));
        if (ctx.display) ctx.display.theme = ctx.theme;
        const ui = ctx.ui, storage = new Storage(ctx.dataDir);
        let closed = false, loop = null, dirty = true, immediate = true, lastDraw = 0;
        const section = currentPage(ctx.settings.get('section'));
        const state = { page: Object.prototype.hasOwnProperty.call(V.titles, section) ? section : 'driving',
            exhaustMode: null, notice: '', noticeUntil: 0 };
        ctx.settings.values.section = state.page;
        const changed = () => { dirty = true; if (loop && (immediate || state.page !== 'status')) loop.kick(); };
        const model = new Model(storage, changed, (error) => { tell(error.message); ctx.log.warn(error); });
        Object.assign(ctx.settings.values, model.settings);
        delete ctx.settings.values.refreshMs;
        if (storage.error) ctx.log.warn(storage.error);
        // The emulator stub receives this flag even when it launches with the app open.
        const emulator = process.env.MGU_EMU_CLOSED !== undefined;
        const canDemo = emulator || ctx.preview;
        const demoDriveMode = () => ctx.settings.get('demoDriveMode') || 'SPORT EXPERT';
        let demo = canDemo && ctx.settings.get('demo') === 'on' ? new Demo(model.settings, demoDriveMode()) : null;
        const services = new Services(ctx, model);
        const bm3 = new Bm3Feed(ctx, services.diagnostic, changed);
        let activeKey = '', bm3Key = '', collectionGeneration = 0, bm3Generation = 0, transition = Promise.resolve();
        const shown = () => ui.isVisible('MAIN') && !ui.isVisible('SETTINGS') &&
            !(ctx.display && ctx.display.sheet) && (!ui.hasFocus || ui.hasFocus('MAIN'));
        const tell = (message) => {
            state.notice = message; state.noticeUntil = Date.now() + 5000;
            immediate = true; changed();
        };
        function collect() {
            if (closed) return;
            const visible = shown(), engine = model.settings.bm3Engine;
            const driving = !demo && visible && state.page === 'driving';
            const key = [!!demo, driving, engine].join(':');
            if (key !== activeKey) {
                activeKey = key; collectionGeneration++;
                services.activate(driving ? drivingIds : [], false, driving ? 'driving' : 'status', demo ? [] : statusIds);
            }
            const full = !demo && visible && state.page === 'bm3';
            const timing = !demo && /^[NS]63/.test(engine) && !ctx.preview && ctx.signals.hasNative();
            const nextBm3Key = full || timing ? engine + ':' + full : '';
            if (nextBm3Key === bm3Key) return;
            bm3Key = nextBm3Key;
            const generation = ++bm3Generation;
            // Both BM3 modes share the diagnostic request slot. Drain any temporary
            // definitions before changing modes while Car Status keeps its own reads due.
            const drained = bm3.stop();
            transition = transition.then(async () => {
                await drained;
                if (closed || generation !== bm3Generation || !nextBm3Key) return;
                bm3.start(engine, { timingOnly: !full });
            }).catch((e) => { if (!closed) { tell(e.message); ctx.log.warn(e); } });
        }
        async function setExhaust(mode) {
            if (closed || state.page !== 'driving' || !shown()) return;
            try {
                const generation = collectionGeneration;
                if (demo) throw new Error('Exhaust disabled in demo');
                await transition;
                if (closed || generation !== collectionGeneration || state.page !== 'driving' || !shown()) return;
                await services.setExhaust(mode);
                if (!closed) state.exhaustMode = mode;
            } catch (e) {
                tell(e.message || 'Exhaust request failed'); ctx.log.warn(e);
            }
            immediate = true; changed();
        }
        function configure(key, value) {
            model.configure(key, value);
            Object.assign(ctx.settings.values, model.settings);
            if (demo) demo.settings = model.settings;
        }
        ctx.settings.onChange((key) => {
            if (closed) return;
            try {
                if (key === 'trendSeconds' || key === 'boostSource') configure(key, ctx.settings.get(key));
                else if (key === 'bm3Engine') { configure(key, ctx.settings.get(key)); collect(); }
                else if (canDemo && key === 'demoDriveMode' && demo) demo.driveMode = demoDriveMode();
                else if (canDemo && key === 'demo') {
                    const enabled = ctx.settings.get('demo') === 'on';
                    if (enabled === !!demo) return;
                    demo = enabled ? new Demo(model.settings, demoDriveMode()) : null;
                    state.exhaustMode = null;
                    collect();
                }
            } catch (e) {
                tell(e.message || 'Settings save failed'); ctx.log.warn(e);
            }
            immediate = true; changed();
        });
        if (ctx.onTab) ctx.onTab((index) => {
            if (closed) return;
            if (index === V.pages.length) {
                const button = ui.comp('BTN_SETTINGS');
                if (button) button.emit('action', {});
                return;
            }
            if (!V.pages[index]) return;
            state.page = V.pages[index];
            collect(); immediate = true; changed();
        });
        ui.onVisible(() => {
            if (closed) return;
            collect(); immediate = true; changed();
        });
        if (ui.onFocus) ui.onFocus(() => { if (!closed) { collect(); immediate = true; changed(); } });
        if (ctx.onLayout) ctx.onLayout(() => { if (!closed) { immediate = true; changed(); } });
        const demoTimer = emulator ? setInterval(() => {
            if (demo && !shown()) demo.advance(Date.now());
        }, 500) : null;
        if (demoTimer) demoTimer.unref();
        const close = async () => {
            if (closed) return;
            closed = true;
            if (loop) loop.stop();
            clearInterval(demoTimer);
            services.activate([], false, 'status');
            try { await bm3.stop(); }
            catch (e) { ctx.log.warn(e); }
            finally { services.close(); }
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
            const frameMs = state.page === 'status' ? 250 : 1000 / 60;
            if (!immediate && now - lastDraw < frameMs) return;
            if (!demo && !dirty && now - lastDraw < 1000) return;
            if (demo && visible) demo.advance(now);
            dirty = false; immediate = false; lastDraw = now;
            await ui.image('MAIN_GFX', V.draw(ctx, Object.assign({}, state, { model: demo || model, demo: !!demo,
                bm3, setExhaust, notice: state.noticeUntil > now ? state.notice : '' })));
        });
        collect(); changed();
    },
});

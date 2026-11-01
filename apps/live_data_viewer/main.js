'use strict';
const mgu = require('./kit/mgu');
const D = require('./definitions');
const { Storage } = require('./storage');
const { Model } = require('./model');
const { Services } = require('./services');
const V = require('./view');
const Demo = require('./demo');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, storage = new Storage(ctx.dataDir);
        let closed = false, loop = null, dirty = true, immediate = true, lastDraw = 0, activeKey = '';
        const state = { page: ctx.settings.get('section') || 'driving', exhaustMode: null, notice: '', noticeUntil: 0 };
        const changed = () => { dirty = true; if (loop) loop.kick(); };
        const model = new Model(storage, changed, (error) => { tell(error.message); ctx.log.warn(error); });
        Object.assign(ctx.settings.values, model.settings, { categoryOrder: model.settings.order.join(',') });
        ctx.settings.schema.filter((s) => s.type === 'text').forEach((s) => { ctx.settings.values[s.key] = s.default; });
        ctx.settings.values.lastError = storage.error || 'None';
        let demo = ctx.settings.get('demo') === 'on' ? new Demo(model.settings, ctx.settings.get('demoDriveMode')) : null;
        let services = demo ? null : new Services(ctx, model);
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
            if (!services) return;
            const ids = shown() ? pageDefs(state.page).map((d) => d.id) : [];
            const key = ids.join(',');
            if (force || key !== activeKey) { activeKey = key; services.activate(ids, force); }
        }
        async function setExhaust(mode) {
            if (closed || !shown()) return;
            try {
                if (demo) throw new Error('Exhaust disabled in demo');
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
                else if (key === 'demoDriveMode') {
                    if (demo) demo.driveMode = ctx.settings.get('demoDriveMode');
                }
                else if (key === 'demo') {
                    const enabled = ctx.settings.get('demo') === 'on';
                    if (enabled === !!demo) return;
                    if (services) { services.close(); services = null; model.activate([]); }
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
        const close = () => {
            if (closed) return;
            closed = true;
            if (loop) loop.stop();
            if (services) services.close();
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
                setExhaust, notice: state.noticeUntil > now ? state.notice : '' })));
        });
        collect(); changed();
    },
});

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
        let closed = false, loop = null, dirty = true, immediate = true, lastDraw = 0;
        let grabbed = false, rawPosition = null, rawPressed = false, rawDeflection = 0, relayAt = -Infinity, lastSelect = -Infinity;
        let controllerWatch = null, activeKey = '';
        const state = { page: ctx.settings.get('section') || 'driving', focus: 0, notice: '', noticeUntil: 0 };
        const changed = () => { dirty = true; if (loop) loop.kick(); };
        const model = new Model(storage, changed);
        Object.assign(ctx.settings.values, model.settings);
        let demo = ctx.settings.get('demo') === 'on' ? new Demo(model.settings) : null;
        let services = demo ? null : new Services(ctx, model);
        const shown = () => ui.isVisible('MAIN') && (!ui.hasFocus || ui.hasFocus('MAIN'));
        const tell = (message) => { state.notice = message; state.noticeUntil = Date.now() + 8000; immediate = true; changed(); };
        const action = (id, label, run) => ({ id, label, run });
        const pageDefs = (page) => D.definitions.filter((d) => d.page === page || d.pages && d.pages.includes(page));
        function collect(force) {
            if (!services) return;
            const ids = shown() ? pageDefs(state.page).map((d) => d.id) : [];
            const key = ids.join(',');
            if (force || key !== activeKey) { activeKey = key; services.activate(ids, force); }
        }
        function syncController() {
            const next = shown() && !!(ctx.display && ctx.display.active && ctx.display.active('MAIN'));
            if (next !== grabbed) {
                grabbed = next; rawPosition = null; rawPressed = false; rawDeflection = 0;
                if (ctx.controller) ctx.controller.grab(next);
            }
        }
        function changePage(steps) {
            const order = model.settings.order, index = order.indexOf(state.page);
            state.page = order[(index + steps + order.length) % order.length];
            collect(); immediate = true; changed();
        }
        async function settings() {
            if (ctx.controller) ctx.controller.grab(false);
            grabbed = false; refreshSettings();
            await ui.open('PREFERENCES'); collect(); changed();
        }
        const actions = [
            action('previous', 'Previous page', () => changePage(-1)),
            action('next', 'Next page', () => changePage(1)),
            action('settings', 'Settings', settings),
        ];
        function move(steps) {
            state.focus = (state.focus + steps % actions.length + actions.length) % actions.length;
            immediate = true; changed();
        }
        async function select() {
            if (Date.now() - lastSelect < 160) return;
            lastSelect = Date.now();
            const chosen = actions[state.focus];
            if (chosen) await chosen.run();
            immediate = true; changed();
        }
        const labels = {};
        function nativeText(id, text) { if (labels[id] !== text) { labels[id] = text; ui.text(id, text); } }
        function refreshSettings() {
            nativeText('PREF_FIXED', 'US units / fuel to three decimals. IDs and labels retain natural formats.');
            nativeText('PREF_DEMO', 'Demo data: ' + (demo ? 'on / simulated' : 'off'));
            nativeText('PREF_TREND', 'Recent graph window: ' + model.settings.trendSeconds + ' seconds');
            nativeText('PREF_RATE', 'Other getter refresh: ' + model.settings.refreshMs + ' ms / display up to 60 FPS');
            nativeText('PREF_ORDER', 'Category order: ' + model.settings.order.map((id) => V.titles[id]).join(', '));
            nativeText('PREF_NOTES', 'New samples render independently of getter refresh, up to 60 FPS with renderer backpressure. Pedal reads request 50 ms after each reply; actual rate depends on the ECU and shared diagnostic transport. Fuel: 5 seconds; battery: 2 seconds; TPMS: at least 5 seconds. Min/max cover this app session. Native accelerator raw-to-percent, kickdown and per-bank IAT sources remain unvalidated.');
            nativeText('PREF_NOTICE', storage.error || state.noticeUntil > Date.now() && state.notice ||
                (demo ? 'SIMULATED DATA. Demo values and metadata are separate from live vehicle readings.' : ''));
        }
        const bind = (id, fn) => ui.onClick(id, async () => {
            if (closed) return;
            try { await fn(); } catch (e) { tell(e.message); ctx.log.warn(e); }
            if (ui.isVisible('PREFERENCES')) refreshSettings();
            immediate = true; changed();
        });
        function configure(key, value) {
            model.configure(key, value);
            Object.assign(ctx.settings.values, model.settings);
            if (demo) demo.settings = model.settings;
        }
        bind('PREF_DEMO', () => ctx.settings.set('demo', demo ? 'off' : 'on'));
        ctx.settings.onChange((key) => {
            if (closed || key !== 'demo') return;
            const enabled = ctx.settings.get('demo') === 'on';
            if (enabled === !!demo) return;
            if (services) { services.close(); services = null; model.activate([]); }
            demo = enabled ? new Demo(model.settings) : null;
            if (!demo) services = new Services(ctx, model);
            activeKey = ''; collect(true); refreshSettings(); immediate = true; changed();
        });
        if (ctx.onTab) ctx.onTab((index) => {
            if (closed || !model.settings.order[index]) return;
            state.page = model.settings.order[index];
            collect(); immediate = true; changed();
        });
        bind('PREF_TREND', () => {
            const options = [60, 180, 600];
            configure('trendSeconds', options[(options.indexOf(model.settings.trendSeconds) + 1) % options.length]);
        });
        bind('PREF_RATE', () => {
            const options = [100, 250, 500, 1000, 2000];
            configure('refreshMs', options[(options.indexOf(model.settings.refreshMs) + 1) % options.length]);
        });
        bind('PREF_ORDER', () => {
            const next = model.settings.order.slice(); next.push(next.shift()); configure('order', next);
        });
        bind('PREF_HOME', () => ui.open('MAIN'));
        async function raw(v) {
            if (!grabbed || !shown() || !v || closed) return;
            if ([15, 'SIGNAL_UNGUELTIG'].includes(v.frontRotaryEncoderPushButton) &&
                [15, 'SIGNAL_UNGUELTIG'].includes(v.frontRotaryEncoderDeflection)) return;
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
            const direction = directions[deflection], previousDirection = rawDeflection, previousPressed = rawPressed;
            rawDeflection = direction || 0; rawPressed = pressed;
            if (direction && direction !== previousDirection) {
                move(direction === 'left' || direction === 'up' ? -1 : 1);
            }
            if (pressed && !previousPressed) await select();
        }
        const safelyRaw = (v) => { Promise.resolve(raw(v)).catch((e) => { tell(e.message); ctx.log.warn(e); }); };
        if (ctx.controller && ctx.controller.onInput) ctx.controller.onInput((v) => { relayAt = Date.now(); safelyRaw(v); });
        Promise.resolve(ctx.signals.watch('de.bmw.infotainment.controlelements.FrontCCU', '1', {
            statusRotaryEncoderState: (v) => { if (Date.now() - relayAt > 1000) safelyRaw(v); },
        }, ctx.log)).then((watch) => {
            controllerWatch = watch;
            if (closed && watch && watch.shutdown) Promise.resolve(watch.shutdown()).catch((e) => ctx.log.warn(e));
        }).catch((e) => ctx.log.warn('Controller: ' + e.message));
        ui.onVisible((name, on) => {
            if (closed) return;
            if (name === 'PREFERENCES' && on) refreshSettings();
            syncController(); collect(); immediate = true; changed();
        });
        if (ui.onFocus) ui.onFocus(() => { if (!closed) { syncController(); collect(); immediate = true; changed(); } });
        const close = () => {
            if (closed) return;
            closed = true;
            if (ctx.controller) ctx.controller.grab(false);
            if (loop) loop.stop();
            if (services) services.close();
            if (controllerWatch && controllerWatch.shutdown) Promise.resolve(controllerWatch.shutdown()).catch((e) => ctx.log.warn(e));
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        loop = ctx.loop('MAIN', 60, async () => {
            if (closed) return;
            syncController(); collect();
            const now = Date.now();
            if (!immediate && now - lastDraw < 1000 / 60) return;
            if (!demo && !dirty && now - lastDraw < 1000) return;
            if (demo) demo.advance(now);
            dirty = false; immediate = false; lastDraw = now;
            await ui.image('MAIN_GFX', V.draw(ctx, Object.assign({}, state, { model: demo || model, actions, demo: !!demo,
                focused: actions[state.focus].id,
                notice: storage.error || (state.noticeUntil > now ? state.notice : '') || (demo ? 'SIMULATED DATA' : '') })));
        });
        refreshSettings(); syncController(); collect(); changed();
    },
});

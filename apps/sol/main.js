'use strict';

const mgu = require('./kit/mgu');
const { Diag } = require('./kit/diag');
const { Vehicle } = require('./vehicle');
const { Interior } = require('./interior');
const { Exterior } = require('./exterior');
const View = require('./view');

const WIDTH = 1600, HEIGHT = 520;

function background(ctx) {
    const diag = new Diag(ctx.signals, ctx.log);
    diag.quiet = true;
    diag.busyLog = false;
    const vehicle = new Vehicle(ctx);
    const interior = new Interior(ctx, diag, vehicle);
    const exterior = new Exterior(ctx, diag, vehicle, interior);
    let closed = false;
    const refresh = () => {
        if (closed) return;
        exterior.tick();
        interior.refresh(exterior.busy);
    };

    // The emulator can feed vehicle signals without providing a diagnostic transport or app lifecycle.
    vehicle.start();
    const native = typeof ctx.signals.hasNative === 'function' && ctx.signals.hasNative();
    const timer = native ? setInterval(refresh, 250) : null;
    if (native) diag.init().then(refresh).catch((e) => ctx.log.warn('Sol diagnostic link: ' + e));
    const shutdown = () => {
        closed = true;
        clearInterval(timer);
        exterior.closed = true;
        if (exterior.active || exterior.busy) exterior.stop();
        interior.stop();
        vehicle.stop();
    };
    if (ctx.app && typeof ctx.app.on === 'function') ctx.app.on('shutdown', shutdown);
    return { vehicle, interior, exterior };
}

mgu.run({
    background,
    async start(ctx) {
        const { ui, settings } = ctx;
        const { vehicle, interior, exterior } = ctx.background || background(ctx);
        const state = { page: 0, editMode: null, draft: null, exterior: 'outputs', output: null };
        let loop = null, dirty = true, tracks = [], drag = null, previousDraw = 0;
        const shown = () => ui.isVisible('MAIN') && (!ui.hasFocus || ui.hasFocus('MAIN')) && !(ctx.display && ctx.display.sheet);
        const changed = () => { dirty = true; if (loop) loop.kick(); };
        const act = (run) => {
            const page = state.page;
            return () => {
                if (!shown() || state.page !== page) return;
                vehicle.lastUse = Date.now();
                return run();
            };
        };

        function page(index) {
            drag = null;
            state.page = index;
            if (index !== 0) { state.editMode = null; state.draft = null; }
            if (index === 3 && state.exterior === 'switch') vehicle.watchSwitch();
            changed();
        }

        const rgb = () => state.editMode && Array.isArray(state.draft) ? state.draft : interior.profile.rgb;
        const selectColor = (color) => {
            if (state.editMode) { state.draft = color; changed(); }
            else interior.setColor(color);
        };
        const setSlider = (group, value) => {
            if (group === 'brightness') interior.setBrightness(value);
            else {
                const color = rgb().slice();
                color[group] = Math.max(0, Math.min(255, value));
                selectColor(color);
            }
        };

        function render() {
            dirty = false;
            previousDraw = Date.now();
            const cv = ctx.canvas(WIDTH, HEIGHT);
            tracks = View.render(cv, ctx.theme(), {
                state, vehicle, interior, exterior, act, rgb, selectColor,
                adjust: (group, amount) => setSlider(group, (group === 'brightness' ? interior.profile.brightness : rgb()[group]) + amount),
                editMode: (mode) => {
                    state.editMode = mode;
                    state.draft = interior.profile.modes[mode];
                    page(0);
                },
                cancelMode: () => page(1),
                saveMode: () => { interior.setColor(state.draft, state.editMode); page(1); },
                selectExterior: (selection) => {
                    state.exterior = selection;
                    if (selection === 'switch') vehicle.watchSwitch();
                    changed();
                },
                selectOutput: (id) => { state.output = id; changed(); },
            });
            return ui.image('MAIN_GFX', cv);
        }

        if (ctx.onTouch) ctx.onTouch((phase, x, y) => {
            if (phase === 1) {
                if (state.page !== 0 || !shown()) return false;
                const track = tracks.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
                drag = track ? { track, at: 0 } : null;
            }
            if (!drag) return false;
            const now = Date.now();
            if (phase !== 2 || now - drag.at >= 80) {
                const { track } = drag;
                const fraction = Math.max(0, Math.min(1, (x - track.x) / track.w));
                vehicle.lastUse = now;
                setSlider(track.group, Math.round(fraction * track.max));
                drag.at = now;
            }
            if (phase === 3) drag = null;
            return true;
        });

        ctx.onTab((index) => { if (index >= 0 && index < View.TABS.length) page(index); });
        ui.onClick('BTN_PREV', () => page((state.page + View.TABS.length - 1) % View.TABS.length));
        ui.onClick('BTN_PAGE', () => page((state.page + 1) % View.TABS.length));
        ui.onVisible((name, visible) => {
            if (name !== 'MAIN') return;
            vehicle.setVisible(visible);
            if (!visible) { drag = null; interior.save(); }
            changed();
        });
        vehicle.setVisible(ui.isVisible('MAIN'));
        ctx.onLayout(changed);
        settings.onChange(changed);
        vehicle.on('change', changed);
        interior.on('change', changed);
        exterior.on('change', changed);
        loop = ctx.loop('MAIN', 8, () => {
            if (dirty || Date.now() - previousDraw >= 300) return render();
            return null;
        });
        await render();
    },
});

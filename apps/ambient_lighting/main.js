'use strict';
const mgu = require('./kit/mgu');
const { MODES, COLORS, colorLabel } = require('./catalog');
const { Lighting } = require('./lighting');
const { listSheet, TOP } = require('./kit/sheet');
const V = require('./view');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui;
        let closed = false, dirty = true, loop = null, targets = [], enableLabel = '';
        const changed = () => { if (closed) return; dirty = true; if (loop) loop.kick(); };
        const lighting = new Lighting(ctx, changed);
        const report = (error) => {
            lighting.notice = error.message; ctx.log.warn(error); changed();
        };
        const options = [[0, 'Leave unchanged'], ['current', 'Assign current vehicle color']]
            .concat(COLORS.map((color) => [color.value, color.label]));
        // Use the upstream drawn settings picker without moving the saved mode-colors.json data.
        const choices = {
            schema: MODES.map((mode) => ({ key: mode.name, label: mode.label, type: 'choice', options })),
            get: (key) => lighting.mappings[key] === undefined ? 0 : lighting.mappings[key],
            display: (key) => colorLabel(lighting.mappings[key]),
            set(key, value) {
                if (value === 'current') {
                    if (lighting.color === null) throw new Error('Current vehicle color is unavailable; choose a factory slot instead.');
                    value = lighting.color;
                }
                lighting.assign(key, value === 0 ? undefined : value);
            }
        };
        const picker = listSheet(choices, 'Driving-mode colors');
        const choose = picker.choose, draw = picker.draw;
        picker.choose = function() {
            try { return choose.call(this); }
            catch (error) { report(error); return null; }
        };
        picker.draw = function(cv, theme) {
            options[1][1] = 'Assign current vehicle color (' +
                (lighting.color === null ? 'unavailable' : colorLabel(lighting.color)) + ')';
            const hits = draw.call(this, cv, theme);
            if (!this.open) cv.text('Driving-mode colors', 44, TOP + 40, 32, theme.text, { font: 'bold' });
            const help = this.open ? 'Factory color slots; brightness, on/off and dynamic lighting are unchanged.' :
                'Choose a mode. Unassigned modes leave the vehicle lighting unchanged.';
            V.text(cv, lighting.notice || help, 44, TOP + 66, 1512, 17, lighting.notice ? theme.warn : theme.dim);
            return hits;
        };
        picker.onClose = changed;
        function openPicker(mode) {
            picker.open = null;
            if (mode) {
                picker.focus = MODES.indexOf(mode);
                picker.choose();
            }
            if (!ctx.display.openSheet(picker)) {
                report(new Error('Full-screen color controls require the GPU renderer and Full screen layout.'));
            }
        }
        ui.onClick('BTN_MODES', () => { if (!closed) openPicker(); });
        ui.onClick('BTN_ENABLE', () => {
            if (closed) return;
            try { lighting.enable(!lighting.enabled); }
            catch (error) { report(error); }
        });
        ctx.onTap((x, y) => {
            if (closed || !ui.isVisible('MAIN') || ctx.display.sheet) return;
            const target = targets.find((q) => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h);
            if (target) openPicker(target.mode);
        });
        ui.onVisible(changed);
        if (ui.onFocus) ui.onFocus(changed);
        ctx.onLayout(changed);
        const close = () => {
            if (closed) return;
            closed = true;
            if (loop) loop.stop();
            ctx.display.closeSheet();
            lighting.close();
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        loop = ctx.loop('MAIN', 30, async () => {
            if (closed || !dirty) return;
            dirty = false;
            const label = lighting.enabled ? 'Disable following' : 'Enable following';
            if (label !== enableLabel) { await ui.text('BTN_ENABLE', label); enableLabel = label; }
            const frame = V.draw(ctx, lighting);
            targets = frame.targets;
            await ui.image('MAIN_GFX', frame.canvas);
        });
        changed();
        await lighting.start();
    }
});

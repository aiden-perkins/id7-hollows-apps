'use strict';
const mgu = require('./kit/mgu');
const { MODES, COLORS, colorLabel } = require('./catalog');
const { Lighting } = require('./lighting');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, cache = {};
        let selected = MODES[0], closed = false;
        const text = (name, value, row, cell) => {
            const key = name + ':' + (row || 0) + ':' + (cell || 'Text');
            if (cache[key] === value) return;
            cache[key] = value;
            Promise.resolve(ui.text(name, value, row, cell)).catch((error) => ctx.log.warn(error));
        };
        const lighting = new Lighting(ctx, render);
        function render() {
            if (closed) return;
            text('ENABLE', lighting.enabled ? 'Disable driving-mode lighting' : 'Enable driving-mode lighting');
            text('CURRENT', 'Current mode: ' + (lighting.mode ? lighting.mode.label : 'Waiting for vehicle') +
                ' | Vehicle color: ' + (lighting.color === null ? 'Unknown / custom / off' : colorLabel(lighting.color)));
            text('STATUS', lighting.status());
            MODES.forEach((mode, row) => {
                text('MODE_LIST', mode.label, row, 'Text1stCol');
                text('MODE_LIST', colorLabel(lighting.mappings[mode.name]), row, 'Text2ndCol');
            });
            text('COLOR_TITLE', selected.label + ' - ambient color' + (lighting.notice ? '\n' + lighting.notice : ''));
            const assigned = lighting.mappings[selected.name];
            text('COLOR_LIST', (assigned === undefined ? '[Selected] ' : '') + 'Leave unchanged', 0);
            text('USE_CURRENT', 'Assign current vehicle color' + (lighting.color === null ? ' (unavailable)' : ' (' + colorLabel(lighting.color) + ')'));
            COLORS.forEach((color, index) => text('COLOR_LIST',
                (assigned === color.value ? '[Selected] ' : '') + color.label, index + 1));
        }
        const bind = (name, action) => ui.onClick(name, async (event) => {
            try { await action(event || {}); }
            catch (error) { lighting.notice = error.message; ctx.log.warn(error); }
            render();
        });
        await ui.rows('MODE_LIST', MODES.length);
        await ui.rows('COLOR_LIST', COLORS.length + 1);
        bind('MODE_LIST', async (event) => {
            if (!Number.isInteger(event.row) || !MODES[event.row]) return;
            selected = MODES[event.row]; render();
            await ui.open('COLORS');
        });
        bind('COLOR_LIST', async (event) => {
            if (!Number.isInteger(event.row) || event.row < 0 || event.row > COLORS.length) return;
            lighting.assign(selected.name, event.row ? COLORS[event.row - 1].value : undefined);
            await ui.open('MAIN');
        });
        bind('ENABLE', () => lighting.enable(!lighting.enabled));
        bind('COLORS_BACK', () => ui.open('MAIN'));
        ui.onVisible((name, visible) => { if (visible) render(); });
        bind('USE_CURRENT', async () => {
            if (lighting.color === null) throw new Error('Choose a factory color in BMW lighting settings first; wait for its reported color number');
            lighting.assign(selected.name, lighting.color);
            await ui.open('MAIN');
        });
        const close = () => { if (closed) return; closed = true; lighting.close(); };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        render();
        await lighting.start();
    }
});

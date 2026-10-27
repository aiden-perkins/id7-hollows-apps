'use strict';
const mgu = require('./kit/mgu');
const { Lab } = require('./lab');
const { Store, EventLog } = require('./storage');
const { Services } = require('./services');
const { LiveUi } = require('./live_ui');
const { VehicleLab } = require('./vehicle_lab');
const D = require('./domain');
const View = require('./view');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, settings = ctx.settings;
        const store = new Store(ctx.dataDir), logger = new EventLog(ctx.dataDir);
        logger.setEnabled(settings.get('logging'));
        const lab = new Lab({ settings, store, logger, preview: !!ctx.preview });
        const services = new Services(ctx, lab); lab.api = services;
        const liveUi = new LiveUi(ui, lab, store);
        const vehicleLab = new VehicleLab(ui, lab, services);
        // The host preview can inject traffic through the same service adapter.
        ctx.lab = lab; ctx.labServices = services;
        const view = { section: settings.get('section') || 'input', modeRaw: true, details: false };
        let selected = 'A', dirty = true, loop = null, lastDraw = 0, refreshTimer = null;
        const labels = {}, visibility = {};
        const setText = (name, text) => {
            text = String(text);
            if (labels[name] === text) return;
            labels[name] = text; ui.text(name, text);
        };
        const refreshLabels = () => {
            let buttons;
            if (view.section === 'mode') buttons = ['Clear history', 'Lighting', view.modeRaw ? 'Mappings' : 'Raw payload'];
            else if (view.section === 'lights') buttons = ['Presets', 'Restore', lab.follow ? 'Follow: on' : 'Follow: off'];
            else if (view.section === 'status') buttons = ['Retry services', logger.enabled ? 'Log: on' : 'Log: off', view.details ? 'Values' : 'Details'];
            else buttons = ['Test click', services.relayWanted ? 'Stop input' : 'Connect input', 'Clear'];
            ['BTN_PRIMARY', 'BTN_SECONDARY', 'BTN_TERTIARY'].forEach((id, i) => setText(id, buttons[i]));
        };
        const refreshMenus = () => {
            setText('LIGHT_SUMMARY', D.lightSummary(lab.current()));
            ['A', 'B', 'C'].forEach((slot) => setText('PRESET_' + slot, 'Preset ' + slot + ' - ' + (lab.presets[slot] ? D.lightSummary(lab.presets[slot]) : 'empty')));
            setText('PRESET_EDIT_TITLE', 'Preset ' + selected);
            setText('PRESET_VALUE', lab.presets[selected] ? D.lightSummary(lab.presets[selected]) : 'Empty');
            setText('PRESET_RESULT', lab.notice.text);
        };
        const refresh = () => {
            dirty = true; refreshLabels();
            if (!refreshTimer && (ui.isVisible('PRESETS') || ui.isVisible('PRESET_EDIT'))) {
                refreshTimer = setTimeout(() => { refreshTimer = null; refreshMenus(); }, 180);
            }
        };
        lab.on('change', refresh);
        const show = (section) => {
            if (!View.SECTIONS.includes(section)) section = 'input';
            if (view.section === 'input' && section !== 'input') services.stopRelay();
            view.section = section;
            if (settings.get('section') !== section) settings.set('section', section);
            refreshLabels(); dirty = true; ui.open('MAIN');
            if (loop) loop.kick();
        };
        const bind = (name, action) => {
            ui.onClick(name, (ev) => { lab.native('action', name, ev); return action(ev); });
            const c = ui.comp(name);
            if (c && c.on) c.on('focus', (ev) => lab.native('focus', name, ev));
        };
        liveUi.start(bind);
        vehicleLab.start(bind);
        bind('BTN_SECTIONS', () => ui.open('SECTIONS'));
        ['INPUT', 'MODE', 'LIGHTS', 'STATUS'].forEach((n) => bind('OPEN_' + n, () => show(n.toLowerCase())));
        bind('BTN_PRIMARY', () => {
            if (view.section === 'input') lab.tell('Test click received (' + lab.inputs.actions + ' app actions)', 'good');
            else if (view.section === 'mode') { lab.modeHistory = []; lab.tell('Mode history cleared'); }
            else if (view.section === 'lights') { refreshMenus(); return ui.open('PRESETS'); }
            else { lab.setFollow(false); return services.retry(); }
        });
        bind('BTN_SECONDARY', () => {
            if (view.section === 'input') return services.relayWanted ? services.stopRelay() : services.startRelay();
            if (view.section === 'mode') return show('lights');
            if (view.section === 'lights') return lab.restore();
            settings.set('logging', !logger.enabled);
        });
        bind('BTN_TERTIARY', () => {
            if (view.section === 'input') lab.clearInput();
            else if (view.section === 'mode') { view.modeRaw = !view.modeRaw; dirty = true; refreshLabels(); }
            else if (view.section === 'lights') lab.setFollow(!lab.follow);
            else { view.details = !view.details; dirty = true; refreshLabels(); }
        });
        ['A', 'B', 'C'].forEach((slot) => bind('PRESET_' + slot, () => { selected = slot; refreshMenus(); return ui.open('PRESET_EDIT'); }));
        bind('PRESET_RETURN', () => show('lights'));
        bind('PRESET_BACK', () => { refreshMenus(); return ui.open('PRESETS'); });
        bind('CAPTURE_PRESET', () => lab.capture(selected));
        bind('APPLY_PRESET', () => lab.apply(selected));
        bind('MAP_PRESET', () => lab.assign(selected));
        bind('DELETE_PRESET', () => lab.remove(selected));
        ui.onVisible((name, visible) => {
            visibility[name] = visible;
            lab.visibility(Object.keys(visibility).some((k) => visibility[k]));
            if (name === 'MAIN' && !visible) services.stopRelay();
            if (visible && (name === 'PRESETS' || name === 'PRESET_EDIT')) refreshMenus();
        });
        const optionState = ui.comp('SETTINGS');
        if (optionState && optionState.on) optionState.on('visible', (ev) => {
            visibility.SETTINGS = !!(ev && ev.visible);
            lab.visibility(Object.keys(visibility).some((k) => visibility[k]));
        });
        settings.onChange((key, value) => {
            if (key === 'logging') { logger.setEnabled(value); lab.tell('Event log ' + (value ? 'on' : 'off')); }
            if (key === 'section') { view.section = value; dirty = true; refreshLabels(); }
            if (key === 'relayManager') services.stopRelay();
            if (key === 'lightApi') { lab.setFollow(false); dirty = true; }
            if (/^map/.test(key) && lab.follow) lab.scheduleFollow();
            dirty = true;
        });
        const close = () => { if (refreshTimer) clearTimeout(refreshTimer); vehicleLab.close(); liveUi.close(); lab.close(); services.close(); };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', () => { vehicleLab.close(); liveUi.close(); lab.close(); });
        loop = ctx.loop('MAIN', 8, () => {
            const now = Date.now();
            if (!dirty && now - lastDraw < 1000) return;
            dirty = false; lastDraw = now;
            return ui.image('MAIN_GFX', View.draw(ctx, lab, view));
        });
        refreshLabels();
        lab.service('relay', 'Raw input relay', 'idle', 'Connect input to request a relay');
        services.start();
    },
});

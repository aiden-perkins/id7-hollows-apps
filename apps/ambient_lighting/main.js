'use strict';
const mgu = require('./kit/mgu');
const D = require('./domain');
const { Store } = require('./storage');
const { Lighting } = require('./model');
const { Services } = require('./services');

mgu.run({
    async start(ctx) {
        const ui = ctx.ui, store = new Store(ctx.dataDir);
        let refreshTimer = null, closed = false, selected = null, draft = null, mappingMode = null, namePosition = 0;
        let presetRows = [], mappingRows = [];
        const visible = {}, cache = {}, counts = {};
        const text = (id, value, row) => {
            const key = id + ':' + (row || 0), label = String(value);
            if (cache[key] === label) return;
            cache[key] = label; ui.text(id, label, row || 0);
        };
        const rows = (id, labels) => {
            if (counts[id] !== labels.length) {
                counts[id] = labels.length;
                Object.keys(cache).filter((k) => k.indexOf(id + ':') === 0).forEach((k) => delete cache[k]);
                ui.rows(id, labels.length);
            }
            labels.forEach((label, i) => text(id, label, i));
        };
        const refresh = () => {
            if (closed || refreshTimer) return;
            refreshTimer = setTimeout(() => { refreshTimer = null; render(); }, 120);
        };
        const model = new Lighting(store, refresh), services = new Services(ctx, model);
        model.api = services;
        const find = () => model.saved.presets.find((p) => p.id === selected);
        const labelMode = (m) => m ? m.replace(/_/g, ' ') : 'Unknown / unsupported';
        const show = (name) => {
            if (name === 'MAIN' || name === 'PRESETS') draft = null;
            render(); return ui.open(name);
        };
        const bind = (id, action) => ui.onClick(id, async (ev) => {
            try { await action(ev); } catch (e) { model.tell(e.message); }
            refresh();
        });
        const edit = (p) => { draft = D.clone(p); namePosition = 0; return show('EDITOR'); };
        const characters = ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.';
        function render() {
            if (closed) return;
            const current = find(), menu = D.menu(model.raw), fresh = Date.now() - model.lightAt < 10000;
            const result = model.pending ? 'Pending: factory menu ' + model.pending.menu : model.status;
            const errors = Object.keys(store.errors).map((k) => store.errors[k]).join(' | ');
            text('HOME_MODE', 'Driving mode: ' + labelMode(Date.now() - model.modeAt < 10000 ? model.currentMode : null));
            text('HOME_LIGHT', 'Vehicle: ' + (fresh && model.raw ? menu === null ? 'Unknown menu; see raw status' : 'Factory menu ' + menu : 'Unknown / stale'));
            text('HOME_ACTIVE', model.active ? 'Preset: ' + model.active.name + ' (' + model.active.source + ')' : 'No app preset currently confirmed');
            text('HOME_AUTO', 'Automation: ' + model.reason());
            text('HOME_RESULT', result + (errors ? ' | ' + errors : ''));
            text('HOME_TOGGLE', model.settings.automation ? 'Disable automation' : 'Enable automation');
            if (visible.PRESETS) {
                presetRows = model.saved.presets.map((p) => p.id);
                rows('PRESET_LIST', presetRows.length ? model.saved.presets.map((p) => p.name + ' | Factory menu ' + D.menu(p.values) + ' | colors unconfirmed') : ['No presets; capture vehicle state below']);
            }
            if (visible.DETAIL) {
                text('DETAIL_NAME', current ? current.name + ' | Factory menu ' + D.menu(current.values) : 'Preset no longer exists');
                text('DETAIL_RESULT', result);
            }
            if (draft) {
                text('EDIT_SUMMARY', 'Draft: ' + draft.name + ' | Factory menu ' + D.menu(draft.values));
                text('EDIT_MENU', 'Choose factory menu: ' + D.menu(draft.values));
                text('EDIT_RESULT', result);
                text('NAME_PREVIEW', draft.name.padEnd(24, ' ').slice(0, namePosition) + '[' +
                    (draft.name.padEnd(24, ' ')[namePosition] === ' ' ? '_' : draft.name[namePosition]) + ']' +
                    draft.name.padEnd(24, ' ').slice(namePosition + 1) + ' | position ' + (namePosition + 1) + '/24');
            }
            if (visible.MODES) {
                rows('MODE_LIST', Object.values(D.MODES).map((m) => {
                    const p = model.saved.presets.find((v) => v.id === model.mappings.mappings[m]);
                    return (model.currentMode === m ? '* ' : '') + labelMode(m) + ': ' + (p ? p.name : 'Leave unchanged');
                }));
                text('MODE_LAST', 'Last applied mapping: ' + (model.lastMapping || 'None this session'));
                text('MODE_RESULT', result);
            }
            if (visible.MAPPING) {
                text('MAPPING_TITLE', labelMode(mappingMode));
                mappingRows = [null].concat(model.saved.presets.map((p) => p.id));
                rows('MAPPING_LIST', ['Leave unchanged'].concat(model.saved.presets.map((p) => p.name + ' | Factory menu ' + D.menu(p.values))));
            }
            if (visible.LIGHTING) {
                text('LIGHT_RAW', 'Reported payload: ' + (model.raw ? JSON.stringify(model.raw) : 'Unavailable'));
                text('LIGHT_SOURCE', Object.keys(model.links).map((k) => k + ': ' + model.links[k].detail).join(' | '));
                text('LIGHT_RESULT', result);
            }
            if (visible.PREFERENCES) {
                text('PREF_ENABLE', 'Automation: ' + (model.settings.automation ? 'On' : 'Off'));
                text('PREF_IMMEDIATE', 'Apply current mapping when enabled: ' + (model.settings.applyOnEnable ? 'Yes' : 'No'));
                text('PREF_BACKGROUND', 'Allow automation while hidden: ' + (model.settings.background ? 'Yes (experimental)' : 'No'));
                text('PREF_RESULT', result + (errors ? ' | ' + errors : ''));
            }
            if (visible.HISTORY) {
                text('HISTORY_TEXT', model.history.length ? model.history.map((h) =>
                    new Date(h.at).toISOString() + ' | ' + h.preset + ' | ' + h.source + ' | ' + h.state +
                    (h.error ? ': ' + h.error : ' | menu ' + h.menu)).join('\n') : 'No changes requested this session');
            }
        }
        bind('HOME_PRESETS', () => show('PRESETS'));
        bind('HOME_MODES', () => show('MODES'));
        bind('HOME_SETTINGS', () => show('LIGHTING'));
        bind('HOME_PREFERENCES', () => show('PREFERENCES'));
        bind('HOME_HISTORY', () => show('HISTORY'));
        bind('HOME_TOGGLE', () => model.configure('automation'));
        bind('HOME_RETRY', () => { model.reset('Services reconnecting'); services.retry(); });
        bind('PRESET_LIST', (ev) => {
            if (!presetRows[ev.row]) return;
            selected = presetRows[ev.row]; return show('DETAIL');
        });
        bind('PRESET_CAPTURE', async () => {
            await services.read('lighting');
            const p = model.capture(); selected = p.id; return show('DETAIL');
        });
        bind('PRESET_NEW', () => edit({ id: 'p-' + Date.now().toString(36) + '-' + (++model.request),
            name: 'New preset', backend: 'legacy', values: { [D.MENU]: 5 } }));
        bind('DETAIL_APPLY', () => model.apply(find(), 'manual'));
        bind('DETAIL_EDIT', () => { if (find()) return edit(find()); });
        bind('DETAIL_DUPLICATE', () => {
            if (!find()) return;
            const p = D.clone(find()); p.id = 'p-' + Date.now().toString(36) + '-' + (++model.request);
            p.name = (p.name.slice(0, 19) + ' copy'); return edit(p);
        });
        bind('DETAIL_DELETE', () => show('DELETE'));
        bind('DELETE_CONFIRM', () => { model.remove(selected); selected = null; return show('PRESETS'); });
        bind('DELETE_CANCEL', () => show('DETAIL'));
        bind('EDIT_NAME', () => show('NAME'));
        bind('EDIT_MENU', () => {
            rows('MENU_LIST', Array.from({ length: 12 }, (_, i) => 'Factory menu ' + (i + 1) + ' | physical colors unconfirmed'));
            return show('MENU_PICK');
        });
        bind('MENU_LIST', (ev) => {
            if (draft && Number.isInteger(ev.row) && ev.row >= 0 && ev.row < 12) draft.values[D.MENU] = ev.row + 1;
            return show('EDITOR');
        });
        bind('EDIT_SAVE', () => {
            if (!draft) throw new Error('Open a preset to edit');
            draft.name = draft.name.trim(); model.put(draft); selected = draft.id; draft = null; return show('DETAIL');
        });
        bind('EDIT_CANCEL', () => { draft = null; return show('PRESETS'); });
        bind('NAME_PREV', () => { namePosition = (namePosition + 23) % 24; });
        bind('NAME_NEXT', () => { namePosition = (namePosition + 1) % 24; });
        bind('NAME_CHAR', () => {
            rows('CHAR_LIST', characters.split('').map((c) => c === ' ' ? 'Space / erase character' : c));
            return show('CHARACTER');
        });
        bind('CHAR_LIST', (ev) => {
            if (draft && Number.isInteger(ev.row) && characters[ev.row] !== undefined) {
                const name = draft.name.padEnd(24, ' ');
                draft.name = name.slice(0, namePosition) + characters[ev.row] + name.slice(namePosition + 1);
            }
            return show('NAME');
        });
        bind('NAME_DONE', () => show('EDITOR'));
        bind('MODE_LIST', (ev) => {
            mappingMode = Object.values(D.MODES)[ev.row]; if (mappingMode) return show('MAPPING');
        });
        bind('MAPPING_LIST', (ev) => {
            if (ev.row < 0 || ev.row >= mappingRows.length) return;
            model.map(mappingMode, mappingRows[ev.row]); return show('MODES');
        });
        bind('MODE_TOGGLE', () => model.configure('automation'));
        bind('LIGHT_PRESETS', () => show('PRESETS'));
        bind('LIGHT_REFRESH', async () => { await services.read('lighting'); model.tell('Vehicle state read'); });
        bind('PREF_ENABLE', () => model.configure('automation'));
        bind('PREF_IMMEDIATE', () => model.configure('applyOnEnable'));
        bind('PREF_BACKGROUND', () => model.configure('background'));
        ['PRESETS', 'DETAIL', 'MODES', 'LIGHTING', 'PREFERENCES', 'HISTORY'].forEach((name) =>
            bind(name + '_HOME', () => show('MAIN')));
        ui.onVisible((name, on) => {
            visible[name] = on;
            model.visibility(Object.keys(visible).some((k) => visible[k]));
            refresh();
        });
        const close = () => {
            if (closed) return;
            closed = true; clearTimeout(refreshTimer); model.close(); services.close();
        };
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', close);
        process.once('exit', close);
        render(); services.start();
    },
});

'use strict';
const D = require('./domain');

const LAYOUTS = [
    { id: 'rows', state: 'UI_ROWS', label: 'Live rows', kind: 'button', mode: 'multi' },
    { id: 'columns', state: 'UI_COLUMNS', label: 'Two columns', kind: 'twocol', mode: 'multi' },
    { id: 'cards', state: 'UI_CARDS', label: 'Two-line cards', kind: 'tworow', mode: 'multi' },
    { id: 'accordion', state: 'UI_ACCORDION', label: 'Accordion', kind: 'button', mode: 'single' },
    { id: 'focus', state: 'UI_FOCUS', label: 'Focus preview', kind: 'twocol', mode: 'focus' },
    { id: 'actions', state: 'UI_ACTIONS', label: 'Action panel', kind: 'text', mode: 'actions' },
];
const GROUPS = ['ENGINE', 'MODE', 'LIGHTS', 'SERVICES'];
const LIGHT_ACTIONS = ['PRESET', 'APPLY', 'CAPTURE', 'MAP', 'FOLLOW', 'RESTORE'];
const COMMON_ACTIONS = ['NEXT', 'TEST', 'LOG', 'SPEED', 'RATE', 'PICKER', 'BACK'];
const RATINGS = ['unrated', 'like', 'mixed', 'dislike'];
const REFRESH_RATES = [1000, 500, 200];
const FILE = 'lab-ui-trials.json';

function value(number, unit, decimals) {
    return (D.number(number) ? number.toFixed(decimals || 0) : '--') + unit;
}
function layoutById(id) { return LAYOUTS.find((layout) => layout.id === id); }

class LiveUi {
    constructor(ui, lab, store) {
        this.ui = ui; this.lab = lab; this.store = store;
        const saved = store.load(FILE, {}) || {};
        this.lastLayout = layoutById(saved.lastLayout) ? saved.lastLayout : 'rows';
        this.preset = ['A', 'B', 'C'].includes(saved.selectedPreset) ? saved.selectedPreset : 'A';
        this.refreshMs = REFRESH_RATES.includes(saved.refreshMs) ? saved.refreshMs : 500;
        this.ratings = {};
        LAYOUTS.forEach((layout) => {
            const rating = saved.ratings && saved.ratings[layout.id];
            this.ratings[layout.id] = RATINGS.includes(rating) ? rating : 'unrated';
        });
        this.sessions = Array.isArray(saved.sessions) ? saved.sessions.slice(-40) : [];
        this.active = null; this.session = null; this.closed = false;
        this.labels = {}; this.visibility = {}; this.enabledState = {}; this.configured = {};
        this.expanded = {}; this.focusGroup = 'LIGHTS'; this.showFields = false;
        this.timer = null; this.lastRefresh = 0;
    }
    start(bind) {
        const action = (name, fn, layout) => bind(name, (event) => {
            if (this.session && layout && this.active === layout) this.session.actions++;
            return fn(event);
        });
        action('OPEN_LIVE_UI', () => this.openChooser());
        action('UI_RESUME', () => this.openLayout(layoutById(this.lastLayout)));
        action('UI_CHOOSER_BACK', () => this.ui.open('SECTIONS'));
        LAYOUTS.forEach((layout) => {
            const prefix = layout.state + '_';
            action('UI_PICK_' + layout.id.toUpperCase(), () => this.openLayout(layout));
            const callbacks = {
                NEXT: () => this.openLayout(LAYOUTS[(LAYOUTS.indexOf(layout) + 1) % LAYOUTS.length]),
                PRESET: () => {
                    this.preset = ['A', 'B', 'C'][(['A', 'B', 'C'].indexOf(this.preset) + 1) % 3];
                    this.persist(); return this.render(layout);
                },
                APPLY: () => this.lab.apply(this.preset),
                CAPTURE: () => this.lab.capture(this.preset),
                MAP: () => this.lab.assign(this.preset),
                FOLLOW: () => this.lab.setFollow(!this.lab.follow),
                RESTORE: () => this.lab.restore(),
                TEST: () => this.lab.tell(layout.label + ': test action received', 'good'),
                LOG: () => {
                    this.persist();
                    this.lab.settings.set('logging', !this.lab.logger.enabled);
                },
                SPEED: () => {
                    this.refreshMs = REFRESH_RATES[(REFRESH_RATES.indexOf(this.refreshMs) + 1) % REFRESH_RATES.length];
                    this.persist(); return this.render(layout);
                },
                RATE: () => {
                    this.ratings[layout.id] = RATINGS[(RATINGS.indexOf(this.ratings[layout.id]) + 1) % RATINGS.length];
                    this.lab.record('ui trial', layout.label + ': ' + this.ratings[layout.id]);
                    this.persist(); return this.render(layout);
                },
                PICKER: () => this.openChooser(),
                BACK: () => { this.finishSession(); return this.ui.open('SECTIONS'); },
            };
            LIGHT_ACTIONS.concat(COMMON_ACTIONS).forEach((key) => action(prefix + key, callbacks[key], layout));
            const controls = LIGHT_ACTIONS.concat(COMMON_ACTIONS);
            if (layout.mode !== 'actions') {
                GROUPS.forEach((group) => action(prefix + group, () => this.toggle(layout, group), layout));
                controls.push.apply(controls, GROUPS);
            }
            controls.forEach((key) => {
                const component = this.ui.comp(prefix + key);
                if (!component || !component.on) return;
                component.on('focus', (event) => {
                    if (this.closed || this.active !== layout || !this.session ||
                        !event || (event.value !== true && event.focus !== true)) return;
                    if (this.session.lastFocus !== key) {
                        this.session.focusChanges++; this.session.lastFocus = key;
                    }
                    if (layout.mode === 'focus' && GROUPS.includes(key) && this.focusGroup !== key) {
                        this.focusGroup = key;
                        this.render(layout);
                    }
                });
            });
        });
        this.ui.onVisible((state, visible) => {
            if (this.closed) return;
            const layout = LAYOUTS.find((candidate) => candidate.state === state);
            if (!layout) { if (state === 'UI_LAYOUTS' && visible) this.renderChooser(); return; }
            if (visible) {
                if (this.active !== layout) {
                    this.finishSession();
                    this.active = layout; this.lastLayout = layout.id;
                    this.session = { layout: layout.id, startedAt: this.lab.now(), actions: 0, focusChanges: 0, lastFocus: '' };
                    this.lab.record('ui trial', 'Opened ' + layout.label);
                    this.persist();
                }
                this.render(layout);
            } else if (this.active === layout) this.finishSession();
        });
        this.timer = setInterval(() => {
            if (this.closed || this.lab.now() - this.lastRefresh < this.refreshMs) return;
            this.lastRefresh = this.lab.now();
            if (this.active && this.ui.isVisible(this.active.state)) this.render(this.active);
            if (this.ui.isVisible('UI_LAYOUTS')) this.renderChooser();
        }, 100);
        if (this.timer.unref) this.timer.unref();
    }
    text(name, text, cell) {
        const key = name + ':' + (cell || 'Text');
        text = String(text);
        if (this.labels[key] === text) return Promise.resolve();
        this.labels[key] = text;
        return this.ui.text(name, text, 0, cell);
    }
    visible(name, on) {
        on = !!on;
        if (this.visibility[name] === on) return Promise.resolve();
        this.visibility[name] = on;
        return this.ui.visible(name, on);
    }
    enabled(name, on) {
        on = !!on;
        if (this.enabledState[name] === on) return Promise.resolve();
        this.enabledState[name] = on;
        return this.ui.enabled(name, on);
    }
    summary() {
        const s = this.lab.sensors;
        return this.lab.mode.label + ' | ' + value(s.rpm, ' rpm') + ' | Oil ' + value(s.oil, ' C');
    }
    groups() {
        const lab = this.lab, s = lab.sensors, colour = lab.current(), values = colour && colour.values || {};
        const services = Object.keys(lab.services).map((key) => lab.services[key]);
        const status = (key) => lab.services[key] ? lab.services[key].status : 'waiting';
        const battery = s.battery == null || s.battery === 255 ? '--' : String(s.battery);
        const shortColour = !colour ? 'Waiting' : colour.backend === 'profile' ? 'Profile ' + values.currentLightProfileId
            : values.statusMenuAmbientePanoramicRoofInteriorLighting !== undefined ? 'Menu ' + values.statusMenuAmbientePanoramicRoofInteriorLighting
                : values.statusHueInteriorLighting !== undefined ? 'Hue ' + values.statusHueInteriorLighting : 'Layers available';
        return {
            ENGINE: {
                label: 'Engine', value: value(s.rpm, ' rpm'),
                detail: 'Oil ' + value(s.oil, ' C') + ' | Coolant ' + value(s.coolant, ' C') +
                    ' | Speed ' + value(s.speed, ' km/h', 1) + ' | Battery condition (raw) ' + battery,
                fields: { rpm: s.rpm, oil: s.oil, coolant: s.coolant, speed: s.speed, battery: s.battery },
            },
            MODE: {
                label: 'Drive mode', value: lab.mode.label,
                detail: 'Sport=' + lab.settings.get('mapSport') + ' | Comfort=' + lab.settings.get('mapComfort') +
                    ' | Eco=' + lab.settings.get('mapEco') + ' | Recent: ' + (lab.modeHistory.slice(0, 3).map((mode) => mode.label).join(' / ') || 'Waiting'),
                fields: lab.modeRaw,
            },
            LIGHTS: {
                label: 'Lighting', value: shortColour, detail: D.lightSummary(colour),
                fields: lab.lightRaw[lab.backend()] || {},
            },
            SERVICES: {
                label: 'Services', value: services.filter((service) => service.status === 'live').length + '/' + services.length + ' live',
                detail: 'Mode ' + status('mode') + ' | Lighting ' + status(lab.backend()) +
                    ' | Controller ' + status('touchpad') + ' | Display relay ' + status('relay'),
                fields: services.map((service) => ({ name: service.label, state: service.status, detail: service.detail })),
            },
        };
    }
    async configure(layout) {
        if (this.configured[layout.id]) return;
        const controls = LIGHT_ACTIONS.concat(COMMON_ACTIONS, layout.mode === 'actions' ? [] : GROUPS);
        await Promise.all(controls.map((key) => {
            const component = this.ui.comp(layout.state + '_' + key);
            if (!component) throw new Error('Missing Live UI control: ' + key);
            return component.setProperty('Focusable', 3, 'UInt');
        }));
        this.configured[layout.id] = true;
    }
    async openLayout(layout) {
        if (!layout || this.closed) return;
        if (!this.expanded[layout.id]) this.expanded[layout.id] = { ENGINE: true };
        await this.configure(layout);
        await this.render(layout);
        return this.ui.open(layout.state);
    }
    async openChooser() {
        await this.renderChooser();
        return this.ui.open('UI_LAYOUTS');
    }
    renderChooser() {
        const updates = [this.text('UI_LAYOUTS_TITLE', 'Live UI | ' + this.summary())];
        updates.push(this.text('UI_RESUME', 'Resume: ' + layoutById(this.lastLayout).label));
        LAYOUTS.forEach((layout, index) => {
            updates.push(this.text('UI_PICK_' + layout.id.toUpperCase(),
                (index + 1) + '. ' + layout.label + ' | ' + this.ratings[layout.id]));
        });
        return Promise.all(updates);
    }
    toggle(layout, group) {
        if (layout.mode === 'focus') {
            this.focusGroup = group; this.showFields = !this.showFields;
        } else {
            const expanded = this.expanded[layout.id] || {};
            const on = !expanded[group];
            this.expanded[layout.id] = layout.mode === 'single' ? {} : expanded;
            this.expanded[layout.id][group] = on;
        }
        this.lab.record('ui trial', layout.label + ': selected ' + group);
        return this.render(layout);
    }
    render(layout) {
        if (this.closed) return Promise.resolve();
        const prefix = layout.state + '_', groups = this.groups(), updates = [];
        const expanded = this.expanded[layout.id] || {};
        updates.push(this.text(layout.state + '_TITLE', layout.label + ' | ' + this.summary()));
        GROUPS.forEach((key) => {
            const group = groups[key];
            const marker = layout.mode === 'focus' || layout.mode === 'actions' ? '' : expanded[key] ? '[-] ' : '[+] ';
            if (layout.kind === 'twocol') {
                updates.push(this.text(prefix + key, marker + group.label, 'Text1stCol'));
                updates.push(this.text(prefix + key, group.value, 'Text2ndCol'));
            } else if (layout.kind === 'tworow') {
                updates.push(this.text(prefix + key, marker + group.label, 'Text1stRow'));
                updates.push(this.text(prefix + key, group.value, 'Text2ndRow'));
            } else updates.push(this.text(prefix + key, marker + group.label + ' | ' + group.value));
            updates.push(this.text(prefix + key + '_DETAIL', group.detail));
            updates.push(this.visible(prefix + key + '_DETAIL',
                layout.mode !== 'focus' && layout.mode !== 'actions' && expanded[key]));
        });
        const focused = groups[this.focusGroup];
        const preview = this.showFields ? JSON.stringify(focused.fields) : focused.detail;
        updates.push(this.text(prefix + 'PREVIEW', focused.label + ': ' + String(preview == null ? 'Waiting for data' : preview).slice(0, 240)));
        updates.push(this.visible(prefix + 'PREVIEW', layout.mode === 'focus'));
        const lightingOpen = layout.mode === 'focus' || layout.mode === 'actions' || !!expanded.LIGHTS;
        LIGHT_ACTIONS.forEach((key) => updates.push(this.visible(prefix + key, lightingOpen)));
        const preset = this.lab.presets[this.preset];
        updates.push(this.text(prefix + 'PRESET', 'Selected preset: ' + this.preset + ' | press to cycle A / B / C'));
        updates.push(this.text(prefix + 'APPLY', 'Apply preset ' + this.preset + (preset ? '' : ' (empty)')));
        updates.push(this.text(prefix + 'CAPTURE', 'Capture current colour into preset ' + this.preset));
        updates.push(this.text(prefix + 'MAP', 'Assign ' + this.preset + ' to current mode: ' + (this.lab.mode.family || 'unsupported')));
        updates.push(this.text(prefix + 'FOLLOW', 'Mode-linked lighting: ' + (this.lab.follow ? 'ON' : 'OFF') + ' | press to toggle'));
        updates.push(this.text(prefix + 'RESTORE', 'Restore original lighting'));
        updates.push(this.enabled(prefix + 'APPLY', !!preset && !this.lab.busy));
        updates.push(this.enabled(prefix + 'CAPTURE', !!this.lab.current() && !this.lab.busy));
        updates.push(this.enabled(prefix + 'MAP', !!preset && !!this.lab.mode.family));
        updates.push(this.enabled(prefix + 'RESTORE', !!this.lab.baselines[this.lab.backend()] && !this.lab.busy));
        updates.push(this.text(prefix + 'STATUS', this.store.error ||
            (this.lab.busy ? this.lab.writeResult.text : this.lab.notice.text)));
        updates.push(this.text(prefix + 'TEST', 'Test action | ' + (this.session && this.active === layout ? this.session.actions : 0) + ' actions'));
        updates.push(this.text(prefix + 'LOG', 'Event log: ' + (this.lab.logger.enabled ? 'ON' : 'OFF') + ' | press to toggle'));
        updates.push(this.text(prefix + 'SPEED', 'Live refresh: ' + (1000 / this.refreshMs) + '/second | press to change'));
        updates.push(this.text(prefix + 'RATE', 'Preference: ' + this.ratings[layout.id] + ' | press to rate this layout'));
        updates.push(this.text(prefix + 'NEXT', 'Next layout: ' + LAYOUTS[(LAYOUTS.indexOf(layout) + 1) % LAYOUTS.length].label));
        return Promise.all(updates);
    }
    finishSession() {
        if (!this.session) return;
        const layout = this.active, endedAt = this.lab.now();
        this.sessions.push(Object.assign({}, this.session, {
            endedAt, elapsedMs: Math.max(0, endedAt - this.session.startedAt), rating: this.ratings[layout.id],
        }));
        this.sessions = this.sessions.slice(-40);
        this.active = null; this.session = null;
        this.lab.record('ui trial', 'Closed ' + layout.label);
        this.persist();
    }
    persist() {
        const sessions = this.sessions.slice();
        if (this.session) sessions.push(Object.assign({}, this.session, {
            endedAt: null, elapsedMs: Math.max(0, this.lab.now() - this.session.startedAt),
            rating: this.ratings[this.active.id],
        }));
        if (!this.store.save(FILE, {
            revision: 1, updatedAt: this.lab.now(), lastLayout: this.lastLayout,
            selectedPreset: this.preset, refreshMs: this.refreshMs, ratings: this.ratings, sessions: sessions.slice(-40),
        })) this.lab.tell(this.store.error || 'Could not save Live UI ratings', 'error');
    }
    close() {
        if (this.closed) return;
        if (this.timer) clearInterval(this.timer);
        this.finishSession(); this.persist(); this.closed = true;
    }
}
module.exports = { LiveUi };

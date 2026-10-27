'use strict';
const D = require('./domain');

class Lighting {
    constructor(store, changed) {
        this.store = store; this.changed = changed; this.closed = false; this.api = null;
        this.settings = store.load('settings.json', { schemaVersion: 1, automation: false, applyOnEnable: false, background: false },
            (s) => ['automation', 'applyOnEnable', 'background'].every((k) => typeof s[k] === 'boolean'));
        this.saved = store.load('presets.json', { schemaVersion: 1, presets: [5, 8, 12].map((n) => ({
            id: 'menu-' + n, name: 'Factory menu ' + n, backend: 'legacy', values: { [D.MENU]: n },
        })) }, (s) => Array.isArray(s.presets) && s.presets.length <= 100 && s.presets.every(D.preset) &&
            new Set(s.presets.map((p) => p.id)).size === s.presets.length);
        this.mappings = store.load('mode-mappings.json', { schemaVersion: 1, mappings: {} },
            (s) => s.mappings && typeof s.mappings === 'object' && !Array.isArray(s.mappings) &&
                Object.keys(s.mappings).every((k) => Object.values(D.MODES).includes(k) &&
                    (s.mappings[k] === null || typeof s.mappings[k] === 'string')));
        this.links = {}; this.currentMode = null; this.modeAt = 0; this.raw = null; this.lightAt = 0;
        this.pending = null; this.queuedMode = null; this.active = null; this.lastMapping = ''; this.suspended = '';
        this.visible = false; this.visibilityTimer = null; this.epoch = 0; this.request = 0;
        this.status = 'Ready; waiting for vehicle state'; this.history = [];
        this.timer = setInterval(() => this.changed(), 2000);
        if (this.timer.unref) this.timer.unref();
    }
    tell(text) { this.status = text; this.changed(); }
    save(name, value) { this.store.save(name, value); }
    configure(key) {
        const next = D.clone(this.settings); next[key] = !next[key];
        this.save('settings.json', next); this.settings = next;
        if (key === 'automation') {
            this.suspended = '';
            if (next.automation && next.applyOnEnable) this.follow();
        }
        if (key === 'background' && !next.background && !this.visible) this.reset('Automation paused while hidden');
        this.tell('Preference saved');
    }
    connection(key, available, detail) {
        const was = this.links[key] && this.links[key].available;
        this.links[key] = { available, detail };
        if (!available || !was) {
            if (key === 'mode') { this.currentMode = null; this.modeAt = 0; }
            else { this.raw = null; this.lightAt = 0; this.active = null; }
            this.reset(available ? 'Reconnected; reading current state' : detail);
        }
        this.changed();
    }
    reset(reason) {
        this.epoch++; this.queuedMode = null;
        if (this.pending) this.pending.cancelled = reason;
        this.active = null;
    }
    readError(key, detail) {
        if (this.links[key]) this.links[key].detail = 'Read failed: ' + detail;
        if (key === 'mode') { this.currentMode = null; this.modeAt = 0; }
        else { this.raw = null; this.lightAt = 0; }
        this.reset(detail); this.changed();
    }
    receive(key, raw) {
        if (this.closed) return;
        const now = Date.now();
        if (key === 'mode') {
            const next = D.mode(raw);
            const previous = this.currentMode;
            const fresh = now - this.modeAt < 10000;
            this.currentMode = next; this.modeAt = now;
            // First observation, invalid data and reconnection establish a baseline only.
            if (next && previous && fresh && previous !== next) {
                if (this.pending) {
                    this.pending.cancelled = 'Driving mode changed during apply';
                    this.queuedMode = next;
                }
                this.suspended = '';
                if (this.settings.automation) this.follow();
            }
        } else {
            this.raw = raw && typeof raw === 'object' ? D.clone(raw) : null; this.lightAt = now;
            if (this.active && D.menu(this.raw) !== this.active.menu) {
                this.active = null; this.suspended = 'Vehicle lighting changed outside this app; waiting for next mode transition';
                this.status = this.suspended;
            }
        }
        this.changed();
    }
    visibility(visible) {
        clearTimeout(this.visibilityTimer);
        // Native screen transitions can briefly report no visible state.
        this.visibilityTimer = setTimeout(() => {
            const resumed = visible && !this.visible;
            this.visible = visible;
            if (!visible && !this.settings.background) this.reset('App hidden');
            if (resumed) {
                this.currentMode = null; this.modeAt = 0; this.raw = null; this.lightAt = 0;
                ['mode', 'lighting'].forEach((k) => this.api.read(k).catch(() => {}));
            }
            this.changed();
        }, 200);
    }
    reason() {
        if (!this.settings.automation) return 'Disabled';
        if (this.suspended) return this.suspended;
        if (!this.visible && !this.settings.background) return 'Paused while app is hidden';
        if (!this.links.mode || !this.links.mode.available || !this.currentMode || Date.now() - this.modeAt >= 10000) return 'Waiting for fresh driving mode';
        if (!this.links.lighting || !this.links.lighting.available || !this.raw || Date.now() - this.lightAt >= 10000) return 'Waiting for fresh lighting';
        return 'Enabled; waiting for next mode transition';
    }
    follow() {
        if (this.reason() !== 'Enabled; waiting for next mode transition') return;
        const id = this.mappings.mappings[this.currentMode];
        if (!id) return;
        const p = this.saved.presets.find((v) => v.id === id);
        if (!p) { this.suspended = 'Mapped preset is missing'; this.tell(this.suspended); return; }
        if (this.pending) { this.tell('Mode mapping skipped: another change is pending'); return; }
        this.apply(p, 'automatic');
    }
    async apply(p, source) {
        if (this.pending) { this.tell('A change is already pending'); return; }
        if (!D.preset(p)) { this.tell('Preset is invalid'); return; }
        const work = { id: ++this.request, epoch: this.epoch, mode: this.currentMode, cancelled: '', menu: D.menu(p.values) };
        this.pending = work; this.active = null;
        this.tell('Pending: ' + p.name);
        const alive = () => {
            if (this.closed || work.cancelled || work.epoch !== this.epoch) throw new Error(work.cancelled || 'Connection changed');
            if (source === 'automatic' && (work.mode !== this.currentMode || this.reason() !== 'Enabled; waiting for next mode transition')) {
                throw new Error('Automation conditions changed');
            }
        };
        try {
            alive();
            await this.api.read('lighting'); alive();
            // Finish any in-flight pre-write read before requesting confirmation.
            const result = await this.api.write(D.command(work.menu)); alive();
            if (result === false || result && result.success === false) throw new Error('Vehicle rejected request');
            let confirmed = false;
            for (let i = 0; i < 4; i++) {
                await new Promise((resolve) => setTimeout(resolve, 350));
                alive();
                const raw = await this.api.read('lighting'); alive();
                if (D.menu(raw) === work.menu) { confirmed = true; break; }
            }
            if (!confirmed) throw new Error('Menu readback did not match; no retry will be sent');
            this.active = { id: p.id, name: p.name, menu: work.menu, source };
            if (source === 'automatic') this.lastMapping = work.mode + ' -> ' + p.name;
            this.status = 'Applied: ' + p.name + ' (' + source + ', confirmed menu readback)';
            this.history.unshift({ at: Date.now(), preset: p.name, source, state: 'applied', menu: work.menu });
        } catch (e) {
            this.suspended = 'Automatic writes suspended until the next mode transition or re-enable';
            this.status = 'Failed: ' + e.message;
            this.history.unshift({ at: Date.now(), preset: p.name, source, state: 'failed', error: e.message });
        } finally {
            this.history.length = Math.min(this.history.length, 20);
            this.pending = null;
            const queued = this.queuedMode; this.queuedMode = null;
            if (!this.closed) {
                if (queued && queued === this.currentMode && this.settings.automation) {
                    this.suspended = '';
                    this.follow();
                }
                this.changed();
            }
        }
    }
    put(p) {
        if (!D.preset(p)) throw new Error('Name or menu value is invalid');
        const next = D.clone(this.saved), i = next.presets.findIndex((v) => v.id === p.id);
        if (i < 0) {
            if (next.presets.length >= 100) throw new Error('Preset limit reached (100)');
            next.presets.push(D.clone(p));
        } else next.presets[i] = D.clone(p);
        this.save('presets.json', next); this.saved = next; this.tell('Preset saved');
    }
    capture() {
        if (!this.raw || Date.now() - this.lightAt >= 10000 || D.menu(this.raw) === null) throw new Error('No fresh supported factory menu to capture');
        const p = { id: 'p-' + Date.now().toString(36) + '-' + (++this.request), name: 'Captured menu ' + D.menu(this.raw),
            backend: 'legacy', values: D.clone(this.raw), capturedAt: Date.now() };
        this.put(p); return p;
    }
    remove(id) {
        if (this.pending) throw new Error('Wait for the pending change');
        const next = D.clone(this.saved); next.presets = next.presets.filter((p) => p.id !== id);
        // Dangling mappings remain visibly unassigned, even if a later mapping save fails.
        this.save('presets.json', next); this.saved = next;
        const maps = D.clone(this.mappings);
        Object.keys(maps.mappings).forEach((k) => { if (maps.mappings[k] === id) maps.mappings[k] = null; });
        this.save('mode-mappings.json', maps); this.mappings = maps;
        if (this.active && this.active.id === id) this.active = null;
        this.tell('Preset deleted; vehicle lighting left unchanged');
    }
    map(mode, id) {
        if (!Object.values(D.MODES).includes(mode) || id !== null && !this.saved.presets.some((p) => p.id === id)) throw new Error('Invalid mapping');
        const next = D.clone(this.mappings); next.mappings[mode] = id;
        this.save('mode-mappings.json', next); this.mappings = next; this.tell('Mapping saved; applies on next mode transition');
    }
    close() {
        this.closed = true; this.reset('App closed');
        clearInterval(this.timer); clearTimeout(this.visibilityTimer);
    }
}
module.exports = { Lighting };

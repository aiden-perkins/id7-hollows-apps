'use strict';
const fs = require('fs');
const path = require('path');
const D = require('./catalog');

class Lighting {
    constructor(ctx, changed) {
        this.ctx = ctx; this.changed = changed;
        this.file = path.join(ctx.dataDir, 'mode-colors.json');
        this.enabled = false; this.mappings = {}; this.mode = null; this.color = null;
        this.lightState = null; this.notice = ''; this.result = ''; this.closed = false;
        this.connections = {}; this.revision = 0; this.pending = false; this.busy = false;
        try {
            const saved = JSON.parse(fs.readFileSync(this.file, 'utf8'));
            D.MODES.forEach((mode) => {
                const value = saved.mappings && saved.mappings[mode.name];
                if (D.COLORS.some((color) => color.value === value)) this.mappings[mode.name] = value;
            });
            this.enabled = saved.enabled === true;
        } catch (error) {
            if (error.code !== 'ENOENT') this.notice = 'Saved settings could not be read; following is disabled: ' + error.message;
        }
    }
    save(enabled, mappings) {
        const temporary = this.file + '.tmp';
        fs.writeFileSync(temporary, JSON.stringify({ enabled, mappings }, null, 2));
        fs.renameSync(temporary, this.file);
        this.enabled = enabled; this.mappings = mappings; this.notice = '';
    }
    assign(mode, value) {
        if (!D.MODES.some((entry) => entry.name === mode)) throw new Error('Unknown driving mode');
        if (value !== undefined && !D.COLORS.some((entry) => entry.value === value)) throw new Error('Unknown color');
        const mappings = Object.assign({}, this.mappings);
        if (value === undefined) delete mappings[mode]; else mappings[mode] = value;
        this.save(this.enabled, mappings);
        if (this.mode && this.mode.name === mode) this.request();
        this.changed();
    }
    enable(on) {
        if (on && !Object.keys(this.mappings).length) throw new Error('Choose a driving mode and assign a color first');
        if (!on) {
            // Stop queued work even if persisting the disabled preference fails.
            this.enabled = false; this.revision++; this.pending = false; this.desiredKey = null;
        }
        try { this.save(on, this.mappings); }
        catch (error) {
            throw new Error(on ? 'Could not save Enable: ' + error.message :
                'Following stopped for this session, but Disable could not be saved: ' + error.message);
        }
        this.result = ''; this.request(); this.changed();
    }
    status() {
        if (this.notice) return this.notice;
        if (!this.enabled) return this.busy ? 'Disabled - a color request already sent may still complete' :
            'Disabled - choose a mode to assign a color; lighting is left unchanged';
        if (this.ctx.preview) return 'Enabled (preview only) - no vehicle requests are sent';
        if (!this.offered('mode')) return 'Enabled - waiting for the driving-mode provider';
        if (!this.mode) return 'Enabled - waiting for a valid current driving mode';
        if (!this.offered('light')) return 'Enabled - waiting for the ambient-light provider';
        if (this.mappings[this.mode.name] === undefined) return 'Enabled - ' + this.mode.label + ' has no color assigned; lighting unchanged';
        if (this.busy) return 'Applying ' + D.colorLabel(this.mappings[this.mode.name]) + ' for ' + this.mode.label;
        return (this.result || 'Enabled - waiting to apply color') +
            ((this.lightState === 'AUS' || this.lightState === 0) ? ' | Vehicle ambient lighting is switched off' : '');
    }
    offered(key) { const c = this.connections[key]; return !!(c && c.available && c.ready && !this.closed); }
    valid(c) { return !this.closed && this.connections[c.key] === c; }
    receive(c, raw) {
        if (!this.valid(c) || !c.available) return;
        c.sequence++;
        if (c.key === 'mode') {
            const mode = D.drivingMode(raw);
            if (this.mode !== mode) { this.mode = mode; this.result = ''; this.request(); }
        } else {
            this.color = D.reportedColor(raw);
            this.lightState = raw && raw.statusModeAmbientePanoramicRoofInteriorLighting;
            if (this.requested && this.mode === this.requested.mode) {
                this.result = this.color === this.requested.value ?
                    'Following ' + this.mode.label + ' - vehicle reports ' + D.colorLabel(this.color) :
                    'Requested ' + D.colorLabel(this.requested.value) + ' for ' + this.mode.label + '; vehicle has not confirmed it';
            }
        }
        this.changed();
    }
    async read(c) {
        if (!this.offered(c.key) || c.reading) return;
        c.reading = true;
        const epoch = c.epoch, sequence = c.sequence;
        try {
            const raw = await c.proxy.getValue(c.field, 1800);
            // A newer notification wins over a getter that was already in flight.
            if (this.valid(c) && c.available && c.epoch === epoch && c.sequence === sequence) this.receive(c, raw);
        } catch (error) {
            if (this.valid(c) && c.epoch === epoch && c.sequence === sequence) {
                if (c.key === 'mode') { this.mode = null; this.request(); }
                else { this.color = null; this.lightState = null; }
                this.changed();
            }
            this.ctx.log.warn(c.field + ': ' + error.message);
        } finally { c.reading = false; }
    }
    async open(key, iface, field) {
        const c = { key, field, proxy: null, ready: false, available: false, epoch: 0, sequence: 0, reading: false };
        this.connections[key] = c;
        try {
            c.proxy = await this.ctx.signals.proxy(iface, '1');
            if (!this.valid(c)) { this.shutdown(c); return; }
            await this.ctx.signals.onAvailable(c.proxy, (available) => {
                if (!this.valid(c) || c.available === available) return;
                c.available = available; c.epoch++; this.revision++;
                if (key === 'mode') this.mode = null;
                else { this.color = null; this.lightState = null; }
                this.result = '';
                if (available && c.ready) this.read(c);
                this.request();
                this.changed();
            });
            await this.ctx.signals.on(c.proxy, field, (raw) => this.receive(c, raw), this.ctx.log);
            if (!this.valid(c)) { this.shutdown(c); return; }
            c.ready = true;
            if (c.available) { await this.read(c); this.request(); }
        } catch (error) {
            c.available = false;
            this.notice = 'Vehicle connection failed: ' + error.message;
            this.ctx.log.warn(this.notice); this.shutdown(c); this.changed();
        }
    }
    async start() {
        if (this.ctx.preview || !this.ctx.signals || !this.ctx.signals.hasNative()) {
            if (!this.ctx.preview) this.notice = 'Native vehicle connection unavailable';
            this.changed(); return;
        }
        await Promise.all([
            this.open('mode', D.FES, D.MODE_FIELD),
            this.open('light', D.LIGHT, D.COLOR_FIELD)
        ]);
        if (this.closed) return;
        // Subscriptions stay active when the menu is hidden. Getters cover missing notifications.
        this.timer = setInterval(() => {
            Object.keys(this.connections).forEach((key) => { this.read(this.connections[key]); });
        }, 2000);
    }
    request() {
        const key = JSON.stringify([this.enabled, this.mode && this.mode.name,
            this.mode && this.mappings[this.mode.name], this.offered('mode'), this.offered('light'),
            this.connections.mode && this.connections.mode.epoch, this.connections.light && this.connections.light.epoch]);
        if (key === this.desiredKey) return;
        this.desiredKey = key; this.requested = null; this.result = '';
        this.revision++; this.pending = true;
        this.drain().catch((error) => { this.notice = error.message; this.changed(); });
    }
    async drain() {
        if (this.busy || this.closed) return;
        this.busy = true;
        try {
            while (this.pending && !this.closed) {
                this.pending = false;
                const mode = this.mode, c = this.connections.light;
                const value = mode && this.mappings[mode.name], revision = this.revision;
                if (!this.enabled || this.ctx.preview || !mode || value === undefined ||
                    !this.offered('mode') || !this.offered('light')) continue;
                const epoch = c.epoch;
                const current = () => !this.closed && this.enabled && this.revision === revision &&
                    this.mode === mode && this.offered('mode') && this.offered('light') && c.epoch === epoch;
                this.result = ''; this.changed();
                try {
                    // signals.set queues native calls; recheck at dispatch, not only when enqueueing.
                    const guarded = { setValue: (field, payload, timeout) => {
                        if (!current()) throw new Error('Color request superseded before dispatch');
                        return c.proxy.setValue(field, payload, timeout);
                    } };
                    await this.ctx.signals.set(guarded, 'ambientLightInteriorColour', D.colorRequest(value), 2000);
                    if (!current()) continue;
                    this.requested = { mode, value };
                    this.result = 'Requested ' + D.colorLabel(value) + ' for ' + mode.label + '; awaiting vehicle readback';
                    const raw = await c.proxy.getValue(D.COLOR_FIELD, 1800);
                    if (!current()) continue;
                    this.receive(c, raw);
                } catch (error) {
                    if (current()) this.result = 'Color request not confirmed: ' + error.message + '. Disable/enable to try again.';
                    this.ctx.log.warn('Ambient color: ' + error.message);
                }
            }
        } finally { this.busy = false; this.changed(); }
    }
    shutdown(c) {
        if (c.proxy && c.proxy.shutdown) Promise.resolve().then(() => c.proxy.shutdown()).catch((error) => this.ctx.log.warn(error));
    }
    close() {
        if (this.closed) return;
        this.closed = true; this.revision++; this.pending = false;
        clearInterval(this.timer);
        Object.keys(this.connections).forEach((key) => this.shutdown(this.connections[key]));
    }
}
module.exports = { Lighting };

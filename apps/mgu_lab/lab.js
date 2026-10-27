'use strict';
const EventEmitter = require('events');
const D = require('./domain');

function emptyInput() {
    return { actions: 0, focusEvents: 0, touchEvents: 0, keyEvents: 0, clockwise: 0, counterclockwise: 0,
        focused: '--', lastKey: '--', lastAction: '--', touch: null, trail: [], raw: null, wheel: '--' };
}
class Lab extends EventEmitter {
    constructor(options) {
        super();
        this.settings = options.settings; this.store = options.store; this.logger = options.logger;
        this.now = options.now || Date.now; this.delay = options.delay || ((ms) => new Promise((r) => setTimeout(r, ms)));
        this.preview = !!options.preview; this.api = null; this.closed = false; this.followTimer = null; this.followPending = false;
        const saved = this.store.load('lab-presets.json', {});
        this.presets = {};
        ['A', 'B', 'C'].forEach((k) => { if (D.checkedSnapshot(saved[k])) this.presets[k] = saved[k]; });
        this.services = {};
        this.inputs = emptyInput(); this.mode = D.modeOf(null); this.modeRaw = null; this.modeAt = 0; this.modeHistory = [];
        this.lights = { legacy: null, profile: null }; this.lightRaw = {}; this.baselines = {};
        this.follow = false; this.busy = false; this.events = []; this.sensors = {}; this.readings = {}; this.readErrors = {}; this.readLogAt = {};
        this.notice = { text: 'Ready', tone: 'normal' }; this.writeResult = { state: 'idle', text: 'No lighting command sent' };
        this.started = this.now(); this.visible = false; this.visibleAt = this.now(); this.hiddenModeChanges = 0;
    }
    changed() { this.emit('change'); }
    record(kind, text, raw) {
        const ev = { at: this.now(), kind, text };
        if (raw !== undefined) ev.raw = raw;
        this.events.unshift(ev); if (this.events.length > 50) this.events.length = 50;
        if (this.logger) this.logger.add(ev);
        this.changed();
    }
    tell(text, tone) { this.notice = { text, tone: tone || 'normal' }; this.record('result', text); }
    service(key, label, status, detail) {
        const old = this.services[key] || {};
        this.services[key] = Object.assign({}, old, { key, label, status, detail: detail || '', changed: this.now() });
        if (old.status !== status || old.detail !== (detail || '')) this.record('service', label + ': ' + status + (detail ? ' / ' + detail : ''));
    }
    visibility(visible) {
        if (this.visible === visible) return;
        this.visible = visible; this.visibleAt = this.now();
        this.record('visibility', visible ? 'App visible' : 'App hidden');
    }
    native(kind, name, payload) {
        if (kind === 'focus') {
            this.inputs.focusEvents++;
            if (payload && (payload.value === true || payload.focus === true)) this.inputs.focused = name;
        } else { this.inputs.actions++; this.inputs.lastAction = name; }
        this.inputs.raw = payload || {};
        this.record('native ' + kind, name, payload);
    }
    clearInput() { this.inputs = emptyInput(); this.tell('Input counters cleared'); }
    receive(key, field, value) {
        const id = key + '.' + field, previous = this.readings[id];
        this.readings[id] = { value, at: this.now(), samples: (previous ? previous.samples : 0) + 1 };
        delete this.readErrors[id];
        const experimental = ['exterior', 'lamps', 'fuel', 'fuelEstimate', 'tpms', 'tpmsInternal', 'pedal', 'steering', 'steeringChassis', 'braking', 'gps'];
        if (experimental.includes(key) && (!this.readLogAt[id] || this.now() - this.readLogAt[id] >= 5000)) {
            this.readLogAt[id] = this.now(); this.record('vehicle data', id, value);
        }
        const svc = this.services[key];
        if (svc) { svc.last = this.now(); svc.samples = (svc.samples || 0) + 1; }
        if (key === 'mode') {
            const m = D.modeOf(value && value.actualValueModeDrivingExperience);
            const changed = this.mode.raw !== m.raw;
            this.modeRaw = value; this.mode = m; this.modeAt = this.now();
            if (changed) {
                if (!this.visible) this.hiddenModeChanges++;
                this.modeHistory.unshift({ at: this.now(), label: m.label, raw: m.raw, hidden: !this.visible });
                this.modeHistory.length = Math.min(12, this.modeHistory.length);
                this.record('mode', m.label + (this.visible ? '' : ' (app hidden)'), value);
                if (this.follow && m.valid) this.scheduleFollow();
            }
        } else if (key === 'legacy' || key === 'profile') {
            const s = D.snapshot(key, value);
            const previous = this.lights[key];
            this.lights[key] = s; this.lightRaw[key] = value;
            if (s && !this.baselines[key]) {
                this.baselines[key] = D.clone(s);
                this.store.save('lab-original-lighting.json', this.baselines);
            }
            if (JSON.stringify(previous) !== JSON.stringify(s)) this.record('lighting', D.lightSummary(s), value);
        } else if (key === 'engine') {
            if (field === 'statusEngineSpeed2') this.sensors.rpm = scale(value && value.actualValueRPMEngineCrankshaft, 65535, 0.25, 0);
            if (field === 'statusEngineTemperature') {
                this.sensors.coolant = scale(value && value.temperatureEngineDrive, 255, 1, -48);
                this.sensors.oil = scale(value && value.temperatureEngineOilDrive, 255, 1, -48);
            }
            if (field === 'statusBattery2') this.sensors.battery = value && value.conditionBatteryChargingCondition;
        } else if (key === 'vehicle') {
            if (field === 'statusCarSpeed2') this.sensors.speed = scale(value && value.speedVehicleCentreOfGravity, 65535, 0.015625, 0);
            else this.sensors.headlights = value;
        } else if (key === 'gps') this.sensors.gps = value;
        else if (key === 'wheel') {
            this.inputs.wheel = field.replace(/^status/, '') + ': ' + JSON.stringify(value);
            this.record('steering wheel', field, value);
        } else if (key === 'touchpad') {
            if (!this.closed && this.api && this.api.relayWanted) {
                const data = D.controllerTouchOf(field, value);
                if (data && data.fingers.length) this.touchData(data, { field, value });
            }
        } else if (key === 'relay') {
            if (field === 'onTouchInput') this.touch(value);
            else if (field === 'onKeyInput') this.key(value);
            else this.record('relay', 'Status ' + String(value), value);
        }
        this.changed();
    }
    touch(value) { this.touchData(D.touchOf(value), value); }
    touchData(data, value) {
        this.inputs.touchEvents++; this.inputs.touch = data; this.inputs.raw = value;
        data.fingers.forEach((f) => this.inputs.trail.push(Object.assign({ at: this.now(), source: data.source }, f)));
        this.inputs.trail = this.inputs.trail.slice(-240);
        this.record('touch', data.source + ' / ' + data.fingers.length + ' finger(s)', value);
    }
    key(value) {
        this.inputs.keyEvents++; this.inputs.raw = value;
        D.keysOf(value).forEach((k) => {
            this.inputs.lastKey = k.key + ' / ' + k.state;
            // Count steps, not key-release notifications.
            if (k.state === 'PRESSED' || k.state === 'LONG PRESS') {
                if (k.key === 'CLOCKWISE') this.inputs.clockwise++;
                if (k.key === 'COUNTERCLOCKWISE') this.inputs.counterclockwise++;
            }
            this.record('controller', this.inputs.lastKey, value);
        });
    }
    backend() {
        const wanted = this.settings.get('lightApi');
        if (wanted === 'legacy' || wanted === 'profile') return wanted;
        return this.lights.legacy ? 'legacy' : this.lights.profile ? 'profile' : 'legacy';
    }
    current() { return this.lights[this.backend()]; }
    async capture(slot) {
        if (this.busy) return this.tell('Lighting command in progress', 'warn');
        if (!['A', 'B', 'C'].includes(slot)) return;
        try {
            const backend = this.backend();
            const raw = await this.api.readLighting(backend);
            const s = D.snapshot(backend, raw);
            if (!s) throw new Error('Car has not reported a valid colour');
            const saved = Object.assign({}, s, { capturedAt: this.now() });
            const next = Object.assign({}, this.presets); next[slot] = saved;
            if (!this.store.save('lab-presets.json', next)) throw new Error(this.store.error || 'Preset could not be saved');
            this.presets = next; this.tell('Captured preset ' + slot + ': ' + D.lightSummary(s), 'good');
        } catch (e) { this.tell('Capture: ' + e.message, 'error'); }
    }
    assign(slot) {
        if (!this.presets[slot]) return this.tell('Capture this preset first', 'warn');
        if (!this.mode.valid || !this.mode.family) return this.tell('Current mode has no Sport / Comfort / Eco family', 'warn');
        this.settings.set('map' + this.mode.family, slot);
        this.tell(this.mode.family + ' now uses preset ' + slot, 'good');
        if (this.follow) this.scheduleFollow();
    }
    remove(slot) {
        const next = Object.assign({}, this.presets); delete next[slot];
        if (!this.store.save('lab-presets.json', next)) return this.tell(this.store.error, 'error');
        this.presets = next;
        ['Sport', 'Comfort', 'Eco'].forEach((k) => { if (this.settings.get('map' + k) === slot) this.settings.set('map' + k, 'none'); });
        this.tell('Deleted preset ' + slot);
    }
    async apply(slot) {
        if (!this.presets[slot]) return this.tell('Preset ' + slot + ' is empty', 'warn');
        return this.write(this.presets[slot], 'Preset ' + slot);
    }
    async write(target, label) {
        if (this.busy) return this.tell('Lighting command in progress', 'warn');
        target = D.checkedSnapshot(target);
        if (!target) return this.tell('Invalid captured preset', 'error');
        this.busy = true;
        this.writeResult = { state: 'pending', text: 'Reading current colour...' }; this.changed();
        try {
            const before = await this.api.readLighting(target.backend);
            if (!D.snapshot(target.backend, before)) throw new Error('No valid live lighting state');
            this.writeResult = { state: 'pending', text: 'Sending ' + label + '...' }; this.changed();
            await this.api.writeLighting(target.backend, D.command(target));
            this.writeResult = { state: 'accepted', text: 'Command accepted; checking status...' }; this.changed();
            let matched = false, readError = '';
            for (let attempt = 0; attempt < 4; attempt++) {
                await this.delay(200);
                try { matched = D.matches(target, await this.api.readLighting(target.backend)); }
                catch (e) { readError = e.message; }
                if (matched) break;
            }
            this.writeResult = matched
                ? { state: 'matched', text: label + ': reported colour matches' }
                : { state: 'unconfirmed', text: label + ': sent, status not confirmed' + (readError ? ' / ' + readError : '') };
            this.tell(this.writeResult.text, matched ? 'good' : 'warn');
            if (!matched && this.follow) { this.follow = false; this.record('follow', 'Disabled after unconfirmed write'); }
        } catch (e) {
            this.follow = false;
            this.writeResult = { state: 'error', text: label + ': ' + e.message };
            this.tell(this.writeResult.text, 'error');
        } finally {
            this.busy = false; this.changed();
            if (this.followPending && this.follow) { this.followPending = false; this.scheduleFollow(); }
        }
    }
    async restore() {
        this.setFollow(false);
        const original = this.baselines[this.backend()];
        if (!original) return this.tell('Original colour has not been received in this run', 'warn');
        return this.write(original, 'Original');
    }
    setFollow(on) {
        if (this.followTimer) { clearTimeout(this.followTimer); this.followTimer = null; }
        this.followPending = false;
        if (!on) { this.follow = false; this.tell('Mode-linked lighting off'); return; }
        this.follow = true; this.tell('Mode-linked lighting on');
        this.scheduleFollow();
    }
    scheduleFollow() {
        if (this.closed || !this.follow) return;
        if (this.busy) { this.followPending = true; return; }
        if (this.followTimer) clearTimeout(this.followTimer);
        this.followTimer = setTimeout(() => {
            this.followTimer = null;
            if (this.closed || !this.follow || !this.mode.valid || !this.mode.family) return;
            const slot = this.settings.get('map' + this.mode.family);
            if (!this.presets[slot]) { this.tell('No preset assigned to ' + this.mode.family, 'warn'); return; }
            this.apply(slot);
        }, 180);
    }
    close() {
        this.closed = true; this.follow = false;
        if (this.followTimer) clearTimeout(this.followTimer);
        if (this.logger) this.logger.close();
    }
}
function scale(raw, invalid, factor, offset) { return D.number(raw) && raw !== invalid ? raw * factor + offset : null; }
module.exports = { Lab, emptyInput };

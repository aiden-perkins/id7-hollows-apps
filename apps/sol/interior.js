'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const { Lights } = require('./lights');
const { BUSES, releaseFrame } = require('./lin');
const { Others } = require('./others');
const { hsv } = require('./scenes');
const { presetFor } = require('./presets');

const MODES = [['sport', 'Sport'], ['comfort', 'Comfort'], ['eco', 'Eco Pro']];
const EFFECTS = [
    ['sportFlash', 'Sport mode flash', 'Red when you switch to Sport'],
    ['shiftFlash', 'Shift indicator', 'Reads the shift cue from Redline'],
    ['rainbow', 'RGB rainbow', 'Cycles through the color spectrum'],
    ['speed', 'Speed-based color', 'Blue at rest, red at 75 mph'],
    ['turnGlow', 'Turn signal glow', 'Green on the signaling side'],
    ['doorRed', 'Open door red', 'Red on the open door'],
    ['hazardRed', 'Hazard red', 'Red pulses while hazards are on'],
];
const FLASH_FILE = process.env.MGU_AMBIENT_FLASH || '/dev/shm/mgu-ambient-flash.json';
const DEFAULT_RGB = [120, 60, 255];
const RED = [255, 0, 0], GREEN = [0, 230, 60];
const clamp = (value, max) => Math.max(0, Math.min(max, Math.round(value)));
const readRgb = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite) ? value.map((v) => clamp(v, 255)) : null;

function loadProfile(saved) {
    const value = saved && typeof saved === 'object' ? saved : {};
    const profile = {
        enabled: value.enabled === true,
        preset: presetFor(value.preset) ? value.preset : null,
        rgb: readRgb(value.rgb) || DEFAULT_RGB.slice(),
        brightness: Number.isFinite(value.brightness) ? clamp(value.brightness, 100) : 80,
        follow: value.follow === true,
        effect: ['rainbow', 'speed'].indexOf(value.effect) >= 0 ? value.effect : null,
        modes: {},
    };
    for (const [name] of EFFECTS) if (name !== 'rainbow' && name !== 'speed') profile[name] = value[name] === true;
    for (const [name] of MODES) {
        const color = value.modes && value.modes[name];
        profile.modes[name] = presetFor(color) ? color : readRgb(color);
    }
    return profile;
}

class CabinLights extends Lights {
    constructor(diag, log, vehicle) {
        super({ diag, log });
        this.vehicle = vehicle;
    }

    at(light, scene, elapsed) {
        const active = scene || this.scene;
        if (!active || active.kind !== 'speed') return super.at(light, active, elapsed);
        const kmh = this.vehicle.speed();
        const rgb = kmh === null ? active.upper.rgb : hsv(220 * (1 - Math.min(1, kmh / 120)), 1, 1);
        const color = { rgb, bright: active.upper.bright };
        return super.at(light, { kind: 'solid', upper: color, lower: color }, elapsed);
    }

    async find() {
        await this.hold('discovery', true);
        try {
            await super.find();
            if (!this.lights.length || this.blind) return this.lights;

            // Some body controllers accept a bus broadcast even if its lamp inventory is silent.
            // Return it to factory control once to check whether the same broadcast is available.
            for (let bus = 0; bus < BUSES.length; bus++) {
                if (!this.vehicle.occupied() || this.vehicle.factoryAmbient === false || !this.diag.available) break;
                if (this.lights.some((light) => light.bus === bus)) continue;
                const data = releaseFrame(bus, 0);
                const echo = (r) => r[0] === 0x6e && r[1] === data[0] && r[2] === data[1] || r[0] === 0x7f && r[1] === 0x2e;
                const reply = await this.diag.physical(this.bdc, 0x2e, data, 1500, echo, { maxRetries: 0 }).catch(() => null);
                if (reply && reply[0] === 0x6e) {
                    this.lights.push({ bus, nad: 0, name: 'Cabin bus ' + (bus + 1), part: 'upper', x: 0.5, y: 0.5, blind: true });
                    this.log.info('Sol cabin: broadcast available on bus ' + (bus + 1));
                }
            }
            this.redraw();
            return this.lights;
        } finally {
            this.hold('discovery', false);
        }
    }

    _plan(elapsed) {
        // A whole-cabin scene reaches the entire bus even if its inventory only lists one lamp.
        if (!this.scene || this._own.size || (this._overs && this._overs.size)) return super._plan(elapsed);
        const plan = [];
        for (let bus = 0; bus < BUSES.length; bus++) {
            const lights = this.lights.filter((light) => light.bus === bus);
            if (lights.length) plan.push({ lights, need: lights, want: this.at(lights[0], null, elapsed), nad: 0 });
        }
        return plan;
    }
}

function doorFor(light) {
    if (!/\bdoor\b/i.test(light.name)) return null;
    const side = /^(driver|passenger)\b/i.exec(light.name);
    return side ? side[1].toLowerCase() + (light.y < 0.5 ? ' front' : ' rear') : null;
}

class Interior extends EventEmitter {
    constructor(ctx, diag, vehicle) {
        super();
        this.log = ctx.log;
        this.settings = ctx.settings;
        this.diag = diag;
        this.vehicle = vehicle;
        this.lights = new CabinLights(diag, ctx.log, vehicle);
        this.comfort = new Others({ log: ctx.log }).start();
        this.profile = loadProfile(this.settings.get('solProfile'));
        this.sceneKey = '';
        this.overlayKey = '';
        this.shiftAt = 0;
        this.cue = null;
        this.mode = null;
        this.scan = null;
        this.scanAfter = 0;
        this.changed = () => this.emit('change');
        this.lights.on('change', this.changed);
        const syncComfort = () => {
            this.lights.hold('comfort', this.comfort.comfort);
            this.changed();
        };
        this.comfort.on('change', syncComfort);
        syncComfort();
    }

    save() {
        if (!this.saveTimer) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
        this.settings.set('solProfile', this.profile);
    }

    update() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.save(), 400);
        this.changed();
    }

    setFollow(follow) { this.profile.follow = follow; this.update(); }
    setBrightness(brightness) {
        this.profile.brightness = clamp(brightness, 100);
        this.update();
    }

    setColor(color, mode) {
        if (mode) this.profile.modes[mode] = color;
        else {
            this.profile.enabled = Array.isArray(color);
            if (this.profile.enabled) this.profile.rgb = color;
            else this.profile.preset = color;
            this.profile.effect = null;
        }
        if (presetFor(color)) this.vehicle.retryAmbientPreset();
        this.update();
    }

    baseColor() { return this.profile.enabled ? this.profile.rgb : this.profile.preset; }

    effectOn(effect) {
        return effect === 'rainbow' || effect === 'speed' ? this.profile.effect === effect : this.profile[effect] === true;
    }

    toggleEffect(effect) {
        const on = !this.effectOn(effect);
        if (effect === 'rainbow' || effect === 'speed') this.profile.effect = on ? effect : null;
        else this.profile[effect] = on;
        if (!on && this.cue && this.cue.source === effect) this.cue = null;
        this.update();
    }

    shift(now) {
        if (!this.profile.shiftFlash) return;
        try {
            const stat = fs.statSync(FLASH_FILE);
            if (stat.mtimeMs <= this.shiftAt || now - stat.mtimeMs > 1800 || stat.size > 256) return;
            this.shiftAt = stat.mtimeMs;
            const cue = JSON.parse(fs.readFileSync(FLASH_FILE, 'utf8'));
            const rgb = readRgb(cue.rgb);
            const expiry = stat.mtimeMs + Math.max(1000, Math.min(3000, Number(cue.ms) || 1200));
            if (rgb && expiry > now) this.cue = { rgb, expiry, source: 'shiftFlash' };
        } catch (e) { /* Redline has no shift cue yet. */ }
    }

    cabinBlocked() {
        if (this.comfort.comfort) return 'IterioDev Comfort is controlling the cabin';
        if (!this.vehicle.occupied()) return 'Waiting for an active vehicle';
        if (this.vehicle.factoryAmbient === false) return 'Turn on ambient lighting in iDrive';
        return null;
    }

    blocked() { return this.cabinBlocked() || (!this.diag.available ? 'Diagnostic link unavailable' : null); }

    activeModeColor() { return this.profile.follow && this.profile.modes[this.vehicle.mode]; }

    targetColor() { return this.activeModeColor() || this.baseColor(); }

    refresh(exteriorBusy) {
        const now = Date.now(), state = this.profile, vehicle = this.vehicle;
        const canWrite = !this.blocked();
        if (!canWrite) this.cue = null;
        else {
            if (state.sportFlash && this.mode && this.mode !== 'sport' && vehicle.mode === 'sport') {
                this.cue = { rgb: RED, expiry: now + 1600, source: 'sportFlash' };
            }
            this.shift(now);
            if (this.cue && this.cue.expiry <= now) this.cue = null;
        }
        this.mode = vehicle.mode;
        this.lights.dim(this.settings.get('nightDim') === true && vehicle.night ? 0.5 : 1);

        const target = this.targetColor();
        const customColor = Array.isArray(target);
        const preset = presetFor(target);
        const kind = state.effect === 'speed' && vehicle.speed() === null ? 'solid' : state.effect || 'solid';
        const custom = canWrite && (customColor || kind !== 'solid');
        const color = { rgb: customColor ? target : state.rgb, bright: state.brightness };
        const scene = custom ? { kind, upper: color, lower: color, speed: 2 } : null;
        const key = JSON.stringify(scene);
        if (key !== this.sceneKey) {
            this.sceneKey = key;
            if (scene) this.lights.show(scene);
            else this.lights.carColour();
        }
        const byMode = !!presetFor(this.activeModeColor());
        vehicle.updateAmbientPreset(preset ? preset[0] : null, byMode, exteriorBusy || !!this.cabinBlocked());

        const hazard = canWrite && state.hazardRed && vehicle.turn === 'both';
        const turn = canWrite && state.turnGlow && !hazard ? vehicle.turn : null;
        const doors = canWrite && state.doorRed ? vehicle.doors : [];
        const cue = canWrite ? this.cue : null;
        const rightHandDrive = this.settings.get('drive') === 'rhd';
        const overlayKey = JSON.stringify([hazard, turn, doors, cue, rightHandDrive, state.brightness]);
        if (overlayKey !== this.overlayKey) {
            this.overlayKey = overlayKey;
            const side = turn && ((turn === 'left') !== rightHandDrive ? 'left' : 'right');
            const matchTurn = (light) => turn === 'both' ? light.x <= 0.15 || light.x >= 0.85 : side === 'left' ? light.x <= 0.15 : light.x >= 0.85;
            const matchDoor = (light) => doors.indexOf(doorFor(light)) >= 0;
            const primary = (match, light) => match(light) && (/ door (line|top)$/i.test(light.name) ||
                !this.lights.lights.some((other) => match(other) && / door (line|top)$/i.test(other.name)));
            const blink = (rgb) => (ms, on) => ({ rgb, bright: on ? state.brightness : 0 });
            this.lights.overlay('turn', turn ? (light) => primary(matchTurn, light) : null, blink(GREEN));
            this.lights.overlay('doors', doors.length ? (light) => primary(matchDoor, light) : null, blink(RED));
            this.lights.overlay('hazard', hazard ? () => true : null, (ms, on) => ({ rgb: RED, bright: on ? state.brightness : state.brightness * 0.15 }));
            this.lights.overlay('cue', cue ? () => true : null, () => ({ rgb: cue.rgb, bright: state.brightness }));
            this.changed();
        }

        if (canWrite && !exteriorBusy && (scene || hazard || turn || doors.length || cue)) this.find();
    }

    find() {
        if (this.blocked() || this.lights.lights.length || this.scan || Date.now() < this.scanAfter) return;
        this.scan = Promise.resolve().then(() => this.lights.find()).catch((e) => this.log.warn('Sol cabin scan: ' + e)).then(() => {
            this.scan = null;
            this.scanAfter = Date.now() + 60000;
            this.changed();
        });
        this.changed();
        return this.scan;
    }

    status() {
        const blocked = this.cabinBlocked();
        if (blocked) return blocked;
        const state = this.profile, target = this.targetColor(), preset = presetFor(target);
        if (!state.effect && preset) {
            if (!this.vehicle.ambientAvailable()) return 'iDrive preset control unavailable';
            if (this.vehicle.ambientError) return 'iDrive preset request failed';
            if (this.vehicle.ambientSlot === preset[0]) return 'iDrive reports ' + preset[1];
            if (this.vehicle.ambientSentAt && Date.now() - this.vehicle.ambientSentAt > 4000) return 'iDrive has not confirmed ' + preset[1];
            return 'Requesting ' + preset[1];
        }
        if (!Array.isArray(target) && !state.effect && !this.lights.scene) return 'iDrive controls cabin lighting';
        if (!this.diag.available) return 'Diagnostic link unavailable';
        if (this.scan) return 'Finding cabin lights';
        if (this.lights.state === 'none') return 'No compatible cabin lights detected';
        if (this.lights.error) return 'Cabin light controller is not responding';
        if (this.profile.effect === 'speed' && this.vehicle.speed() === null) return 'Waiting for vehicle speed';
        if (!this.lights.scene) return 'iDrive controls cabin lighting';
        if (this.lights.scene.kind === 'rainbow') return 'RGB rainbow active';
        if (this.lights.scene.kind === 'speed') return 'Speed-based color active';
        const mapped = this.activeModeColor() && MODES.find(([mode]) => mode === this.vehicle.mode);
        return mapped ? mapped[1] + ' color active' : 'Cabin color active';
    }

    stop() {
        this.save();
        this.comfort.stop();
        for (const key of ['cue', 'hazard', 'doors', 'turn']) this.lights.overlay(key, null);
        this.lights.carColour();
    }
}

module.exports = { Interior, MODES, EFFECTS };

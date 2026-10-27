'use strict';
const { DEFINITIONS: VEHICLE_DEFINITIONS, ACTIONS: EXTERIOR_ACTIONS } = require('./vehicle_lab');

const DEFINITIONS = [
    { key: 'mode', label: 'Drive mode', iface: 'de.bmw.infotainment.drivingexcitement.FES', fields: ['statusFESVehicleDynamicSwitchHMI'] },
    { key: 'legacy', label: 'Legacy lighting', iface: 'de.bmw.infotainment.misc.ComfortFunctionIuK', fields: ['statusAmbientLightInteriorColour'], poll: 1500 },
    { key: 'profile', label: 'Light profiles', iface: 'de.bmw.body.interiorillumination.AmbientLight', fields: ['currentInteriorLightProfile'], poll: 1500 },
    { key: 'engine', label: 'Engine / battery', iface: 'de.bmw.infotainment.vehicle.CDS', fields: ['statusEngineSpeed2', 'statusEngineTemperature', 'statusBattery2'] },
    { key: 'vehicle', label: 'Speed / headlights', iface: 'de.bmw.infotainment.vehicle.Vehicle2', fields: ['statusCarSpeed2', 'statusLightStatus'] },
    { key: 'wheel', label: 'Steering-wheel buttons', iface: 'de.bmw.infotainment.controlelements.SteeringWheelPushButton', fields: ['statusRotaryPress', 'statusRotarySteps', 'statusAudioVolumeButton'] },
    { key: 'gps', label: 'GPS position', iface: 'de.bmw.infotainment.navigation.positioning.Positioning', instance: 'Main_Instance', fields: ['rawPositionData'] },
];
const RELAY_MANAGER = 'de.bmw.infotainment.hmi.inputrelay.InputRelayManager';
const RELAY = 'de.bmw.infotainment.hmi.inputrelay.InputRelay';
const CONTROLLER_TOUCH = { key: 'touchpad', label: 'Controller touchpad', iface: 'de.bmw.infotainment.ControllerElements',
    fields: ['ZBETouchFrontSide', 'ZBETouchRearSide'], events: ['operationZBETouch2', 'operationZBETouch3'] };

function deadline(promise, ms, label) {
    let timer;
    return Promise.race([Promise.resolve(promise), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).then((r) => { clearTimeout(timer); return r; }, (e) => { clearTimeout(timer); throw e; });
}
function pause(ms) { return new Promise((r) => setTimeout(r, ms)); }

class Services {
    constructor(ctx, lab) {
        this.ctx = ctx; this.signals = ctx.signals; this.lab = lab; this.connections = {};
        this.vehicleGroup = null; this.closed = false; this.relayWanted = false; this.relayStarting = null; this.relayId = null;
        this.relayOwner = null; this.relayStopping = null;
        this.timer = setInterval(() => {
            Object.keys(this.connections).forEach((key) => {
                const c = this.connections[key];
                if (!c.closed && c.available && c.def.poll && (!c.def.group || c.def.group === this.vehicleGroup) &&
                    Date.now() - c.fetchedAt >= c.def.poll) this.fetch(c);
            });
        }, 700);
        if (this.timer.unref) this.timer.unref();
    }
    start() { DEFINITIONS.forEach((d) => { this.open(d).catch(() => {}); }); }
    watchVehicle(group) {
        this.vehicleGroup = group;
        if (!group || this.closed) return;
        VEHICLE_DEFINITIONS.filter((def) => def.group === group).forEach((def) => {
            if (!this.connections[def.key]) this.open(def).catch((e) => this.lab.record('vehicle service', def.label + ': ' + e.message));
        });
    }
    async refreshVehicle(group) {
        this.watchVehicle(group);
        const defs = VEHICLE_DEFINITIONS.filter((def) => def.group === group);
        if (group === 'gps') defs.push(DEFINITIONS.find((def) => def.key === 'gps'));
        if (group === 'lights') defs.push(DEFINITIONS.find((def) => def.key === 'vehicle'));
        for (const def of defs) {
            if (this.closed) break;
            let c = this.connections[def.key];
            const subscriptionError = Object.keys(this.lab.readErrors).some((id) =>
                id.indexOf(def.key + '.') === 0 && this.lab.readErrors[id].indexOf('Subscribe:') === 0);
            if (c && !c.closed && (c.available !== true || subscriptionError)) { c.closed = true; this.shutdownProxy(c.proxy); }
            if (!c || c.closed) c = await this.open(def);
            await this.fetch(c);
        }
    }
    fieldError(c, field, detail) {
        if (this.closed || c.closed) return;
        const id = c.def.key + '.' + field, previous = this.lab.readErrors[id];
        this.lab.readErrors[id] = detail;
        if (previous !== detail) this.lab.record('vehicle field', id + ': ' + detail);
    }
    state(c, status, detail) {
        if (!this.closed && !c.closed) this.lab.service(c.def.key, c.def.label, status, detail);
    }
    async open(def) {
        const previous = this.connections[def.key];
        if (previous && !previous.closed && previous.proxy) return previous;
        const c = { def, proxy: null, available: null, closed: false, fetching: false, fetchedAt: 0 };
        this.connections[def.key] = c;
        this.state(c, 'connecting', def.instance || '1');
        if (this.signals.hasNative && !this.signals.hasNative()) {
            this.state(c, this.ctx.preview ? 'preview' : 'unavailable', this.ctx.preview ? 'No live car connection' : 'SOME/IP module unavailable');
            return c;
        }
        try {
            const opening = this.signals.proxy(def.iface, def.instance || '1');
            opening.then((p) => { if (c.closed || this.closed) this.shutdownProxy(p); }).catch(() => {});
            c.proxy = await deadline(opening, 5000, 'Connect');
            if (this.closed || c.closed) { this.shutdownProxy(c.proxy); return c; }
            const available = (a) => {
                if (this.closed || c.closed) return;
                c.available = !!a;
                this.state(c, a ? 'available' : 'offline', a ? 'Waiting for data' : 'Provider unavailable');
                if (a) this.fetch(c);
            };
            await deadline(this.signals.onAvailable(c.proxy, available), 2000, 'Availability subscription');
            for (const field of (def.fields || []).concat(def.events || [])) {
                if (c.closed || this.closed) break;
                try {
                    await deadline(this.signals.on(c.proxy, field, (v) => {
                        if (c.closed || this.closed) return;
                        c.available = true;
                        this.state(c, 'live', field === 'status' ? 'Relay status: ' + String(v) : 'Receiving data');
                        this.lab.receive(def.key, field, v);
                    }, this.ctx.log), 2000, field + ' subscription');
                    const id = def.key + '.' + field;
                    if ((this.lab.readErrors[id] || '').indexOf('Subscribe:') === 0) delete this.lab.readErrors[id];
                } catch (e) {
                    if (!def.optional) throw e;
                    this.fieldError(c, field, 'Subscribe: ' + e.message);
                }
            }
            if (c.available === null) this.state(c, 'waiting', 'No provider announcement yet');
            return c;
        } catch (e) {
            this.state(c, 'error', e.message || String(e));
            c.closed = true; this.shutdownProxy(c.proxy);
            return c;
        }
    }
    async fetch(c) {
        if (this.closed || c.closed || !c.proxy || c.fetching || !c.available) return;
        c.fetching = true; c.fetchedAt = Date.now();
        try {
            for (const field of c.def.fields || []) {
                if (c.closed || this.closed) break;
                try { await this.read(c, field); } catch (e) {
                    if (c.def.optional) this.fieldError(c, field, 'Read: ' + e.message);
                    else this.state(c, 'available', 'Read: ' + e.message);
                }
            }
        } finally { c.fetching = false; }
    }
    async read(c, field) {
        if (!c || c.closed || !c.proxy) throw new Error('Interface is not connected');
        if (c.available === false) throw new Error('Provider unavailable');
        const raw = await deadline(this.signals.get(c.proxy, field, 1200), 1800, 'Read');
        if (this.closed || c.closed) throw new Error('Interface closed');
        c.available = true;
        this.state(c, 'live', 'Receiving data');
        this.lab.receive(c.def.key, field, raw);
        return raw;
    }
    async readLighting(backend) {
        const c = this.connections[backend];
        return this.read(c, backend === 'profile' ? 'currentInteriorLightProfile' : 'statusAmbientLightInteriorColour');
    }
    async writeLighting(backend, value) {
        const c = this.connections[backend];
        if (!c || c.closed || !c.proxy || c.available !== true) throw new Error('Lighting provider is not available');
        return deadline(this.signals.set(c.proxy, backend === 'profile' ? 'currentInteriorLightProfile' : 'ambientLightInteriorColour', value, 2000), 2800, 'Lighting write');
    }
    async writeExterior(action) {
        if (!EXTERIOR_ACTIONS.includes(action)) throw new Error('Unknown exterior lighting action');
        const c = this.connections.exterior;
        if (this.closed || !c || c.closed || !c.proxy || c.available !== true) throw new Error('Exterior lighting provider is unavailable');
        const request = action.method ? this.signals.call(c.proxy, action.method, {}, 2000)
            : this.signals.set(c.proxy, action.field, action.value, 2000);
        return deadline(request, 2800, 'Exterior lighting command');
    }
    async startRelay() {
        if (this.relayStarting || this.relayWanted || this.closed) return;
        if (this.relayStopping) await this.relayStopping;
        this.relayWanted = true;
        this.relayStarting = this.createRelay();
        try { await this.relayStarting; } finally { this.relayStarting = null; }
    }
    async createRelay() {
        try {
            await this.open(CONTROLLER_TOUCH);
            if (!this.relayWanted || this.closed) return;
            const owner = await this.open({ key: 'relayManager', label: 'Input relay manager', iface: RELAY_MANAGER,
                instance: this.lab.settings.get('relayManager'), fields: [] });
            if (!owner.proxy || owner.closed) throw new Error('Input manager connection failed');
            this.relayOwner = owner;
            const until = Date.now() + 1600;
            while (owner.available !== true && Date.now() < until && this.relayWanted && !this.closed) await pause(80);
            if (!this.relayWanted || this.closed) return;
            if (!owner.available) throw new Error('Input manager unavailable; try another manager in Options');
            const relayId = 'mgu_lab_' + Date.now().toString(36);
            const reply = await deadline(this.signals.call(owner.proxy, 'createInputRelay', { relayId }, 2000), 2600, 'Create relay');
            const code = reply && reply.InputRelayError;
            if (code !== 0 && code !== 'STATUS_OK') throw new Error('Create relay: ' + String(code));
            this.relayId = relayId;
            if (!reply.instanceName || typeof reply.instanceName !== 'string') throw new Error('Input manager returned no instance name');
            if (!this.relayWanted || this.closed) { await this.destroyRelay(); return; }
            const relay = await this.open({ key: 'relay', label: 'Raw input relay', iface: RELAY, instance: reply.instanceName,
                fields: ['status'], events: ['onTouchInput', 'onKeyInput'] });
            if (relay.closed || !relay.proxy) throw new Error('Input relay subscription failed');
            this.lab.tell('Controller touch requested; display events depend on HMI relay routing.');
        } catch (e) {
            this.lab.service('relay', 'Raw input relay', 'error', e.message);
            this.lab.tell('Input relay: ' + e.message, 'warn');
            await this.destroyRelay();
        }
    }
    async destroyRelay() {
        const c = this.connections.relay;
        if (c) { c.closed = true; this.shutdownProxy(c.proxy); delete this.connections.relay; }
        const id = this.relayId, owner = this.relayOwner;
        this.relayId = null; this.relayOwner = null;
        if (id && owner && owner.proxy && !owner.closed) {
            try {
                await deadline(this.signals.call(owner.proxy, 'destroyInputRelay', { relayId: id }, 1200), 1700, 'Release relay');
            } catch (e) { this.lab.record('relay', 'Release: ' + e.message); }
        }
        if (owner) { owner.closed = true; this.shutdownProxy(owner.proxy); }
    }
    async stopRelay() {
        this.relayWanted = false;
        if (this.relayStopping) return this.relayStopping;
        this.relayStopping = (async () => {
            if (this.relayStarting) await this.relayStarting;
            await this.destroyRelay();
            const touchpad = this.connections.touchpad;
            if (touchpad) { touchpad.closed = true; this.shutdownProxy(touchpad.proxy); delete this.connections.touchpad; }
            if (!this.closed) {
                this.lab.service('relay', 'Raw input relay', 'idle', 'Not requested');
                this.lab.service('touchpad', 'Controller touchpad', 'idle', 'Not requested');
            }
        })();
        try { await this.relayStopping; } finally { this.relayStopping = null; }
    }
    async retry() {
        await this.stopRelay();
        Object.keys(this.connections).forEach((key) => {
            const c = this.connections[key]; c.closed = true; this.shutdownProxy(c.proxy);
        });
        this.connections = {};
        if (!this.closed) { this.start(); this.watchVehicle(this.vehicleGroup); }
    }
    shutdownProxy(p) {
        if (!p || !p.shutdown) return;
        try { Promise.resolve(p.shutdown()).catch(() => {}); } catch (e) { /* independently optional service */ }
    }
    close() {
        clearInterval(this.timer);
        this.stopRelay();
        this.closed = true;
        Object.keys(this.connections).forEach((key) => {
            if (key === 'relay' || key === 'relayManager' || key === 'touchpad') return;
            const c = this.connections[key]; c.closed = true; this.shutdownProxy(c.proxy);
        });
    }
}
module.exports = { Services, DEFINITIONS, deadline };

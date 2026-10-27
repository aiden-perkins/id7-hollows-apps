'use strict';

const DEFINITIONS = [
    { key: 'mode', iface: 'de.bmw.infotainment.drivingexcitement.FES', field: 'statusFESVehicleDynamicSwitchHMI' },
    { key: 'lighting', iface: 'de.bmw.infotainment.misc.ComfortFunctionIuK', field: 'statusAmbientLightInteriorColour' },
];
function deadline(p, ms, label) {
    let timer;
    return Promise.race([Promise.resolve(p), new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]).then((v) => { clearTimeout(timer); return v; }, (e) => { clearTimeout(timer); throw e; });
}
class Services {
    constructor(ctx, model) {
        this.ctx = ctx; this.model = model; this.signals = ctx.signals;
        this.connections = {}; this.closed = false;
        this.timer = setInterval(() => {
            Object.keys(this.connections).forEach((key) => {
                const c = this.connections[key];
                if (c.available && !c.reading) this.read(key).catch(() => {});
            });
        }, 2000);
        if (this.timer.unref) this.timer.unref();
    }
    start() { DEFINITIONS.forEach((def) => this.open(def)); }
    dispose(c) {
        c.closed = true;
        if (c.proxy && c.proxy.shutdown) Promise.resolve().then(() => c.proxy.shutdown()).catch((e) => this.ctx.log.warn(e));
    }
    async open(def) {
        const c = { def, available: false, closed: false, proxy: null, reading: null, epoch: 0 };
        this.connections[def.key] = c;
        this.model.connection(def.key, false, 'Connecting');
        if (!this.signals.hasNative()) {
            this.model.connection(def.key, false, this.ctx.preview ? 'Preview: no vehicle connection' : 'SOME/IP unavailable');
            return;
        }
        try {
            const opening = this.signals.proxy(def.iface, '1');
            opening.then((p) => { if (this.closed || c.closed) this.dispose({ proxy: p }); }).catch(() => {});
            c.proxy = await deadline(opening, 5000, 'Connect');
            if (this.closed || c.closed) return;
            await deadline(this.signals.onAvailable(c.proxy, (available) => {
                if (this.closed || c.closed) return;
                if (c.available !== available) c.epoch++;
                c.available = available;
                this.model.connection(def.key, available, available ? 'Reading vehicle' : 'Provider unavailable');
                if (available) this.read(def.key).catch(() => {});
            }), 2000, 'Availability subscription');
            await deadline(this.signals.on(c.proxy, def.field, (raw) => {
                if (this.closed || c.closed || !c.available) return;
                this.model.receive(def.key, raw);
            }, this.ctx.log), 2000, 'Field subscription');
        } catch (e) {
            if (this.closed || c.closed) return;
            this.dispose(c);
            this.model.connection(def.key, false, e.message);
        }
    }
    async read(key) {
        const c = this.connections[key];
        if (!c || c.closed || this.closed || !c.available || !c.proxy) throw new Error('Provider unavailable');
        if (c.reading) return c.reading;
        const epoch = c.epoch;
        c.reading = (async () => {
            try {
                const raw = await deadline(this.signals.get(c.proxy, c.def.field, 1200), 1800, 'Read');
                if (this.closed || c.closed || !c.available || epoch !== c.epoch) throw new Error('Connection changed');
                this.model.receive(key, raw);
                return raw;
            } catch (e) {
                if (!this.closed && !c.closed) this.model.readError(key, e.message);
                throw e;
            }
        })();
        try { return await c.reading; } finally { c.reading = null; }
    }
    async write(value) {
        const c = this.connections.lighting;
        if (this.closed || !c || c.closed || !c.available) throw new Error('Lighting provider unavailable');
        return deadline(this.signals.set(c.proxy, 'ambientLightInteriorColour', value, 2000), 2800, 'Lighting write');
    }
    retry() {
        if (this.closed) return;
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
        this.start();
    }
    close() {
        if (this.closed) return;
        this.closed = true; clearInterval(this.timer);
        Object.keys(this.connections).forEach((key) => this.dispose(this.connections[key]));
    }
}
module.exports = { Services };

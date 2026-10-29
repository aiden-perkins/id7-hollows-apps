'use strict';

// Claims belong to the drawing connection. A second RenderClient would create a
// competing surface. Isolate the known kit claim hook on this app's instance;
// keep its native bar and all BMW chrome outside our test rectangle.
class Renderer {
    constructor(ctx, emit) {
        this.ctx = ctx; this.emit = emit; this.display = ctx.display;
        this.gpu = null; this.listeners = []; this.closed = false; this.until = 0;
        this.rect = null; this.lastCapabilities = ''; this.lastClaim = null;
        this.state = { phase: 'disarmed', ready: false, touch: false, native: false,
            error: '', armedUntil: 0, ignored: 0, releaseRequested: false };
        this.original = this.display && this.display._claimTabs;
        this.supported = !!(this.display && typeof this.original === 'function');
        if (this.supported) {
            const self = this;
            this.hook = function () { this.tabs = []; self.syncClaims(); };
            this.display._claimTabs = this.hook;
        } else this.state.error = 'Runtime has no compatible display claim hook; renderer probe disabled';
    }
    foreground() {
        const ui = this.ctx.ui;
        return !!(ui.isVisible('MAIN') && typeof ui.hasFocus === 'function' && ui.hasFocus('MAIN'));
    }
    reason() {
        const d = this.display, g = this.gpu;
        if (this.closed) return 'Adapter closed';
        if (this.ctx.preview || process.env.MGU_PREVIEW || process.env.MGU_RENDERD_FILE || (g && g.opts && g.opts.file)) return 'Preview/replay is not vehicle evidence';
        if (!this.supported) return this.state.error;
        if (this.ctx.settings.get('layout') !== 'standard') return 'Standard layout required to leave native controls untouched';
        if (!g || !g.ready) return 'No ready renderer connection';
        if (!g.touch) return 'Renderer does not advertise touch routing';
        if (typeof g.claim !== 'function') return 'Renderer client lacks claim(rects)';
        if (!g.native && (g.grabbing || (g.sent && g.sent.image && g.sent.image.size))) return 'Legacy protocol has incompatible image/grab messages';
        if (!d.place || !d.active('MAIN') || !this.foreground()) return 'MAIN must be visible, focused and drawn by the renderer';
        if (g.native && g.onScreen === false) return 'Renderer reports this app is not on screen';
        return '';
    }
    attach(g) {
        if (g === this.gpu) return;
        this.disarm('Renderer connection replaced');
        this.detach(); this.gpu = g; this.lastClaim = null;
        if (!g || typeof g.on !== 'function') return;
        const on = (name, fn) => { g.on(name, fn); this.listeners.push([name, fn]); };
        on('ready', () => { this.disarm('Renderer handshake/reconnect; arm explicitly'); this.poll(); });
        on('close', () => { this.disarm('Renderer disconnected'); this.poll(); });
        on('closed', () => { this.disarm('Renderer handed gesture to stock HMI'); this.poll(); });
        on('state', () => { if (this.until && this.reason()) this.disarm(this.reason()); this.poll(); });
        on('touch', (phase, x, y) => {
            if (!this.until || Date.now() >= this.until || this.reason()) {
                this.state.ignored++; if (this.until) this.disarm('Touch arrived after ownership expired'); return;
            }
            if (![1, 2, 3].includes(phase) || typeof x !== 'number' || !isFinite(x) || typeof y !== 'number' || !isFinite(y)) {
                this.emit('renderer-invalid', { phase, x, y }); return;
            }
            this.emit('renderer-touch', { phase, x, y, receivedAt: Date.now(),
                coordinateSpace: 'canvas logical pixels', claim: Object.assign({}, this.rect) });
        });
    }
    detach() {
        if (this.gpu && typeof this.gpu.removeListener === 'function') this.listeners.forEach((p) => this.gpu.removeListener(p[0], p[1]));
        this.listeners = [];
    }
    poll() {
        if (this.closed) return;
        this.attach(this.display && this.display.gpu);
        const g = this.gpu, d = this.display;
        const capabilities = {
            ready: !!(g && g.ready), connected: !!(g && g.connected), touch: !!(g && g.ready && g.touch),
            native: !!(g && g.native), socket: g && g.path || null,
            info: g && g.info || null, screen: g && g.screen || null,
            placement: d && d.place ? Object.assign({}, d.place) : null,
            onScreen: g && g.onScreen === undefined ? null : g && g.onScreen,
            visible: this.ctx.ui.isVisible('MAIN'), focused: typeof this.ctx.ui.hasFocus === 'function' ? this.ctx.ui.hasFocus('MAIN') : null,
            blocked: !!(d && d.blocked), runtimeCompatible: this.supported,
            unavailable: this.reason()
        };
        Object.assign(this.state, capabilities);
        const key = JSON.stringify(capabilities);
        if (key !== this.lastCapabilities) { this.lastCapabilities = key; this.emit('renderer-capability', capabilities); }
        if (this.until && (Date.now() >= this.until || capabilities.unavailable)) this.disarm(capabilities.unavailable || '60-second ownership window ended');
        this.syncClaims();
    }
    arm(rect) {
        this.poll();
        const why = this.reason();
        if (why) throw new Error(why);
        if (!rect || !['x', 'y', 'w', 'h'].every((k) => typeof rect[k] === 'number' && isFinite(rect[k])) || rect.w <= 0 || rect.h <= 0) throw new Error('Invalid test rectangle');
        this.rect = Object.assign({}, rect); this.until = Date.now() + 60000;
        this.state.phase = 'armed'; this.state.armedUntil = this.until; this.state.releaseRequested = false; this.state.error = '';
        this.syncClaims();
        this.emit('renderer-arm', { until: this.until, rect: this.rect, note: 'Claim request sent; reception still requires observed touch events' });
    }
    syncClaims() {
        const g = this.gpu;
        if (!g || !g.ready || !g.touch || typeof g.claim !== 'function') return;
        const rects = this.until && Date.now() < this.until && !this.reason() ? [this.rect] : [];
        const key = JSON.stringify(rects);
        if (key === this.lastClaim && g.claimed === key) return;
        try { g.claim(rects); this.lastClaim = key; }
        catch (e) {
            this.until = 0; this.state.armedUntil = 0; this.state.phase = 'error'; this.state.error = e.message;
            this.emit('renderer-error', { error: e.message, operation: 'claim' });
        }
    }
    disarm(reason) {
        const was = !!this.until;
        this.until = 0; this.state.armedUntil = 0;
        if (this.state.phase !== 'error') this.state.phase = 'disarmed';
        if (was) {
            this.state.releaseRequested = true;
            this.emit('renderer-disarm', { reason, note: 'Empty claim requested; daemon rule removal/stock response not verified' });
        }
        this.syncClaims();
    }
    close() {
        if (this.closed) return;
        this.disarm('App shutdown'); this.closed = true; this.detach();
        if (this.supported && this.display._claimTabs === this.hook) this.display._claimTabs = this.original;
    }
}
module.exports = { Renderer };

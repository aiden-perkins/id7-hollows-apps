'use strict';
const finite = (n) => typeof n === 'number' && isFinite(n);
const bounds = () => ({ minX: null, maxX: null, minY: null, maxY: null });
function extend(b, x, y) {
    if (!finite(x) || !finite(y)) return;
    b.minX = b.minX === null ? x : Math.min(b.minX, x); b.maxX = b.maxX === null ? x : Math.max(b.maxX, x);
    b.minY = b.minY === null ? y : Math.min(b.minY, y); b.maxY = b.maxY === null ? y : Math.max(b.maxY, y);
}
class Lab {
    constructor() {
        this.page = 'overview'; this.notice = 'Park first. Start a session; probes remain disarmed until requested.';
        this.renderer = {}; this.relay = {}; this.reset();
    }
    reset() {
        this.startedAt = Date.now(); this.recent = []; this.marks = []; this.nativeActions = 0;
        this.rendererTrail = []; this.relayTrail = []; this.gesture = null; this.lastGesture = null;
        this.lastRenderer = null; this.lastRelay = null;
        this.rendererStats = { events: 0, down: 0, move: 0, up: 0, completed: 0, cancelled: 0,
            orphan: 0, invalid: 0, taps: 0, holds: 0, drags: 0, maxGapMs: 0, lastAt: null, bounds: bounds() };
        this.relayStats = { events: 0, ignored: 0, maxFingers: 0, proximityTrue: 0, invalidPoints: 0, lastAt: null, bounds: bounds() };
    }
    observe(kind, data) {
        const at = Date.now();
        if (kind === 'renderer-capability') this.renderer = Object.assign({}, this.renderer, data);
        if (kind === 'relay-state') this.relay = data;
        if (kind === 'native-action') this.nativeActions++;
        if (kind === 'operator-mark') { this.marks.push({ at, text: data.text }); if (this.marks.length > 24) this.marks.shift(); }
        if (kind === 'renderer-invalid') this.rendererStats.invalid++;
        if (kind === 'renderer-touch') this.rendererTouch(data);
        if (kind === 'relay-touch') this.relayTouch(data);
        if (kind === 'relay-ignored') this.relayStats.ignored++;
        if (kind === 'renderer-disarm' || kind === 'renderer-error') this.cancelGesture(data.reason || data.error);
        if (!['renderer-touch', 'relay-touch'].includes(kind) || !this.recent.length || at - this.recent[0].at >= 200) {
            this.recent.unshift({ at, kind, data }); if (this.recent.length > 18) this.recent.pop();
        }
    }
    rendererTouch(d) {
        const s = this.rendererStats, at = d.receivedAt;
        s.events++; s.lastAt = at;
        if (this.lastRenderer) s.maxGapMs = Math.max(s.maxGapMs, Math.max(0, at - this.lastRenderer.receivedAt));
        this.lastRenderer = d; extend(s.bounds, d.x, d.y);
        this.rendererTrail.push({ x: d.x, y: d.y, phase: d.phase, at });
        if (this.rendererTrail.length > 360) this.rendererTrail.shift();
        if (d.phase === 1) {
            s.down++;
            this.cancelGesture('New down before previous up');
            this.gesture = { startedAt: at, startX: d.x, startY: d.y, x: d.x, y: d.y, path: 0, maxDistance: 0, points: 1 };
        } else if (d.phase === 2) { s.move++; if (!this.gesture) s.orphan++; }
        else if (d.phase === 3) { s.up++; if (!this.gesture) s.orphan++; }
        const g = this.gesture;
        if (!g) return;
        if (d.phase !== 1) {
            g.path += Math.hypot(d.x - g.x, d.y - g.y); g.x = d.x; g.y = d.y; g.points++;
            g.maxDistance = Math.max(g.maxDistance, Math.hypot(d.x - g.startX, d.y - g.startY));
        }
        if (d.phase === 3) {
            const durationMs = Math.max(0, at - g.startedAt);
            const type = g.maxDistance <= 20 ? durationMs >= 600 ? 'hold' : 'tap' : 'drag';
            s.completed++; s[type + 's']++;
            this.lastGesture = Object.assign({}, g, { endedAt: at, durationMs, type }); this.gesture = null;
        }
    }
    cancelGesture(reason) {
        if (!this.gesture) return;
        this.rendererStats.cancelled++;
        this.lastGesture = Object.assign({}, this.gesture, { endedAt: Date.now(), type: 'cancelled', reason }); this.gesture = null;
    }
    relayTouch(event) {
        const raw = event.raw, d = raw && (raw.touchData || raw.TouchInputData || raw);
        if (!d || (d.touchSource !== 2 && d.touchSource !== 'TOUCH_DISPLAY')) return;
        const s = this.relayStats, fingers = Array.isArray(d.fingerData) ? d.fingerData : [];
        s.events++; s.lastAt = event.receivedAt; s.maxFingers = Math.max(s.maxFingers, fingers.length);
        if (d.proximity === true) s.proximityTrue++;
        this.lastRelay = event;
        fingers.forEach((f) => {
            if (!f || !finite(f.xCoordinate) || !finite(f.yCoordinate)) { s.invalidPoints++; return; }
            extend(s.bounds, f.xCoordinate, f.yCoordinate);
            this.relayTrail.push({ x: f.xCoordinate, y: f.yCoordinate, id: f.touchId, eventType: f.eventType, at: event.receivedAt });
            if (this.relayTrail.length > 360) this.relayTrail.shift();
        });
    }
    summary(renderer, relay) {
        return {
            observedSince: this.startedAt, page: this.page,
            renderer: { state: Object.assign({}, renderer), observations: this.rendererStats, last: this.lastRenderer, lastGesture: this.lastGesture },
            oemRelay: { state: Object.assign({}, relay), observations: this.relayStats, last: this.lastRelay },
            nativeSemanticActions: this.nativeActions, operatorMarks: this.marks.slice(),
            interpretation: {
                nativeActionsIdentifyPhysicalSource: false, oemEventTypeDecoded: false,
                rendererGestureHeuristic: 'tap/hold: maximum excursion <=20 logical px; hold receipt duration >=600ms; otherwise drag',
                rendererGap: 'Local callback receipt intervals, including inter-gesture idle; not hardware latency or packet-loss proof',
                coordinates: 'Renderer canvas logical px; OEM raw coordinates are not calibrated or mapped into canvas'
            }
        };
    }
}
module.exports = { Lab };

'use strict';

const DEFL = {
    MITTELSTELLUNG: 0, NORD_KURZ_GEDRUECKT: 1, NORD_LANG_GEDRUECKT: 2, NORD_UNWIRKSAM: 3,
    OST_KURZ_GEDRUECKT: 4, OST_LANG_GEDRUECKT: 5, OST_UNWIRKSAM: 6,
    SUED_KURZ_GEDRUECKT: 7, SUED_LANG_GEDRUECKT: 8, SUED_UNWIRKSAM: 9,
    WEST_KURZ_GEDRUECKT: 10, WEST_LANG_GEDRUECKT: 11, WEST_UNWIRKSAM: 12, SIGNAL_UNGUELTIG: 15,
};
const PUSH = { KEINE_BETAETIGUNG: 0, DREHGEBER_KURZ_GEDRUECKT: 1, DREHGEBER_LANG_GEDRUECKT: 2, UNWIRKSAM: 3, SIGNAL_UNGUELTIG: 15 };
const DIR = { 1: 'up', 2: 'up', 4: 'right', 5: 'right', 7: 'down', 8: 'down', 10: 'left', 11: 'left' };
const value = (v, names) => typeof v === 'number' ? v : names[v] === undefined ? 15 : names[v];

class Controls {
    constructor(action, softDrop, now) {
        this.action = action; this.softDrop = softDrop; this.now = now;
        this.enabled = false; this.direction = null; this.pressed = false; this.position = null;
        this.waitNeutral = false; this.repeatMs = 0; this.messageAt = 0;
        this.cyclic = false; this.same = 0; this.last = ''; this.source = null;
    }

    enable(on) {
        this.enabled = !!on;
        this.waitNeutral = !!(this.direction || this.pressed);
        this.repeatMs = 0;
        this.softDrop(false);
    }

    raw(packet, source) {
        if (!packet) return;
        const now = this.now(), deflection = value(packet.frontRotaryEncoderDeflection, DEFL);
        const button = value(packet.frontRotaryEncoderPushButton, PUSH);
        if (deflection === 15 && button === 15) {
            this.direction = null; this.pressed = false; this.position = null; this.softDrop(false); return;
        }
        const signature = JSON.stringify(packet);
        if (signature === this.last) { if (++this.same >= 5) this.cyclic = true; } else this.same = 0;
        this.last = signature; this.messageAt = now;
        const direction = DIR[deflection] || null, pressed = button === 1 || button === 2;
        let delta = 0;
        const position = packet.frontRotaryEncoderOperation;
        if (Number.isInteger(position) && position >= 0 && position < 65535) {
            if (this.position !== null && source === this.source) delta = ((position - this.position + 32768) & 0xffff) - 32768;
            this.position = position;
        } else this.position = null;
        this.source = source;
        const changed = direction !== this.direction, pressEdge = pressed && !this.pressed;
        this.direction = direction; this.pressed = pressed;
        if (!this.enabled) return;
        if (this.waitNeutral) {
            if (!direction && !pressed) this.waitNeutral = false;
            return;
        }
        if (Math.abs(delta) <= 10) for (let i = 0; i < Math.abs(delta); i++) this.action(delta < 0 ? 'left' : 'right');
        this.softDrop(direction === 'down');
        if (changed) {
            this.repeatMs = 170;
            if (direction === 'left' || direction === 'right' || direction === 'down') this.action(direction);
            if (direction === 'up') this.action('drop');
        }
        // One press edge is one rotation, even when short-press becomes long-press.
        if (pressEdge) this.action('rotate');
    }

    tick(ms) {
        if (!this.enabled || this.waitNeutral) return;
        if (this.cyclic && this.now() - this.messageAt > 1500) {
            this.direction = null; this.pressed = false; this.position = null;
            this.waitNeutral = true; this.softDrop(false); return;
        }
        if (this.direction !== 'left' && this.direction !== 'right') return;
        this.repeatMs -= ms;
        while (this.repeatMs <= 0) { this.action(this.direction); this.repeatMs += 60; }
    }
}

module.exports = { Controls };

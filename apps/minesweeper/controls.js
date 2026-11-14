'use strict';

const DEFL = {
    MITTELSTELLUNG: 0, NORD_KURZ_GEDRUECKT: 1, NORD_LANG_GEDRUECKT: 2, NORD_UNWIRKSAM: 3,
    OST_KURZ_GEDRUECKT: 4, OST_LANG_GEDRUECKT: 5, OST_UNWIRKSAM: 6,
    SUED_KURZ_GEDRUECKT: 7, SUED_LANG_GEDRUECKT: 8, SUED_UNWIRKSAM: 9,
    WEST_KURZ_GEDRUECKT: 10, WEST_LANG_GEDRUECKT: 11, WEST_UNWIRKSAM: 12, SIGNAL_UNGUELTIG: 15,
};
const PUSH = { KEINE_BETAETIGUNG: 0, DREHGEBER_KURZ_GEDRUECKT: 1, DREHGEBER_LANG_GEDRUECKT: 2, UNWIRKSAM: 3, SIGNAL_UNGUELTIG: 15 };
const DIR = { 1: 'up', 2: 'up', 4: 'right', 5: 'right', 7: 'down', 8: 'down', 10: 'left', 11: 'left' };
const value = (v, names) => typeof v === 'number' ? v : Object.prototype.hasOwnProperty.call(names, v) ? names[v] : 15;

class Controls {
    constructor(action, now) {
        this.action = action; this.now = now; this.enabled = false; this.waitNeutral = false;
        this.direction = null; this.pressed = false; this.position = null; this.source = null;
        this.repeatAt = 0; this.messageAt = 0; this.last = ''; this.same = 0; this.cyclic = false;
    }

    enable(on) {
        this.enabled = !!on;
        this.waitNeutral = !!(this.direction || this.pressed);
        this.position = null; this.repeatAt = this.now() + 300;
        // An opening HMI press must release before it can reveal or flag a cell.
        if (on) this.pressed = true;
    }

    raw(packet, source) {
        if (!packet) return;
        const deflection = value(packet.frontRotaryEncoderDeflection, DEFL);
        const button = value(packet.frontRotaryEncoderPushButton, PUSH);
        if (deflection === 15 && button === 15) {
            this.direction = null; this.pressed = false; this.position = null; this.waitNeutral = true;
            return;
        }
        const current = this.now(), signature = JSON.stringify(packet);
        if (signature === this.last) { if (++this.same >= 5) this.cyclic = true; } else this.same = 0;
        this.last = signature; this.messageAt = current;
        const heading = DIR[deflection] || null, pressed = button === 1 || button === 2;
        const tiltEdge = heading && heading !== this.direction, pressEdge = pressed && !this.pressed;
        let delta = 0;
        const position = packet.frontRotaryEncoderOperation;
        if (Number.isInteger(position) && position >= 0 && position < 65535) {
            if (this.position !== null && source === this.source) delta = ((position - this.position + 32768) & 0xffff) - 32768;
            this.position = position;
        } else this.position = null;
        this.direction = heading; this.pressed = pressed; this.source = source;
        if (!this.enabled) return;
        if (this.waitNeutral) {
            if (!heading && !pressed) this.waitNeutral = false;
            return;
        }
        const turned = delta && Math.abs(delta) <= 16;
        if (tiltEdge) { this.repeatAt = current + 300; this.action(heading); }
        if (this.enabled && turned) this.action('mode', delta);
        // Moving and pressing in one packet never opens an unintended neighboring cell.
        if (this.enabled && pressEdge && !tiltEdge && !turned) this.action('activate');
    }

    tick() {
        if (!this.enabled || this.waitNeutral) return;
        const current = this.now();
        if (this.cyclic && current - this.messageAt > 1500) {
            this.direction = null; this.pressed = false; this.position = null; this.waitNeutral = true;
            return;
        }
        if (this.direction && current >= this.repeatAt) {
            this.repeatAt = current + 90;
            this.action(this.direction);
        }
    }
}

module.exports = { Controls };

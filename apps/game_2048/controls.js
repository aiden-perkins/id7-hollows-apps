'use strict';

const { DIRECTIONS } = require('./game');
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
    constructor(action, changed) {
        this.action = action; this.changed = changed; this.selected = 'left';
        this.enabled = false; this.waitNeutral = false;
        this.direction = null; this.pressed = false; this.position = null; this.source = null;
    }

    select(heading) {
        if (DIRECTIONS.indexOf(heading) < 0 || heading === this.selected) return;
        this.selected = heading; this.changed();
    }

    enable(on) {
        this.enabled = !!on;
        this.waitNeutral = !!(this.direction || this.pressed);
        this.position = null;
        // Opening or resuming with the HMI press must not make an extra move.
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
        if (delta && Math.abs(delta) <= 16) {
            const index = DIRECTIONS.indexOf(this.selected);
            this.select(DIRECTIONS[((index + delta) % 4 + 4) % 4]);
        }
        // A simultaneous tilt and press is one move, never two.
        if (tiltEdge) { this.select(heading); this.action(heading); }
        else if (pressEdge) this.action(this.selected);
    }
}

module.exports = { Controls };

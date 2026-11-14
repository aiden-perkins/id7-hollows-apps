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
    constructor(action) {
        this.action = action; this.enabled = false; this.waitNeutral = false;
        this.direction = null; this.pressed = false; this.position = null; this.source = null;
    }

    enable(on) {
        this.enabled = !!on;
        this.waitNeutral = !!(this.direction || this.pressed);
        this.position = null;
        // The HMI press that opened the game must release before it can pause play.
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
        const turnEdge = heading && heading !== this.direction, pressEdge = pressed && !this.pressed;
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
        // Short/long states and cyclic repeats of a held tilt produce only one turn.
        if (turnEdge) this.action(heading);
        if (Math.abs(delta) <= 8) {
            for (let i = 0; this.enabled && i < Math.abs(delta); i++) this.action(delta < 0 ? 'turnLeft' : 'turnRight');
        }
        if (this.enabled && pressEdge) this.action('menu');
    }
}

module.exports = { Controls };

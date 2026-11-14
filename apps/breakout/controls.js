'use strict';

const DEFL = {
    MITTELSTELLUNG: 0, NORD_KURZ_GEDRUECKT: 1, NORD_LANG_GEDRUECKT: 2, NORD_UNWIRKSAM: 3,
    OST_KURZ_GEDRUECKT: 4, OST_LANG_GEDRUECKT: 5, OST_UNWIRKSAM: 6,
    SUED_KURZ_GEDRUECKT: 7, SUED_LANG_GEDRUECKT: 8, SUED_UNWIRKSAM: 9,
    WEST_KURZ_GEDRUECKT: 10, WEST_LANG_GEDRUECKT: 11, WEST_UNWIRKSAM: 12, SIGNAL_UNGUELTIG: 15,
};
const PUSH = { KEINE_BETAETIGUNG: 0, DREHGEBER_KURZ_GEDRUECKT: 1, DREHGEBER_LANG_GEDRUECKT: 2, UNWIRKSAM: 3, SIGNAL_UNGUELTIG: 15 };
const DIR = { 4: 1, 5: 1, 10: -1, 11: -1 };
const STEPS = { fine: 28, normal: 52, fast: 80 };
const value = (v, names) => typeof v === 'number' ? v : Object.prototype.hasOwnProperty.call(names, v) ? names[v] : 15;

class Controls {
    constructor(action, sensitivity, now) {
        this.action = action; this.sensitivity = sensitivity; this.now = now;
        this.enabled = false; this.waitNeutral = false; this.direction = 0; this.pressed = false;
        this.position = null; this.source = null; this.last = ''; this.same = 0; this.cyclic = false; this.messageAt = 0;
    }

    enable(on) {
        this.enabled = !!on;
        this.waitNeutral = !!(this.direction || this.pressed);
        this.position = null;
        // An opening HMI press must release before it can launch a ball.
        if (on) this.pressed = true;
    }

    raw(packet, source) {
        if (!packet) return;
        const deflection = value(packet.frontRotaryEncoderDeflection, DEFL);
        const button = value(packet.frontRotaryEncoderPushButton, PUSH);
        if (deflection === 15 && button === 15) {
            this.direction = 0; this.pressed = false; this.position = null; this.waitNeutral = true;
            return;
        }
        const signature = JSON.stringify(packet);
        if (signature === this.last) { if (++this.same >= 5) this.cyclic = true; } else this.same = 0;
        this.last = signature; this.messageAt = this.now();
        const pressed = button === 1 || button === 2, pressEdge = pressed && !this.pressed;
        let delta = 0;
        const position = packet.frontRotaryEncoderOperation;
        if (Number.isInteger(position) && position >= 0 && position <= 65535) {
            if (this.position !== null && source === this.source) delta = ((position - this.position + 32768) & 0xffff) - 32768;
            this.position = position;
        } else this.position = null;
        this.direction = DIR[deflection] || 0; this.pressed = pressed; this.source = source;
        if (!this.enabled) return;
        if (this.waitNeutral) {
            if (!this.direction && !pressed) this.waitNeutral = false;
            return;
        }
        if (delta && Math.abs(delta) <= 64) {
            const sensitivity = this.sensitivity();
            const step = Object.prototype.hasOwnProperty.call(STEPS, sensitivity) ? STEPS[sensitivity] : STEPS.normal;
            this.action('nudge', delta * step);
        }
        if (this.enabled && pressEdge) this.action('launch');
    }

    tick(ms) {
        if (!this.enabled || this.waitNeutral) return;
        if (this.cyclic && this.now() - this.messageAt > 1500) {
            this.direction = 0; this.pressed = false; this.position = null; this.waitNeutral = true;
            return;
        }
        if (this.direction) this.action('nudge', this.direction * 850 * ms / 1000);
    }
}

module.exports = { Controls };

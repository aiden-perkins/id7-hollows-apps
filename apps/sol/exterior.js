'use strict';

const EventEmitter = require('events');
const { Strobe, KINDS, F, statusIndex, MAX_MS, SHOW_MS } = require('./strobe');

const BDC = 0x40;
const FUNCTION_DID = [0xd5, 0x42];
const OUTPUT_MS = 3000;
const FLASH_BUDGET_MS = 120000;
const OUTPUTS = [
    [1, 'Left low beam'], [2, 'Right low beam'], [3, 'Left running light'], [4, 'Right running light'],
    [5, 'Left side marker'], [6, 'Right side marker'], [7, 'Left high beam'], [8, 'Right high beam'],
];
const FUNCTIONS = [
    ['high', 'High beams'], ['fog', 'Front fog lamps'], ['cornL', 'Left cornering'], ['cornR', 'Right cornering'],
    ['indL', 'Left indicator'], ['indR', 'Right indicator'], ['parkL', 'Left parking'], ['parkR', 'Right parking'],
    ['brake', 'Brake lamps'], ['reverse', 'Reverse lamps'], ['rearFog', 'Rear fog lamp'],
];
const PATTERNS = [
    ['strobe', 'Strobe', ['High beams flash together']],
    ['show', 'Light show', ['Cycles through the available lamps']],
    ['cop', 'Cop mode', ['High beam bursts', 'Alternate where supported']],
];

// Cleanup can return control after movement, even when it is too late to start another request.
function releases(sid, data) {
    if (sid === 0x10) return data[0] === 0x01;
    if (sid === 0x31) return data[0] === 0x02;
    if (sid === 0x2f) return data[2] === 0x00;
    return sid === 0x2e && ((data[0] === 0xd5 && data[1] === 0x42 && !data[4] && !data[5]) ||
        (data[0] === 0x45 && data[1] === 0x30 && !data[2] && !data[3] && !data[6] && !data[7]));
}

class Exterior extends EventEmitter {
    constructor(ctx, diag, vehicle, interior) {
        super();
        this.log = ctx.log;
        this.settings = ctx.settings;
        this.diag = diag;
        this.vehicle = vehicle;
        this.interior = interior;
        this.job = null;
        this.pattern = null;
        this.kind = null;
        this.outputs = [];
        this.note = '';
        this.changed = () => this.emit('change');
        this.queue = Promise.resolve();

        const guarded = {
            get available() { return diag.available; },
            on: diag.on.bind(diag), removeListener: diag.removeListener.bind(diag),
            physical: (target, sid, data, ms, accept) => this.request(target, sid, data, ms, accept),
        };
        this.strobe = new Strobe({ diag: guarded, log: ctx.log, allowed: () => this.blocked() || (this.job && this.job.cancelled ? 'stopped' : null) });
        this.strobe.on('change', this.changed);
        this.strobe.on('learned', (channels) => this.settings.set('solHighBeam', { kind: this.strobe.kind, channels }));
    }

    blocked() {
        if (this.closed) return 'Sol is closing';
        return this.vehicle.parkReason() || (!this.diag.available ? 'Diagnostic link unavailable' : null);
    }

    request(target, sid, data, ms, accept) {
        const cleanup = releases(sid, data);
        const matching = accept || ((r) => (r[0] === sid + 0x40 && r[1] === data[0] &&
            (sid === 0x10 || r[2] === data[1])) || (r[0] === 0x7f && r[1] === sid));
        const next = this.queue.then(() => {
            if (!cleanup && (this.blocked() || !this.job || this.job.cancelled)) return null;
            return this.diag.physical(target, sid, data, Math.min(ms || 1500, 2000), matching,
                { maxRetries: 0, callTimeoutMs: 1800, pendingTimeoutMs: 1800, hardTimeoutMs: 2200 });
        });
        this.queue = next.catch(() => null);
        return next;
    }

    get busy() { return !!this.job; }
    get active() { return !!(this.pattern || (this.job && this.job.kind !== 'scan')); }

    run(kind, work) {
        if (this.busy || this.blocked()) return Promise.resolve();
        const job = { kind, cancelled: false };
        this.job = job;
        this.note = '';
        const drained = this.interior.lights.hold('exterior', true);
        this.changed();
        return Promise.all([drained, this.interior.scan]).then(() => {
            if (!job.cancelled && !this.blocked()) return work(job);
        }).catch((e) => {
            this.log.warn('Sol exterior ' + kind + ': ' + e);
            this.note = 'The lamp controller did not accept the request';
            this.pattern = null;
        }).then(() => {
            this.interior.lights.hold('exterior', false);
            this.job = null;
            this.changed();
        });
    }

    detect() {
        if (this.pattern) return;
        return this.run('scan', async () => {
            this.outputs = [];
            this.kind = null;
            for (const kind of ['g05', 'bdc']) {
                const answer = await this.request(BDC, 0x22, KINDS[kind].status, 1500).catch(() => null);
                if (!answer || answer[0] !== 0x62) continue;
                const supported = OUTPUTS.filter(([id]) => {
                    const state = answer[3 + statusIndex(kind, id)];
                    return state === 0 || state === 1;
                });
                if (supported.length) { this.kind = kind; this.outputs = supported; break; }
            }
            await this.strobe.find();
            const saved = this.settings.get('solHighBeam'), head = this.strobe.head;
            if (head && saved && saved.kind === this.strobe.kind && Array.isArray(saved.channels)) {
                this.strobe.learned = saved.channels.filter((item) => item && Number.isInteger(item.ch) && item.ch >= 1 && item.ch <= head.n &&
                    Number.isInteger(item.cur) && item.cur > 0 && item.cur <= 150 && Number.isInteger(item.pwm) && item.pwm > 0 && item.pwm <= 100);
                if (this.strobe.learned.length === 0) this.strobe.learned = null;
            }
            this.note = this.kind || this.strobe.kind ? 'Lamp controller detected' : 'No compatible lamp controller answered';
        });
    }

    async inSession(work) {
        try {
            const open = await this.request(BDC, 0x10, [0x03]);
            if (!open || open[0] !== 0x50) { this.note = 'Body controller declined the lamp test'; return; }
            await work();
        } finally {
            await this.request(BDC, 0x10, [0x01]).catch(() => null);
        }
    }

    wait(job, ms) {
        if (job.cancelled || this.blocked()) return Promise.resolve();
        return new Promise((resolve) => {
            const timer = setTimeout(() => job.wake(), ms);
            job.wake = () => { clearTimeout(timer); job.wake = null; resolve(); };
        });
    }

    testOutput(id, on) {
        if (this.pattern || !this.outputs.some(([supported]) => supported === id)) return;
        const kind = this.kind;
        const { status, control } = KINDS[kind];
        return this.run('lamp', (job) => this.inSession(async () => {
            const requested = on ? 1 : 0;
            const expires = Date.now() + OUTPUT_MS;
            try {
                const reply = await this.request(BDC, 0x2f, control.concat([0x03, id, requested]));
                if (job.cancelled || this.blocked()) return;
                if (!reply || reply[0] !== 0x6f) { this.note = 'Lamp output declined the request'; return; }
                const read = await this.request(BDC, 0x22, status);
                if (job.cancelled || this.blocked()) return;
                if (!read || read[0] !== 0x62 || read[3 + statusIndex(kind, id)] !== requested) {
                    this.note = 'The lamp output did not confirm the requested state'; return;
                }
                this.note = on ? 'Lamp output reports on' : 'Lamp output reports off';
                this.changed();
                await this.wait(job, Math.max(0, expires - Date.now()));
                if (!job.cancelled) this.note = 'Lamp control returned to the vehicle';
            } finally {
                await this.request(BDC, 0x2f, control.concat([0x00, id, 0x00])).catch(() => null);
            }
        }));
    }

    pulse(name) {
        if (this.pattern || this.strobe.kind !== 'fn' || !FUNCTIONS.some(([supported]) => supported === name)) return;
        const command = FUNCTION_DID.concat([0, F[name]]), ticks = name === 'high' ? 15 : 80;
        return this.run('lamp', (job) => this.inSession(async () => {
            try {
                const reply = await this.request(BDC, 0x2e, command.concat([0, ticks]));
                if (job.cancelled || this.blocked()) return;
                if (!reply || reply[0] !== 0x6e) { this.note = 'Lamp function declined the request'; return; }
                await this.wait(job, ticks * 10);
                if (!job.cancelled) this.note = 'Lamp test complete';
            } finally {
                await this.request(BDC, 0x2e, command.concat([0, 0])).catch(() => null);
            }
        }));
    }

    canPattern(id) {
        return PATTERNS.some(([name]) => name === id) && !!this.strobe.kind &&
            (id === 'show' || !this.strobe.head || !!this.strobe.high);
    }

    startPattern(id) {
        if (this.busy || this.pattern || this.blocked() || !this.canPattern(id)) return;
        this.pattern = id;
        this.changed();
        this.tick();
    }

    cooling() {
        if (!this.pattern) return null;
        const rest = this.strobe._resting();
        if (rest) return 'Cooling: ' + rest;
        const nextRun = (this.pattern === 'show' ? SHOW_MS : MAX_MS) + 4000;
        return this.strobe._flashedLately() + nextRun > FLASH_BUDGET_MS ? 'Cooling: rolling flash limit' : null;
    }

    tick() {
        const blocked = this.blocked();
        if (blocked && (this.pattern || (this.job && !this.job.cancelled))) this.stop(blocked);
        if (blocked || this.busy || !this.pattern || this.cooling()) return;
        const id = this.pattern;
        this.run('animation', async () => {
            if (id === 'show') await this.strobe.show({ rate: 'normal' });
            else await this.strobe.start({ pattern: id === 'cop' ? 'police' : 'both', lights: 'high', rate: 'normal' });
            if (this.strobe.noteType === 'warn') {
                this.pattern = null;
                this.note = this.strobe.note;
            }
        });
    }

    learn() {
        if (this.pattern || !this.strobe.head || this.strobe.high) return;
        return this.run('learn', async () => {
            await this.strobe.learn();
            this.note = this.strobe.note;
        });
    }

    stop(reason) {
        this.pattern = null;
        if (this.job) {
            this.job.cancelled = true;
            if (this.job.wake) this.job.wake();
        }
        this.strobe.stop();
        this.note = reason || 'Exterior lighting stopped';
        this.changed();
    }

    status() {
        if (this.job && this.job.cancelled) return 'Returning lamps to the vehicle';
        const blocked = this.blocked();
        if (blocked) return blocked;
        if (this.job && this.job.kind === 'scan') return 'Detecting exterior lamp controls';
        if (this.job && this.job.kind === 'lamp') return this.note || 'Sending lamp request';
        if (this.job) return this.strobe.note || 'Starting exterior animation';
        return this.cooling() || this.note || (this.strobe.kind || this.kind ? 'Exterior controls ready' : 'Detect the lamp controller to begin');
    }
}

module.exports = { Exterior, FUNCTIONS, PATTERNS };

'use strict';

const COLS = 10, ROWS = 22, HIDDEN = 2, LOCK_MS = 500, MAX_RESETS = 15;
const SHAPES = [null,
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
];

const ROTATIONS = SHAPES.map((shape) => {
    if (!shape) return null;
    const rotations = [shape];
    for (let r = 1; r < 4; r++) {
        const previous = rotations[r - 1], n = previous.length;
        rotations.push(previous.map((row, y) => row.map((cell, x) => previous[n - 1 - x][y])));
    }
    return rotations;
});

// Matrix rotations use bounded wall/floor kicks, in this order, for either direction.
// This is a deliberately small rotation system, rather than a claim of guideline SRS.
const KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1], [0, -2]];
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const type = (value) => integer(value, 1, 7);

function cells(piece) {
    const result = [], matrix = ROTATIONS[piece.type][piece.rotation];
    matrix.forEach((row, y) => row.forEach((filled, x) => {
        if (filled) result.push([piece.x + x, piece.y + y]);
    }));
    return result;
}

class Game {
    constructor(startLevel, seed) {
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        this.startLevel = integer(startLevel, 1, 10) ? startLevel : 1;
        this.rng = (seed >>> 0) || 0x6d2b79f5;
        this.bag = []; this.queue = []; this.held = 0; this.holdUsed = false;
        this.score = 0; this.lines = 0; this.over = false;
        this.fallMs = 0; this.lockMs = 0; this.resets = 0; this.softDrop = false;
        this.revision = 0; this.lastClear = 0; this.noticeMs = 0;
        this.fillQueue(); this.spawn();
    }

    level() { return Math.min(20, this.startLevel + Math.floor(this.lines / 10)); }
    gravity() { return Math.max(60, Math.round(1000 * Math.pow(0.8, this.level() - 1))); }

    random() {
        let x = this.rng;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        this.rng = x >>> 0;
        return this.rng / 4294967296;
    }

    fillQueue() {
        while (this.queue.length < 5) {
            if (!this.bag.length) {
                this.bag = [1, 2, 3, 4, 5, 6, 7];
                for (let i = this.bag.length - 1; i > 0; i--) {
                    const j = Math.floor(this.random() * (i + 1)), value = this.bag[i];
                    this.bag[i] = this.bag[j]; this.bag[j] = value;
                }
            }
            this.queue.push(this.bag.pop());
        }
    }

    fits(piece) {
        return cells(piece).every((p) => p[0] >= 0 && p[0] < COLS && p[1] >= 0 && p[1] < ROWS && !this.board[p[1]][p[0]]);
    }

    spawn(next) {
        const pieceType = next || this.queue.shift();
        this.fillQueue();
        this.active = { type: pieceType, rotation: 0, x: pieceType === 2 ? 4 : 3, y: 1 };
        this.fallMs = 0; this.lockMs = 0; this.resets = 0;
        if (!this.fits(this.active)) this.over = true;
        this.revision++;
    }

    grounded() { return !this.fits(Object.assign({}, this.active, { y: this.active.y + 1 })); }

    reposition(piece) {
        if (this.over || !this.fits(piece)) return false;
        const wasGrounded = this.grounded();
        this.active = piece;
        if (wasGrounded && this.resets < MAX_RESETS) { this.lockMs = 0; this.resets++; }
        this.revision++;
        return true;
    }

    move(direction) {
        if (direction !== -1 && direction !== 1) return false;
        return this.reposition(Object.assign({}, this.active, { x: this.active.x + direction }));
    }

    rotate(direction) {
        if (this.over || this.active.type === 2) return false;
        const rotation = (this.active.rotation + (direction === -1 ? 3 : 1)) % 4;
        for (const offset of KICKS) {
            const piece = Object.assign({}, this.active, { rotation, x: this.active.x + offset[0], y: this.active.y + offset[1] });
            if (this.reposition(piece)) return true;
        }
        return false;
    }

    down(soft) {
        if (this.over) return false;
        const piece = Object.assign({}, this.active, { y: this.active.y + 1 });
        if (!this.fits(piece)) return false;
        this.active = piece;
        if (soft) this.score++;
        this.revision++;
        return true;
    }

    landing() {
        const piece = Object.assign({}, this.active);
        while (this.fits(Object.assign({}, piece, { y: piece.y + 1 }))) piece.y++;
        return piece;
    }

    hardDrop() {
        if (this.over) return false;
        const landed = this.landing();
        this.score += (landed.y - this.active.y) * 2;
        this.active = landed; this.lock();
        return true;
    }

    hold() {
        if (this.over || this.holdUsed) return false;
        const previous = this.held;
        this.held = this.active.type;
        this.spawn(previous);
        this.holdUsed = true;
        return true;
    }

    lock() {
        for (const p of cells(this.active)) this.board[p[1]][p[0]] = this.active.type;
        const kept = this.board.filter((row) => row.some((cell) => !cell));
        const cleared = ROWS - kept.length, level = this.level();
        while (kept.length < ROWS) kept.unshift(Array(COLS).fill(0));
        this.board = kept;
        if (cleared) {
            this.score += [0, 100, 300, 500, 800][cleared] * level;
            this.lines += cleared;
            this.lastClear = cleared; this.noticeMs = 1400;
        }
        this.holdUsed = false;
        if (this.board.slice(0, HIDDEN).some((row) => row.some(Boolean))) {
            this.over = true; this.revision++; return;
        }
        this.spawn();
    }

    tick(ms) {
        if (this.over) return;
        this.noticeMs = Math.max(0, this.noticeMs - ms);
        const interval = this.softDrop ? Math.min(40, this.gravity()) : this.gravity();
        this.fallMs += ms;
        while (this.fallMs >= interval) {
            this.fallMs -= interval;
            if (!this.down(this.softDrop)) { this.fallMs = 0; break; }
        }
        if (this.grounded()) {
            this.lockMs = Math.min(LOCK_MS, this.lockMs + ms);
            if (this.lockMs >= LOCK_MS) this.lock();
        }
    }

    snapshot() {
        return {
            version: 1, board: this.board.map((row) => row.slice()), active: Object.assign({}, this.active),
            startLevel: this.startLevel, rng: this.rng, bag: this.bag.slice(), queue: this.queue.slice(),
            held: this.held, holdUsed: this.holdUsed, score: this.score, lines: this.lines, over: this.over,
            fallMs: this.fallMs, lockMs: this.lockMs, resets: this.resets,
        };
    }

    static restore(saved) {
        if (!saved || saved.version !== 1 || !Array.isArray(saved.board) || saved.board.length !== ROWS ||
            !saved.board.every((row) => Array.isArray(row) && row.length === COLS && row.every((cell) => integer(cell, 0, 7)) && row.some((cell) => !cell))) return null;
        const p = saved.active;
        if (!p || !type(p.type) || !integer(p.rotation, 0, 3) || !integer(p.x, -3, COLS - 1) || !integer(p.y, -3, ROWS - 1) ||
            !integer(saved.startLevel, 1, 10) || !integer(saved.rng, 1, 0xffffffff) ||
            !Array.isArray(saved.bag) || saved.bag.length > 7 || !saved.bag.every(type) || new Set(saved.bag).size !== saved.bag.length ||
            !Array.isArray(saved.queue) || saved.queue.length !== 5 || !saved.queue.every(type) ||
            !integer(saved.held, 0, 7) || typeof saved.holdUsed !== 'boolean' ||
            !integer(saved.score, 0, Number.MAX_SAFE_INTEGER) || !integer(saved.lines, 0, Number.MAX_SAFE_INTEGER) ||
            typeof saved.over !== 'boolean' || !integer(saved.fallMs, 0, 1000) || !integer(saved.lockMs, 0, LOCK_MS) ||
            !integer(saved.resets, 0, MAX_RESETS)) return null;
        const game = Object.create(Game.prototype);
        Object.assign(game, {
            board: saved.board.map((row) => row.slice()), active: { type: p.type, rotation: p.rotation, x: p.x, y: p.y },
            startLevel: saved.startLevel, rng: saved.rng, bag: saved.bag.slice(), queue: saved.queue.slice(),
            held: saved.held, holdUsed: saved.holdUsed, score: saved.score, lines: saved.lines, over: saved.over,
            fallMs: saved.fallMs, lockMs: saved.lockMs, resets: saved.resets, softDrop: false,
            revision: 0, lastClear: 0, noticeMs: 0,
        });
        if (!game.over && (!game.fits(game.active) || game.board.slice(0, HIDDEN).some((row) => row.some(Boolean)))) return null;
        return game;
    }
}

module.exports = { Game, cells, COLS, ROWS, HIDDEN };

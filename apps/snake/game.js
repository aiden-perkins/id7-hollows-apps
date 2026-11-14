'use strict';

const COLS = 24, ROWS = 16, CAPACITY = COLS * ROWS, INITIAL_LENGTH = 4;
const DIRECTIONS = ['up', 'right', 'down', 'left'];
const DELTAS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const OPPOSITE = { up: 'down', right: 'left', down: 'up', left: 'right' };
const SPEEDS = { relaxed: 320, normal: 220, fast: 150 };
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const direction = (value) => DIRECTIONS.indexOf(value) >= 0;
const cell = (value) => integer(value, 0, CAPACITY - 1);
const point = (value) => [value % COLS, Math.floor(value / COLS)];

function neighbor(id, heading, wrap) {
    const p = point(id), d = DELTAS[heading];
    let x = p[0] + d[0], y = p[1] + d[1];
    if (wrap) { x = (x + COLS) % COLS; y = (y + ROWS) % ROWS; }
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return -1;
    return y * COLS + x;
}

class Game {
    constructor(difficulty, edges, seed) {
        this.difficulty = Object.prototype.hasOwnProperty.call(SPEEDS, difficulty) ? difficulty : 'normal';
        this.edges = edges === 'wrap' ? 'wrap' : 'solid';
        this.rng = (seed >>> 0) || 0x6d2b79f5;
        const head = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 3);
        this.body = Array.from({ length: INITIAL_LENGTH }, (unused, i) => head - i);
        this.occupied = new Set(this.body);
        this.direction = 'right'; this.turns = []; this.food = null;
        this.score = 0; this.elapsedMs = 0; this.over = false; this.won = false; this.reason = '';
        this.revision = 0;
        this.placeFood();
    }

    level() { return Math.min(20, 1 + Math.floor((this.body.length - INITIAL_LENGTH) / 5)); }
    interval() { return Math.max(70, SPEEDS[this.difficulty] - (this.level() - 1) * 12); }
    desiredDirection() { return this.turns.length ? this.turns[this.turns.length - 1] : this.direction; }

    turn(heading) {
        if (this.over || !direction(heading) || this.turns.length >= 2) return false;
        const previous = this.desiredDirection();
        if (heading === previous || heading === OPPOSITE[previous]) return false;
        this.turns.push(heading); this.revision++;
        return true;
    }

    turnRelative(amount) {
        if (amount !== -1 && amount !== 1) return false;
        const index = DIRECTIONS.indexOf(this.desiredDirection());
        return this.turn(DIRECTIONS[(index + amount + 4) % 4]);
    }

    random() {
        let x = this.rng;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        this.rng = x >>> 0;
        return this.rng / 4294967296;
    }

    placeFood() {
        const free = CAPACITY - this.body.length;
        if (!free) {
            this.food = null; this.over = true; this.won = true; this.reason = 'complete';
            return;
        }
        // Select among free cells directly, including when only one cell remains.
        let target = Math.floor(this.random() * free);
        for (let id = 0; id < CAPACITY; id++) {
            if (!this.occupied.has(id) && target-- === 0) { this.food = id; return; }
        }
    }

    step() {
        if (this.over) return;
        if (this.turns.length) this.direction = this.turns.shift();
        const next = neighbor(this.body[0], this.direction, this.edges === 'wrap');
        if (next < 0) { this.over = true; this.reason = 'wall'; this.revision++; return; }
        const growing = next === this.food, tail = this.body[this.body.length - 1];
        // The tail vacates its cell on a non-growing step, so entering it is legal.
        if (this.occupied.has(next) && (growing || next !== tail)) {
            this.over = true; this.reason = 'self'; this.revision++; return;
        }
        if (!growing) { this.body.pop(); this.occupied.delete(tail); }
        this.body.unshift(next); this.occupied.add(next);
        if (growing) { this.score += 10; this.placeFood(); }
        this.revision++;
    }

    tick(ms) {
        if (this.over) return;
        this.elapsedMs += ms;
        while (!this.over && this.elapsedMs >= this.interval()) {
            this.elapsedMs -= this.interval();
            this.step();
        }
    }

    snapshot() {
        return {
            version: 1, body: this.body.slice(), direction: this.direction, turns: this.turns.slice(), food: this.food,
            difficulty: this.difficulty, edges: this.edges, rng: this.rng, score: this.score,
            elapsedMs: this.elapsedMs, over: this.over, won: this.won, reason: this.reason,
        };
    }

    static restore(saved) {
        if (!saved || saved.version !== 1 || !Array.isArray(saved.body) ||
            saved.body.length < INITIAL_LENGTH || saved.body.length > CAPACITY || !saved.body.every(cell) ||
            new Set(saved.body).size !== saved.body.length || !direction(saved.direction) ||
            !Array.isArray(saved.turns) || saved.turns.length > 2 || !saved.turns.every(direction) ||
            !Object.prototype.hasOwnProperty.call(SPEEDS, saved.difficulty) || ['solid', 'wrap'].indexOf(saved.edges) < 0 ||
            !integer(saved.rng, 1, 0xffffffff) || saved.score !== (saved.body.length - INITIAL_LENGTH) * 10 ||
            !integer(saved.elapsedMs, 0, SPEEDS[saved.difficulty] - 1) ||
            typeof saved.over !== 'boolean' || typeof saved.won !== 'boolean' ||
            ['', 'wall', 'self', 'complete'].indexOf(saved.reason) < 0) return null;
        const wrap = saved.edges === 'wrap', occupied = new Set(saved.body);
        for (let i = 1; i < saved.body.length; i++) {
            if (!DIRECTIONS.some((heading) => neighbor(saved.body[i - 1], heading, wrap) === saved.body[i])) return null;
        }
        let previous = saved.direction;
        for (const heading of saved.turns) {
            if (heading === previous || heading === OPPOSITE[previous]) return null;
            previous = heading;
        }
        if (saved.won) {
            if (!saved.over || saved.reason !== 'complete' || saved.body.length !== CAPACITY || saved.food !== null) return null;
        } else {
            if (saved.body.length === CAPACITY || !cell(saved.food) || occupied.has(saved.food) ||
                (saved.over ? ['wall', 'self'].indexOf(saved.reason) < 0 : saved.reason !== '')) return null;
        }
        if (!saved.over && neighbor(saved.body[0], OPPOSITE[saved.direction], wrap) !== saved.body[1]) return null;
        if (saved.reason === 'wall' && (wrap || neighbor(saved.body[0], saved.direction, false) >= 0)) return null;
        if (saved.reason === 'self') {
            const hit = neighbor(saved.body[0], saved.direction, wrap);
            if (!occupied.has(hit) || hit === saved.body[saved.body.length - 1]) return null;
        }
        const game = Object.create(Game.prototype);
        Object.assign(game, {
            body: saved.body.slice(), occupied, direction: saved.direction, turns: saved.turns.slice(), food: saved.food,
            difficulty: saved.difficulty, edges: saved.edges, rng: saved.rng, score: saved.score,
            elapsedMs: saved.elapsedMs, over: saved.over, won: saved.won, reason: saved.reason, revision: 0,
        });
        if (game.elapsedMs >= game.interval()) return null;
        return game;
    }
}

module.exports = { Game, COLS, ROWS, CAPACITY, DIRECTIONS, DELTAS, point };

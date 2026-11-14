'use strict';

const PRESETS = {
    beginner: { title: 'Beginner', cols: 9, rows: 9, mines: 10 },
    intermediate: { title: 'Intermediate', cols: 16, rows: 16, mines: 40 },
    expert: { title: 'Expert', cols: 30, rows: 16, mines: 99 },
};
const DIRECTIONS = ['up', 'right', 'down', 'left'];
const DELTAS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const MODES = ['reveal', 'flag', 'chord'];
const MODE_NAMES = { reveal: 'Reveal', flag: 'Flag', chord: 'Open around' };
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const bits = (value, size) => Array.isArray(value) && value.length === size && value.every((entry) => entry === 0 || entry === 1);

function neighbors(id, cols, rows) {
    const result = [], x = id % cols, y = Math.floor(id / cols);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if ((dx || dy) && nx >= 0 && nx < cols && ny >= 0 && ny < rows) result.push(ny * cols + nx);
    }
    return result;
}

class Game {
    constructor(difficulty, seed) {
        this.difficulty = Object.prototype.hasOwnProperty.call(PRESETS, difficulty) ? difficulty : 'beginner';
        const preset = PRESETS[this.difficulty];
        this.cols = preset.cols; this.rows = preset.rows; this.mineCount = preset.mines;
        this.size = this.cols * this.rows;
        this.mines = Array(this.size).fill(0); this.revealed = Array(this.size).fill(0);
        this.flagged = Array(this.size).fill(0); this.counts = Array(this.size).fill(0);
        this.rng = (seed >>> 0) || 0x6d2b79f5;
        this.cursor = Math.floor(this.rows / 2) * this.cols + Math.floor(this.cols / 2);
        this.mode = 'reveal'; this.started = false; this.first = -1;
        this.cleared = 0; this.elapsedMs = 0; this.over = false; this.won = false; this.exploded = -1;
        this.recorded = false; this.revision = 0;
    }

    neighbors(id) { return neighbors(id, this.cols, this.rows); }
    flags() { return this.flagged.reduce((sum, value) => sum + value, 0); }
    safeTotal() { return this.size - this.mineCount; }

    random() {
        let x = this.rng;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        this.rng = x >>> 0;
        return this.rng / 4294967296;
    }

    generate(first) {
        const excluded = new Set(this.neighbors(first).concat(first)), pool = [];
        for (let id = 0; id < this.size; id++) if (!excluded.has(id)) pool.push(id);
        for (let i = 0; i < this.mineCount; i++) {
            const j = i + Math.floor(this.random() * (pool.length - i)), value = pool[i];
            pool[i] = pool[j]; pool[j] = value;
            this.mines[pool[i]] = 1;
        }
        this.counts = this.mines.map((unused, id) => this.neighbors(id).reduce((sum, near) => sum + this.mines[near], 0));
        this.first = first; this.started = true;
    }

    select(id) {
        if (!integer(id, 0, this.size - 1) || id === this.cursor) return false;
        this.cursor = id; this.revision++;
        return true;
    }

    move(heading) {
        if (this.over || DIRECTIONS.indexOf(heading) < 0) return false;
        const delta = DELTAS[heading];
        const x = Math.max(0, Math.min(this.cols - 1, this.cursor % this.cols + delta[0]));
        const y = Math.max(0, Math.min(this.rows - 1, Math.floor(this.cursor / this.cols) + delta[1]));
        return this.select(y * this.cols + x);
    }

    cycleMode(amount) {
        if (this.over || !Number.isInteger(amount) || !amount) return false;
        const index = MODES.indexOf(this.mode);
        const next = MODES[((index + amount) % MODES.length + MODES.length) % MODES.length];
        if (next === this.mode) return false;
        this.mode = next; this.revision++;
        return true;
    }

    flag(id) {
        if (this.over || !integer(id, 0, this.size - 1) || this.revealed[id]) return false;
        if (!this.flagged[id] && this.flags() >= this.mineCount) return false;
        this.flagged[id] = this.flagged[id] ? 0 : 1;
        this.revision++;
        return true;
    }

    open(ids) {
        const stack = ids.slice();
        let changed = false;
        // Iterative expansion stays bounded by the board rather than the call stack.
        while (stack.length && !this.over) {
            const id = stack.pop();
            if (this.revealed[id] || this.flagged[id]) continue;
            this.revealed[id] = 1; changed = true;
            if (this.mines[id]) { this.exploded = id; this.over = true; break; }
            this.cleared++;
            if (!this.counts[id]) this.neighbors(id).forEach((near) => {
                if (!this.revealed[near] && !this.flagged[near]) stack.push(near);
            });
        }
        if (!this.over && this.cleared === this.safeTotal()) {
            this.won = true; this.over = true;
            this.flagged = this.mines.slice();
        }
        if (changed) this.revision++;
        return changed;
    }

    reveal(id) {
        if (this.over || !integer(id, 0, this.size - 1) || this.revealed[id] || this.flagged[id]) return false;
        if (!this.started) this.generate(id);
        return this.open([id]);
    }

    canChord(id) {
        if (this.over || !integer(id, 0, this.size - 1) || !this.revealed[id] || !this.counts[id]) return false;
        const near = this.neighbors(id);
        return near.reduce((sum, next) => sum + this.flagged[next], 0) === this.counts[id] &&
            near.some((next) => !this.revealed[next] && !this.flagged[next]);
    }

    chord(id) {
        if (!this.canChord(id)) return false;
        return this.open(this.neighbors(id).filter((near) => !this.flagged[near] && !this.revealed[near]));
    }

    activate(id) {
        if (this.mode === 'flag') return this.flag(id);
        if (this.mode === 'chord') return this.chord(id);
        return this.reveal(id);
    }

    advance(ms) {
        if (this.started && !this.over && integer(ms, 1, Number.MAX_SAFE_INTEGER)) {
            this.elapsedMs = Math.min(Number.MAX_SAFE_INTEGER, this.elapsedMs + ms);
        }
    }

    snapshot() {
        return {
            version: 1, difficulty: this.difficulty, mines: this.mines.slice(), revealed: this.revealed.slice(),
            flagged: this.flagged.slice(), rng: this.rng, cursor: this.cursor, mode: this.mode,
            started: this.started, first: this.first, elapsedMs: this.elapsedMs,
            over: this.over, won: this.won, exploded: this.exploded, recorded: this.recorded,
        };
    }

    static restore(saved) {
        if (!saved || saved.version !== 1 || !Object.prototype.hasOwnProperty.call(PRESETS, saved.difficulty)) return null;
        const preset = PRESETS[saved.difficulty], size = preset.cols * preset.rows;
        if (!bits(saved.mines, size) || !bits(saved.revealed, size) || !bits(saved.flagged, size) ||
            !integer(saved.rng, 1, 0xffffffff) || !integer(saved.cursor, 0, size - 1) || MODES.indexOf(saved.mode) < 0 ||
            typeof saved.started !== 'boolean' || !integer(saved.first, -1, size - 1) ||
            !integer(saved.elapsedMs, 0, Number.MAX_SAFE_INTEGER) || typeof saved.over !== 'boolean' || typeof saved.won !== 'boolean' ||
            !integer(saved.exploded, -1, size - 1) || typeof saved.recorded !== 'boolean' || saved.recorded && !saved.won) return null;
        const mineTotal = saved.mines.reduce((sum, value) => sum + value, 0);
        const flags = saved.flagged.reduce((sum, value) => sum + value, 0);
        if (flags > preset.mines || saved.revealed.some((value, id) => value && saved.flagged[id])) return null;
        if (saved.started) {
            if (mineTotal !== preset.mines || saved.first < 0 || !saved.revealed[saved.first] ||
                saved.mines[saved.first] || neighbors(saved.first, preset.cols, preset.rows).some((id) => saved.mines[id])) return null;
        } else if (mineTotal || saved.revealed.some(Boolean) || saved.first !== -1 || saved.elapsedMs ||
            saved.over || saved.won || saved.exploded !== -1 || saved.recorded) return null;
        let cleared = 0, hit = 0;
        saved.revealed.forEach((value, id) => { if (value) { if (saved.mines[id]) hit++; else cleared++; } });
        if (saved.won) {
            if (!saved.over || !saved.started || cleared !== size - preset.mines || hit || saved.exploded !== -1 ||
                saved.flagged.some((value, id) => value !== saved.mines[id])) return null;
        } else if (saved.over) {
            if (!saved.started || saved.exploded < 0 || !saved.mines[saved.exploded] || !saved.revealed[saved.exploded] ||
                hit !== 1 || cleared >= size - preset.mines) return null;
        } else if (hit || saved.exploded !== -1 || cleared >= size - preset.mines) return null;
        const game = Object.create(Game.prototype);
        Object.assign(game, {
            difficulty: saved.difficulty, cols: preset.cols, rows: preset.rows, mineCount: preset.mines, size,
            mines: saved.mines.slice(), revealed: saved.revealed.slice(), flagged: saved.flagged.slice(),
            rng: saved.rng, cursor: saved.cursor, mode: saved.mode, started: saved.started, first: saved.first,
            elapsedMs: saved.elapsedMs, over: saved.over, won: saved.won, exploded: saved.exploded,
            recorded: saved.recorded, cleared, revision: 0,
        });
        game.counts = game.mines.map((unused, id) => game.neighbors(id).reduce((sum, near) => sum + game.mines[near], 0));
        return game;
    }
}

module.exports = { Game, PRESETS, DIRECTIONS, DELTAS, MODES, MODE_NAMES };

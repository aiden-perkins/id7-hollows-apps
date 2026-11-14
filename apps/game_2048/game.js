'use strict';

const SIZE = 4, COUNT = SIZE * SIZE, TARGET = 2048;
const DIRECTIONS = ['up', 'right', 'down', 'left'];
const DELTAS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const tile = (value) => value === 0 || integer(value, 2, Number.MAX_SAFE_INTEGER) && value === Math.pow(2, Math.round(Math.log2(value)));

function indices(heading, line) {
    return Array.from({ length: SIZE }, (unused, position) => {
        if (heading === 'left') return line * SIZE + position;
        if (heading === 'right') return line * SIZE + SIZE - 1 - position;
        if (heading === 'up') return position * SIZE + line;
        return (SIZE - 1 - position) * SIZE + line;
    });
}

function available(board) {
    if (board.some((value) => value === 0)) return true;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const id = y * SIZE + x;
        if (x + 1 < SIZE && board[id] === board[id + 1] || y + 1 < SIZE && board[id] === board[id + SIZE]) return true;
    }
    return false;
}

function position(saved) {
    if (!saved || !Array.isArray(saved.board) || saved.board.length !== COUNT || !saved.board.every(tile) ||
        saved.board.filter(Boolean).length < 2 || !integer(saved.score, 0, Number.MAX_SAFE_INTEGER) || saved.score % 4 !== 0 ||
        !integer(saved.moves, 0, Number.MAX_SAFE_INTEGER) || !integer(saved.rng, 1, 0xffffffff) ||
        typeof saved.won !== 'boolean' || typeof saved.continued !== 'boolean' || typeof saved.over !== 'boolean' ||
        saved.won !== saved.board.some((value) => value >= TARGET) || saved.continued && !saved.won ||
        saved.over !== !available(saved.board)) return null;
    if (saved.moves === 0 && (saved.score !== 0 || saved.board.filter(Boolean).length !== 2 || saved.board.some((value) => value > 4))) return null;
    return {
        board: saved.board.slice(), score: saved.score, moves: saved.moves, rng: saved.rng,
        won: saved.won, continued: saved.continued, over: saved.over,
    };
}

class Game {
    constructor(seed) {
        this.board = Array(COUNT).fill(0);
        this.score = 0; this.moves = 0; this.rng = (seed >>> 0) || 0x6d2b79f5;
        this.won = false; this.continued = false; this.over = false;
        this.undoState = null; this.lastMove = null; this.revision = 0;
        this.spawn(); this.spawn();
    }

    waiting() { return this.won && !this.continued; }
    canPlay() { return !this.over && !this.waiting(); }
    highest() { return Math.max.apply(null, this.board); }

    random() {
        let x = this.rng;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        this.rng = x >>> 0;
        return this.rng / 4294967296;
    }

    spawn() {
        const empty = [];
        this.board.forEach((value, id) => { if (!value) empty.push(id); });
        if (!empty.length) return -1;
        const id = empty[Math.floor(this.random() * empty.length)];
        this.board[id] = this.random() < 0.9 ? 2 : 4;
        return id;
    }

    position() {
        return {
            board: this.board.slice(), score: this.score, moves: this.moves, rng: this.rng,
            won: this.won, continued: this.continued, over: this.over,
        };
    }

    move(heading) {
        if (!this.canPlay() || DIRECTIONS.indexOf(heading) < 0) return false;
        const next = Array(COUNT).fill(0), motions = [], merged = [];
        let gained = 0;
        for (let line = 0; line < SIZE; line++) {
            const ids = indices(heading, line);
            const filled = ids.filter((id) => this.board[id] !== 0);
            let target = 0;
            for (let i = 0; i < filled.length; i++) {
                const from = filled[i], to = ids[target++], value = this.board[from];
                motions.push({ from, to, value });
                if (i + 1 < filled.length && value === this.board[filled[i + 1]]) {
                    next[to] = value * 2; gained += next[to]; merged.push(to);
                    motions.push({ from: filled[++i], to, value });
                } else next[to] = value;
            }
        }
        // No-op inputs consume neither a random tile nor the previous undo position.
        if (next.every((value, id) => value === this.board[id])) return false;
        if (!next.every(tile) || !Number.isSafeInteger(this.score + gained) || this.moves >= Number.MAX_SAFE_INTEGER) return false;
        this.undoState = this.position();
        this.board = next; this.score += gained; this.moves++;
        const spawned = this.spawn();
        this.won = this.won || this.highest() >= TARGET;
        this.over = !available(this.board);
        this.lastMove = { motions, merged, spawned, gained };
        this.revision++;
        return true;
    }

    undo() {
        if (!this.undoState) return false;
        const previous = this.undoState;
        Object.assign(this, previous, { board: previous.board.slice(), undoState: null, lastMove: null });
        this.revision++;
        return true;
    }

    keepPlaying() {
        if (!this.waiting() || this.over) return false;
        this.continued = true; this.revision++;
        return true;
    }

    snapshot() {
        return Object.assign({ version: 1 }, this.position(), {
            undo: this.undoState ? Object.assign({}, this.undoState, { board: this.undoState.board.slice() }) : null,
        });
    }

    static restore(saved) {
        if (!saved || saved.version !== 1) return null;
        const current = position(saved);
        if (!current) return null;
        const undo = saved.undo === null ? null : position(saved.undo);
        if (saved.undo !== null && (!undo || undo.over || undo.won && !undo.continued ||
            undo.moves + 1 !== current.moves || undo.score > current.score)) return null;
        const game = Object.create(Game.prototype);
        Object.assign(game, current, { undoState: undo, lastMove: null, revision: 0 });
        return game;
    }
}

module.exports = { Game, SIZE, COUNT, TARGET, DIRECTIONS, DELTAS };

'use strict';

const { MAZES, COLS, COUNT, DIRECTIONS, OPPOSITE, START, HOMES, CORNERS, point } = require('./maze');
const DIFFICULTIES = {
    easy: { title: 'Easy', player: 5.2, ghost: 3.9, power: 9000, lives: 5 },
    normal: { title: 'Normal', player: 6, ghost: 4.8, power: 7000, lives: 3 },
    hard: { title: 'Hard', player: 6.5, ghost: 5.7, power: 5000, lives: 3 },
};
const ORDERS = [['up', 'left', 'down', 'right'], ['left', 'down', 'right', 'up'], ['down', 'right', 'up', 'left'], ['right', 'up', 'left', 'down']];
const MAX_SCORE = 1000000000000, EPS = 1e-9;
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const finite = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const actor = (cell, direction) => ({ cell, next: cell, progress: 0, direction });
const copyActor = (a) => ({ cell: a.cell, next: a.next, progress: a.progress, direction: a.direction });

function position(a) {
    const from = point(a.cell), to = point(a.next);
    let dx = to.x - from.x;
    if (Math.abs(dx) > 1) dx = a.direction === 'left' ? -1 : 1;
    return { x: from.x + dx * a.progress, y: from.y + (to.y - from.y) * a.progress };
}

function sweptCollision(p0, p1, g0, g1) {
    const wrap = (delta) => delta - Math.round(delta / COLS) * COLS;
    const rx = wrap(g0.x - p0.x), ry = g0.y - p0.y;
    const dx = wrap(g1.x - g0.x) - wrap(p1.x - p0.x), dy = (g1.y - g0.y) - (p1.y - p0.y);
    const length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, -(rx * dx + ry * dy) / length)) : 0;
    return (rx + dx * t) * (rx + dx * t) + (ry + dy * t) * (ry + dy * t) <= 0.44 * 0.44;
}

function validActor(saved, maze) {
    if (!saved || !maze.passable(saved.cell) || !maze.passable(saved.next) || DIRECTIONS.indexOf(saved.direction) < 0 ||
        !finite(saved.progress, 0, 1) || saved.progress >= 1) return false;
    return saved.next === saved.cell ? saved.progress === 0 : maze.next(saved.cell, saved.direction) === saved.next;
}

class Game {
    constructor(difficulty, seed) {
        this.difficulty = Object.prototype.hasOwnProperty.call(DIFFICULTIES, difficulty) ? difficulty : 'normal';
        this.rng = (seed >>> 0) || 0x6d2b79f5; this.level = 1; this.score = 0; this.nextLife = 10000;
        this.lives = DIFFICULTIES[this.difficulty].lives; this.phase = 'ready'; this.over = false; this.lastEvent = 'start'; this.revision = 0;
        this.loadMaze();
    }

    loadMaze() {
        this.maze = MAZES[(this.level - 1) % MAZES.length];
        this.pellets = this.maze.initial.slice(); this.remaining = this.pellets.filter(Boolean).length;
        this.resetRound();
    }

    resetRound() {
        this.player = actor(START, 'left'); this.wanted = 'left';
        this.ghosts = HOMES.map((home, id) => Object.assign(actor(home, id % 2 ? 'right' : 'left'), { state: 'active', releaseMs: id * 800, forced: '' }));
        this.powerMs = 0; this.combo = 0; this.mode = 'scatter'; this.modeMs = 6000;
    }

    random() {
        let x = this.rng;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        this.rng = x >>> 0;
        return this.rng / 4294967296;
    }

    start() {
        if (this.over || ['ready', 'cleared'].indexOf(this.phase) < 0) return false;
        if (this.phase === 'cleared') { this.level = Math.min(9999, this.level + 1); this.loadMaze(); this.lastEvent = 'start'; }
        this.phase = 'playing'; this.revision++;
        return true;
    }

    turn(heading) {
        if (this.over || this.phase === 'cleared' || DIRECTIONS.indexOf(heading) < 0 || heading === this.wanted) return false;
        this.wanted = heading; this.revision++;
        return true;
    }

    turnRelative(amount) {
        if (amount !== -1 && amount !== 1) return false;
        return this.turn(DIRECTIONS[(DIRECTIONS.indexOf(this.wanted) + amount + 4) % 4]);
    }

    addScore(points) {
        this.score = Math.min(MAX_SCORE, this.score + points);
        if (this.score >= this.nextLife) {
            const earned = Math.floor((this.score - this.nextLife) / 10000) + 1;
            this.lives = Math.min(5, this.lives + earned);
            this.nextLife = (Math.floor(this.score / 10000) + 1) * 10000;
        }
    }

    powerDuration() { return Math.max(2500, DIFFICULTIES[this.difficulty].power - Math.min(12, this.level - 1) * 250); }

    reverse(a) {
        if (a.next !== a.cell) {
            const previous = a.cell; a.cell = a.next; a.next = previous; a.progress = 1 - a.progress;
            a.direction = OPPOSITE[a.direction];
            if (a.progress >= 1 - EPS) { a.cell = a.next; a.progress = 0; }
        } else a.forced = OPPOSITE[a.direction];
    }

    consume(id) {
        const pellet = this.pellets[id];
        if (!pellet) return;
        this.pellets[id] = 0; this.remaining--; this.addScore(pellet === 2 ? 50 : 10);
        if (pellet === 2) {
            this.powerMs = this.powerDuration(); this.combo = 0;
            this.ghosts.forEach((ghost) => { if (ghost.state === 'active' && !ghost.releaseMs) this.reverse(ghost); });
        }
        if (!this.remaining) {
            this.addScore(500); this.phase = 'cleared'; this.lastEvent = 'cleared'; this.powerMs = 0; this.combo = 0;
        }
    }

    advance(a, amount, decide, arrived) {
        while (amount > EPS && this.phase === 'playing') {
            if (a.next === a.cell) {
                const heading = decide(), next = this.maze.next(a.cell, heading);
                if (next < 0) break;
                a.direction = heading; a.next = next; a.progress = 0;
            }
            const distance = Math.min(amount, 1 - a.progress);
            a.progress += distance; amount -= distance;
            if (a.progress >= 1 - EPS) {
                a.cell = a.next; a.next = a.cell; a.progress = 0;
                if (arrived && arrived() === false) break;
            }
        }
    }

    projected(steps) {
        let target = this.player.progress > 0.5 ? this.player.next : this.player.cell;
        for (let i = 0; i < steps; i++) {
            const next = this.maze.next(target, this.player.direction);
            if (next < 0) break;
            target = next;
        }
        return target;
    }

    ghostTarget(id) {
        const ghost = this.ghosts[id];
        if (ghost.state === 'returning') return HOMES[id];
        if (this.mode === 'scatter') return CORNERS[id];
        if (id === 1) return this.projected(3);
        if (id === 2) {
            const ahead = point(this.projected(2)), leader = position(this.ghosts[0]);
            return this.maze.nearest(ahead.x * 2 - leader.x, ahead.y * 2 - leader.y);
        }
        if (id === 3 && this.maze.distances(this.player.cell)[ghost.cell] <= 6) return CORNERS[id];
        return this.player.progress > 0.5 ? this.player.next : this.player.cell;
    }

    ghostDirection(id) {
        const ghost = this.ghosts[id];
        if (ghost.forced) {
            const heading = ghost.forced; ghost.forced = '';
            if (this.maze.next(ghost.cell, heading) >= 0) return heading;
        }
        let choices = ORDERS[id].filter((heading) => this.maze.next(ghost.cell, heading) >= 0);
        if (ghost.state !== 'returning' && choices.length > 1) choices = choices.filter((heading) => heading !== OPPOSITE[ghost.direction]);
        if (this.powerMs > 0 && ghost.state === 'active') {
            const distances = this.maze.distances(this.player.cell);
            const farthest = Math.max.apply(null, choices.map((heading) => distances[this.maze.next(ghost.cell, heading)]));
            choices = choices.filter((heading) => distances[this.maze.next(ghost.cell, heading)] === farthest);
            return choices[Math.floor(this.random() * choices.length)];
        }
        const distances = this.maze.distances(this.ghostTarget(id));
        let best = choices[0], distance = Infinity;
        choices.forEach((heading) => {
            const candidate = distances[this.maze.next(ghost.cell, heading)];
            if (candidate >= 0 && candidate < distance) { best = heading; distance = candidate; }
        });
        return best;
    }

    loseLife() {
        this.lives--; this.over = this.lives === 0;
        this.phase = this.over ? 'finished' : 'ready'; this.lastEvent = this.over ? 'lost' : 'life';
        this.resetRound(); this.revision++;
    }

    eatGhost(id) {
        const ghost = this.ghosts[id];
        this.addScore(200 * Math.pow(2, this.combo)); this.combo = Math.min(3, this.combo + 1);
        ghost.state = 'returning'; ghost.forced = '';
        if (ghost.next !== ghost.cell) {
            const distances = this.maze.distances(HOMES[id]);
            if (distances[ghost.cell] < distances[ghost.next]) this.reverse(ghost);
        }
    }

    tick(ms) {
        if (this.phase !== 'playing' || !integer(ms, 1, 50)) return;
        this.revision++;
        const difficulty = DIFFICULTIES[this.difficulty], seconds = ms / 1000;
        const powered = this.powerMs > 0;
        this.powerMs = Math.max(0, this.powerMs - ms);
        if (!this.powerMs) this.combo = 0;
        if (!powered) {
            this.modeMs -= ms;
            if (this.modeMs <= 0) { this.mode = this.mode === 'scatter' ? 'chase' : 'scatter'; this.modeMs += this.mode === 'scatter' ? 6000 : 18000; }
        }
        const p0 = position(this.player), oldGhosts = this.ghosts.map(position);
        if (this.player.next !== this.player.cell && this.wanted === OPPOSITE[this.player.direction]) this.reverse(this.player);
        this.advance(this.player, (difficulty.player + Math.min(10, this.level - 1) * 0.08) * seconds,
            () => this.maze.next(this.player.cell, this.wanted) >= 0 ? this.wanted : this.player.direction,
            () => { this.consume(this.player.cell); return this.phase === 'playing'; });
        if (this.phase !== 'playing') return;
        this.ghosts.forEach((ghost, id) => {
            ghost.releaseMs = Math.max(0, ghost.releaseMs - ms);
            if (ghost.releaseMs) return;
            if (ghost.state === 'returning' && ghost.cell === HOMES[id] && ghost.next === ghost.cell) {
                ghost.state = 'active'; ghost.releaseMs = 1500; return;
            }
            const speed = ghost.state === 'returning' ? 9.5 :
                (difficulty.ghost + Math.min(12, this.level - 1) * 0.12) * (this.powerMs > 0 ? 0.55 : 1);
            this.advance(ghost, speed * seconds, () => this.ghostDirection(id), () => {
                if (ghost.state === 'returning' && ghost.cell === HOMES[id]) {
                    ghost.state = 'active'; ghost.releaseMs = 1500; ghost.forced = ''; return false;
                }
                return true;
            });
        });
        const p1 = position(this.player);
        for (let id = 0; id < this.ghosts.length && this.phase === 'playing'; id++) {
            const ghost = this.ghosts[id];
            if (ghost.releaseMs || ghost.state === 'returning') continue;
            if (sweptCollision(p0, p1, oldGhosts[id], position(ghost))) {
                if (this.powerMs > 0) this.eatGhost(id);
                else this.loseLife();
            }
        }
    }

    snapshot() {
        return {
            version: 1, difficulty: this.difficulty, rng: this.rng, level: this.level, score: this.score, nextLife: this.nextLife,
            lives: this.lives, pellets: this.pellets.slice(), player: copyActor(this.player), wanted: this.wanted,
            ghosts: this.ghosts.map((ghost) => Object.assign(copyActor(ghost), { state: ghost.state, releaseMs: ghost.releaseMs, forced: ghost.forced })),
            mode: this.mode, modeMs: this.modeMs, powerMs: this.powerMs, combo: this.combo,
            phase: this.phase, over: this.over, lastEvent: this.lastEvent,
        };
    }

    static restore(saved) {
        if (!saved || saved.version !== 1 || !Object.prototype.hasOwnProperty.call(DIFFICULTIES, saved.difficulty) ||
            !integer(saved.rng, 1, 0xffffffff) || !integer(saved.level, 1, 9999) || !integer(saved.score, 0, MAX_SCORE) || saved.score % 10 !== 0 ||
            saved.nextLife !== (Math.floor(saved.score / 10000) + 1) * 10000 || !integer(saved.lives, 0, 5) ||
            DIRECTIONS.indexOf(saved.wanted) < 0 || ['scatter', 'chase'].indexOf(saved.mode) < 0 ||
            !integer(saved.modeMs, 1, saved.mode === 'scatter' ? 6000 : 18000) ||
            !integer(saved.powerMs, 0, DIFFICULTIES[saved.difficulty].power) || !integer(saved.combo, 0, 3) || !saved.powerMs && saved.combo !== 0 ||
            ['ready', 'playing', 'cleared', 'finished'].indexOf(saved.phase) < 0 || typeof saved.over !== 'boolean' ||
            saved.over !== (saved.phase === 'finished') || ['start', 'life', 'cleared', 'lost'].indexOf(saved.lastEvent) < 0) return null;
        const maze = MAZES[(saved.level - 1) % MAZES.length];
        if (!Array.isArray(saved.pellets) || saved.pellets.length !== COUNT ||
            !saved.pellets.every((value, id) => value === 0 || value === maze.initial[id]) || !validActor(saved.player, maze) ||
            !Array.isArray(saved.ghosts) || saved.ghosts.length !== 4) return null;
        for (let id = 0; id < saved.ghosts.length; id++) {
            const ghost = saved.ghosts[id];
            if (!validActor(ghost, maze) || ['active', 'returning'].indexOf(ghost.state) < 0 || !integer(ghost.releaseMs, 0, 2400) ||
                ghost.forced !== '' && DIRECTIONS.indexOf(ghost.forced) < 0 ||
                ghost.releaseMs && (ghost.state !== 'active' || ghost.cell !== HOMES[id] || ghost.next !== ghost.cell)) return null;
        }
        const remaining = saved.pellets.filter(Boolean).length;
        if (saved.over ? saved.lives !== 0 || !remaining || saved.lastEvent !== 'lost' :
            !saved.lives || saved.lastEvent === 'lost' || (saved.phase === 'cleared' ? remaining !== 0 || saved.lastEvent !== 'cleared' : !remaining)) return null;
        if (saved.phase === 'ready' && (saved.player.cell !== START || saved.player.next !== START || saved.powerMs)) return null;
        const game = Object.create(Game.prototype);
        Object.assign(game, {
            difficulty: saved.difficulty, rng: saved.rng, level: saved.level, score: saved.score, nextLife: saved.nextLife,
            lives: saved.lives, maze, pellets: saved.pellets.slice(), remaining, player: copyActor(saved.player), wanted: saved.wanted,
            ghosts: saved.ghosts.map((ghost) => Object.assign(copyActor(ghost), { state: ghost.state, releaseMs: ghost.releaseMs, forced: ghost.forced })),
            mode: saved.mode, modeMs: saved.modeMs, powerMs: saved.powerMs, combo: saved.combo,
            phase: saved.phase, over: saved.over, lastEvent: saved.lastEvent, revision: 0,
        });
        return game;
    }
}

module.exports = { Game, DIFFICULTIES, position };

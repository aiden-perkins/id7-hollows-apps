'use strict';

const W = 1000, H = 500, R = 8, PADDLE_Y = 450, PADDLE_H = 14, PADDLE_SPEED = 1100;
const ATTACHED_Y = PADDLE_Y - R - 2, COLS = 10, ROWS = 5;
const BRICK_X = 54, BRICK_Y = 50, BRICK_W = 82, BRICK_H = 24, GAP_X = 8, GAP_Y = 10;
const DIFFICULTIES = {
    easy: { title: 'Easy', width: 176, ball: 330, maximum: 700, lives: 5 },
    normal: { title: 'Normal', width: 144, ball: 390, maximum: 850, lives: 3 },
    hard: { title: 'Hard', width: 112, ball: 450, maximum: 980, lives: 3 },
};
const LEVELS = [
    { title: 'Opening', rows: ['1111111111', '1111111111', '1111111111', '1111111111', '1111111111'] },
    { title: 'Windows', rows: ['2211221122', '1111111111', '1100110011', '0111001110', '1111111111'] },
    { title: 'Chevron', rows: ['3000000003', '2210000122', '0122112210', '0012222100', '0001111000'] },
    { title: 'Columns', rows: ['2122122122', '2022022022', '2122122122', '1011011011', '1011011011'] },
    { title: 'Fortress', rows: ['0333333330', '2211221122', '2200000022', '2211221122', '0111111110'] },
    { title: 'Final wall', rows: ['3333333333', '2323232323', '2222222222', '1212121212', '1111111111'] },
];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const layout = (level) => LEVELS[level - 1].rows.join('').split('').map(Number);
const rect = (id) => ({ x: BRICK_X + id % COLS * (BRICK_W + GAP_X), y: BRICK_Y + Math.floor(id / COLS) * (BRICK_H + GAP_Y), w: BRICK_W, h: BRICK_H });

function distance(x, y, brick) {
    const dx = x - clamp(x, brick.x, brick.x + brick.w), dy = y - clamp(y, brick.y, brick.y + brick.h);
    return { dx, dy, squared: dx * dx + dy * dy };
}

class Game {
    constructor(difficulty, seed) {
        this.difficulty = Object.prototype.hasOwnProperty.call(DIFFICULTIES, difficulty) ? difficulty : 'normal';
        this.rng = (seed >>> 0) || 0x6d2b79f5;
        this.level = 1; this.bricks = layout(this.level); this.lives = DIFFICULTIES[this.difficulty].lives;
        this.score = 0; this.paddle = W / 2; this.target = W / 2;
        this.phase = 'launch'; this.over = false; this.won = false; this.lastEvent = 'start'; this.revision = 0;
        this.attach();
    }

    width() { return DIFFICULTIES[this.difficulty].width; }
    remaining() { return this.bricks.filter((hp) => hp > 0).length; }
    launchSpeed() { return Math.min(DIFFICULTIES[this.difficulty].maximum, DIFFICULTIES[this.difficulty].ball + (this.level - 1) * 26); }
    attach() { this.ball = { x: this.paddle, y: ATTACHED_Y, vx: 0, vy: 0 }; }

    random() {
        let x = this.rng;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        this.rng = x >>> 0;
        return this.rng / 4294967296;
    }

    setPaddle(x) {
        if (this.over || !Number.isFinite(x)) return false;
        const target = clamp(x, this.width() / 2, W - this.width() / 2);
        if (target === this.target) return false;
        this.target = target; this.revision++;
        return true;
    }

    nudge(amount) { return this.setPaddle(this.target + amount); }

    launch() {
        if (this.over || ['launch', 'cleared'].indexOf(this.phase) < 0) return false;
        if (this.phase === 'cleared') { this.level++; this.bricks = layout(this.level); }
        const speed = this.launchSpeed();
        let horizontal = Math.sin((this.random() * 2 - 1) * 0.45);
        if (Math.abs(horizontal) < 0.18) horizontal = (horizontal < 0 ? -1 : 1) * 0.18;
        this.ball = { x: this.paddle, y: ATTACHED_Y, vx: speed * horizontal, vy: -speed * Math.sqrt(1 - horizontal * horizontal) };
        this.phase = 'playing'; this.revision++;
        return true;
    }

    stabilize(speed) {
        const ball = this.ball, length = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        let x = ball.vx / length, y = ball.vy / length;
        // Keep both axes moving so a nearly flat return cannot strand the ball.
        if (Math.abs(y) < 0.24) { y = (y < 0 ? -1 : 1) * 0.24; x = (x < 0 ? -1 : 1) * Math.sqrt(1 - y * y); }
        if (Math.abs(x) < 0.12) { x = (x < 0 ? -1 : 1) * 0.12; y = (y < 0 ? -1 : 1) * Math.sqrt(1 - x * x); }
        ball.vx = x * speed; ball.vy = y * speed;
    }

    bouncePaddle(center, velocity) {
        const ball = this.ball;
        const speed = Math.min(DIFFICULTIES[this.difficulty].maximum, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 12);
        const offset = clamp((ball.x - center) / (this.width() / 2 + R) + velocity / PADDLE_SPEED * 0.12, -1, 1);
        let horizontal = Math.sin(offset * Math.PI * 65 / 180);
        if (Math.abs(horizontal) < 0.15) horizontal = (ball.vx < 0 ? -1 : 1) * 0.15;
        ball.vx = speed * horizontal;
        ball.vy = -speed * Math.sqrt(1 - horizontal * horizontal);
        ball.y = PADDLE_Y - R - 0.001;
    }

    miss() {
        this.lives--; this.over = this.lives === 0;
        this.phase = this.over ? 'finished' : 'launch';
        this.lastEvent = this.over ? 'lost' : 'life';
        this.attach(); this.revision++;
    }

    clearLevel() {
        this.score += 250 * this.level;
        this.lives = Math.min(5, this.lives + 1);
        this.won = this.level === LEVELS.length; this.over = this.won;
        this.phase = this.won ? 'finished' : 'cleared'; this.lastEvent = 'cleared';
        this.attach(); this.revision++;
    }

    integrate(seconds, oldPaddle) {
        const difficulty = DIFFICULTIES[this.difficulty], velocity = (this.paddle - oldPaddle) / seconds;
        // Each substep travels at most half a ball radius, even after a speed increase.
        const count = Math.max(1, Math.ceil(difficulty.maximum * seconds / (R / 2)));
        const dt = seconds / count, damaged = new Set();
        for (let step = 0; step < count && this.phase === 'playing'; step++) {
            const ball = this.ball, oldX = ball.x, oldY = ball.y;
            ball.x += ball.vx * dt; ball.y += ball.vy * dt;
            if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
            else if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); }
            if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); }
            if (ball.y >= H + R) { this.miss(); break; }

            if (ball.vy > 0 && oldY <= PADDLE_Y - R && ball.y >= PADDLE_Y - R) {
                const fraction = (PADDLE_Y - R - oldY) / (ball.y - oldY);
                const hitX = oldX + (ball.x - oldX) * fraction;
                const center = oldPaddle + velocity * (step + fraction) * dt;
                if (Math.abs(hitX - center) <= this.width() / 2 + R) {
                    ball.x = hitX;
                    this.bouncePaddle(center, velocity);
                }
            }

            const contacts = [];
            for (let id = 0; id < this.bricks.length; id++) {
                if (!this.bricks[id]) continue;
                const brick = rect(id);
                if (distance(ball.x, ball.y, brick).squared <= R * R) {
                    const normal = distance(oldX, oldY, brick), length = Math.sqrt(normal.squared);
                    contacts.push({ id, x: length ? normal.dx / length : 0, y: length ? normal.dy / length : 0 });
                }
            }
            if (!contacts.length) continue;
            let nx = 0, ny = 0, hits = 0;
            contacts.forEach((contact) => {
                nx += contact.x; ny += contact.y;
                // A shared edge or a second overlap in this tick cannot damage a brick twice.
                if (!damaged.has(contact.id)) {
                    damaged.add(contact.id); this.bricks[contact.id]--; hits++;
                    this.score += (this.bricks[contact.id] ? 10 : 30) * this.level;
                }
            });
            if (!this.remaining()) { this.clearLevel(); break; }
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy), length = Math.sqrt(nx * nx + ny * ny);
            if (length) { nx /= length; ny /= length; }
            let dot = ball.vx * nx + ball.vy * ny;
            if (!length || dot >= -1e-7) { nx = -ball.vx / speed; ny = -ball.vy / speed; dot = -speed; }
            ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
            // Return to the last non-overlapping position rather than pushing into a neighboring brick.
            ball.x = oldX; ball.y = oldY;
            this.stabilize(Math.min(difficulty.maximum, speed + hits * 6));
        }
    }

    tick(ms, freezeBall) {
        if (this.over || !finite(ms, 1, 50)) return;
        const oldPaddle = this.paddle, seconds = ms / 1000;
        this.paddle += clamp(this.target - this.paddle, -PADDLE_SPEED * seconds, PADDLE_SPEED * seconds);
        if (this.phase !== 'playing') this.attach();
        else if (!freezeBall) this.integrate(seconds, oldPaddle);
        if (oldPaddle !== this.paddle || this.phase === 'playing' && !freezeBall) this.revision++;
    }

    snapshot() {
        return {
            version: 1, difficulty: this.difficulty, rng: this.rng, level: this.level, bricks: this.bricks.slice(),
            score: this.score, lives: this.lives, paddle: this.paddle, target: this.target, ball: Object.assign({}, this.ball),
            phase: this.phase, over: this.over, won: this.won, lastEvent: this.lastEvent,
        };
    }

    static restore(saved) {
        if (!saved || saved.version !== 1 || !Object.prototype.hasOwnProperty.call(DIFFICULTIES, saved.difficulty) ||
            !integer(saved.rng, 1, 0xffffffff) || !integer(saved.level, 1, LEVELS.length) ||
            !integer(saved.score, 0, Number.MAX_SAFE_INTEGER) || saved.score % 10 !== 0 || !integer(saved.lives, 0, 5)) return null;
        const difficulty = DIFFICULTIES[saved.difficulty], initial = layout(saved.level), half = difficulty.width / 2, ball = saved.ball;
        if (!Array.isArray(saved.bricks) || saved.bricks.length !== COLS * ROWS || !saved.bricks.every((hp, id) => integer(hp, 0, initial[id])) ||
            !finite(saved.paddle, half, W - half) || !finite(saved.target, half, W - half) || !ball ||
            !finite(ball.x, R, W - R) || !finite(ball.y, R, H + R) ||
            !finite(ball.vx, -difficulty.maximum, difficulty.maximum) || !finite(ball.vy, -difficulty.maximum, difficulty.maximum) ||
            ['launch', 'playing', 'cleared', 'finished'].indexOf(saved.phase) < 0 || typeof saved.over !== 'boolean' ||
            typeof saved.won !== 'boolean' || ['start', 'life', 'cleared', 'lost'].indexOf(saved.lastEvent) < 0 ||
            saved.over !== (saved.phase === 'finished')) return null;
        const remaining = saved.bricks.filter((hp) => hp > 0).length;
        if (saved.won) {
            if (!saved.over || saved.level !== LEVELS.length || remaining || !saved.lives || saved.lastEvent !== 'cleared') return null;
        } else if (saved.over) {
            if (saved.lives !== 0 || !remaining || saved.lastEvent !== 'lost') return null;
        } else if (!saved.lives || saved.lastEvent === 'lost' || (saved.phase === 'cleared' ?
            remaining !== 0 || saved.level === LEVELS.length || saved.lastEvent !== 'cleared' : !remaining)) return null;
        if (saved.phase === 'playing') {
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            const minimum = Math.min(difficulty.maximum, difficulty.ball + (saved.level - 1) * 26);
            if (Math.abs(ball.vx) < 1 || Math.abs(ball.vy) < 1 || speed < minimum - 0.01 || speed > difficulty.maximum + 0.01 ||
                saved.bricks.some((hp, id) => hp && distance(ball.x, ball.y, rect(id)).squared < (R - 0.01) * (R - 0.01))) return null;
        } else if (ball.x !== saved.paddle || ball.y !== ATTACHED_Y || ball.vx !== 0 || ball.vy !== 0) return null;
        const game = Object.create(Game.prototype);
        Object.assign(game, {
            difficulty: saved.difficulty, rng: saved.rng, level: saved.level, bricks: saved.bricks.slice(),
            score: saved.score, lives: saved.lives, paddle: saved.paddle, target: saved.target,
            ball: { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy }, phase: saved.phase,
            over: saved.over, won: saved.won, lastEvent: saved.lastEvent, revision: 0,
        });
        return game;
    }
}

module.exports = { Game, DIFFICULTIES, LEVELS, W, H, R, PADDLE_Y, PADDLE_H, COLS, ROWS, rect };

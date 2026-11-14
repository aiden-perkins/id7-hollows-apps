'use strict';

const W = 1000, H = 500, R = 8, PADDLE_W = 14, PADDLE_H = 96, PLAYER_X = 36;
const CPU_X = W - PLAYER_X - PADDLE_W, PLAYER_PLANE = PLAYER_X + PADDLE_W + R, CPU_PLANE = CPU_X - R;
const HALF = PADDLE_H / 2, PLAYER_SPEED = 900, EPS = 1e-7;
const DIFFICULTIES = {
    easy: { title: 'Easy', speed: 260, reaction: 180, error: 46, ball: 340, maximum: 720 },
    normal: { title: 'Normal', speed: 360, reaction: 120, error: 28, ball: 400, maximum: 850 },
    hard: { title: 'Hard', speed: 470, reaction: 75, error: 12, ball: 460, maximum: 1000 },
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const toward = (value, target, amount) => value + clamp(target - value, -amount, amount);

class Game {
    constructor(difficulty, goal, seed) {
        this.difficulty = Object.prototype.hasOwnProperty.call(DIFFICULTIES, difficulty) ? difficulty : 'normal';
        this.goal = [5, 11, 21].indexOf(goal) >= 0 ? goal : 11;
        this.rng = (seed >>> 0) || 0x6d2b79f5;
        this.player = H / 2; this.target = H / 2; this.cpu = H / 2; this.cpuTarget = H / 2; this.aiMs = 0;
        this.ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
        this.playerScore = 0; this.cpuScore = 0; this.rally = 0; this.longest = 0;
        this.nextServe = this.random() < 0.5 ? -1 : 1;
        this.phase = 'serve'; this.over = false; this.winner = ''; this.lastPoint = ''; this.revision = 0;
    }

    random() {
        let x = this.rng;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        this.rng = x >>> 0;
        return this.rng / 4294967296;
    }

    setPlayer(y) {
        if (this.over || !Number.isFinite(y)) return false;
        const target = clamp(y, HALF, H - HALF);
        if (target === this.target) return false;
        this.target = target; this.revision++;
        return true;
    }

    nudge(amount) { return this.setPlayer(this.target + amount); }

    serve() {
        if (this.over || this.phase !== 'serve') return false;
        const angle = (this.random() * 2 - 1) * 0.4, speed = DIFFICULTIES[this.difficulty].ball;
        this.ball = { x: W / 2, y: H / 2, vx: this.nextServe * speed * Math.cos(angle), vy: speed * Math.sin(angle) };
        this.phase = 'playing'; this.aiMs = 0; this.rally = 0; this.revision++;
        return true;
    }

    aim() {
        const ball = this.ball, difficulty = DIFFICULTIES[this.difficulty];
        if (ball.vx <= 0) { this.cpuTarget = H / 2; return; }
        const time = Math.max(0, (CPU_PLANE - ball.x) / ball.vx), span = H - 2 * R;
        const projected = ball.y + ball.vy * time - R;
        const folded = ((projected % (span * 2)) + span * 2) % (span * 2);
        const intercept = R + (folded <= span ? folded : span * 2 - folded);
        this.cpuTarget = clamp(intercept + (this.random() * 2 - 1) * difficulty.error, HALF, H - HALF);
    }

    bounce(side, center, velocity) {
        const ball = this.ball, difficulty = DIFFICULTIES[this.difficulty];
        const speed = Math.min(difficulty.maximum, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 24);
        const offset = clamp((ball.y - center) / (HALF + R) + velocity / PLAYER_SPEED * 0.12, -1, 1);
        const angle = offset * Math.PI * 65 / 180;
        ball.vx = (side === 'player' ? 1 : -1) * speed * Math.cos(angle);
        ball.vy = speed * Math.sin(angle);
        ball.x = side === 'player' ? PLAYER_PLANE + 0.001 : CPU_PLANE - 0.001;
        this.rally = Math.min(Number.MAX_SAFE_INTEGER, this.rally + 1);
        this.longest = Math.max(this.longest, this.rally);
    }

    point(side) {
        if (side === 'player') this.playerScore++;
        else this.cpuScore++;
        this.lastPoint = side;
        this.nextServe = side === 'player' ? 1 : -1;
        this.ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
        this.rally = 0; this.aiMs = 0; this.cpuTarget = H / 2;
        this.over = this.playerScore === this.goal || this.cpuScore === this.goal;
        this.phase = this.over ? 'finished' : 'serve';
        this.winner = this.over ? side : '';
        this.revision++;
    }

    integrate(seconds, oldPlayer, oldCpu) {
        const playerVelocity = (this.player - oldPlayer) / seconds, cpuVelocity = (this.cpu - oldCpu) / seconds;
        let remaining = seconds, elapsed = 0;
        // Sweep to each collision plane so a fast ball cannot jump through a paddle.
        for (let iteration = 0; iteration < 8 && remaining > EPS && this.phase === 'playing'; iteration++) {
            const ball = this.ball;
            let time = remaining, event = null;
            const choose = (candidate, kind) => {
                if (candidate >= -EPS && candidate <= time + EPS) { time = Math.max(0, Math.min(remaining, candidate)); event = kind; }
            };
            if (ball.vy < 0) choose((R - ball.y) / ball.vy, 'top');
            else if (ball.vy > 0) choose((H - R - ball.y) / ball.vy, 'bottom');
            if (ball.vx < 0) {
                if (ball.x >= PLAYER_PLANE - EPS) {
                    const hit = (PLAYER_PLANE - ball.x) / ball.vx;
                    const center = oldPlayer + playerVelocity * (elapsed + hit);
                    if (Math.abs(ball.y + ball.vy * hit - center) <= HALF + R) choose(hit, 'player');
                }
                choose((-R - ball.x) / ball.vx, 'cpuPoint');
            } else if (ball.vx > 0) {
                if (ball.x <= CPU_PLANE + EPS) {
                    const hit = (CPU_PLANE - ball.x) / ball.vx;
                    const center = oldCpu + cpuVelocity * (elapsed + hit);
                    if (Math.abs(ball.y + ball.vy * hit - center) <= HALF + R) choose(hit, 'cpu');
                }
                choose((W + R - ball.x) / ball.vx, 'playerPoint');
            }
            ball.x += ball.vx * time; ball.y += ball.vy * time;
            remaining -= time; elapsed += time;
            if (!event) break;
            if (event === 'top') { ball.y = R + 0.001; ball.vy = Math.abs(ball.vy); }
            else if (event === 'bottom') { ball.y = H - R - 0.001; ball.vy = -Math.abs(ball.vy); }
            else if (event === 'player') this.bounce('player', oldPlayer + playerVelocity * elapsed, playerVelocity);
            else if (event === 'cpu') this.bounce('cpu', oldCpu + cpuVelocity * elapsed, cpuVelocity);
            else { this.point(event === 'playerPoint' ? 'player' : 'cpu'); break; }
        }
    }

    tick(ms, freezeBall) {
        if (this.over || !finite(ms, 1, 50)) return;
        const difficulty = DIFFICULTIES[this.difficulty], seconds = ms / 1000;
        const oldPlayer = this.player, oldCpu = this.cpu;
        if (this.phase === 'playing' && !freezeBall) {
            this.aiMs = Math.max(0, this.aiMs - ms);
            if (!this.aiMs) { this.aim(); this.aiMs = difficulty.reaction; }
        } else if (this.phase === 'serve') this.cpuTarget = H / 2;
        this.player = toward(this.player, this.target, PLAYER_SPEED * seconds);
        if (!freezeBall) this.cpu = toward(this.cpu, this.cpuTarget, difficulty.speed * seconds);
        if (this.phase === 'playing' && !freezeBall) this.integrate(seconds, oldPlayer, oldCpu);
        if (this.player !== oldPlayer || this.cpu !== oldCpu || this.phase === 'playing' && !freezeBall) this.revision++;
    }

    snapshot() {
        return {
            version: 1, difficulty: this.difficulty, goal: this.goal, rng: this.rng,
            player: this.player, target: this.target, cpu: this.cpu, cpuTarget: this.cpuTarget, aiMs: this.aiMs,
            ball: Object.assign({}, this.ball), playerScore: this.playerScore, cpuScore: this.cpuScore,
            rally: this.rally, longest: this.longest, nextServe: this.nextServe,
            phase: this.phase, over: this.over, winner: this.winner, lastPoint: this.lastPoint,
        };
    }

    static restore(saved) {
        if (!saved || saved.version !== 1 || !Object.prototype.hasOwnProperty.call(DIFFICULTIES, saved.difficulty) ||
            [5, 11, 21].indexOf(saved.goal) < 0 || !integer(saved.rng, 1, 0xffffffff)) return null;
        const difficulty = DIFFICULTIES[saved.difficulty], ball = saved.ball;
        if (!finite(saved.player, HALF, H - HALF) || !finite(saved.target, HALF, H - HALF) ||
            !finite(saved.cpu, HALF, H - HALF) || !finite(saved.cpuTarget, HALF, H - HALF) || !finite(saved.aiMs, 0, difficulty.reaction) ||
            !ball || !finite(ball.x, -R, W + R) || !finite(ball.y, R, H - R) ||
            !finite(ball.vx, -difficulty.maximum, difficulty.maximum) || !finite(ball.vy, -difficulty.maximum, difficulty.maximum) ||
            !integer(saved.playerScore, 0, saved.goal) || !integer(saved.cpuScore, 0, saved.goal) ||
            !integer(saved.rally, 0, Number.MAX_SAFE_INTEGER) || !integer(saved.longest, saved.rally, Number.MAX_SAFE_INTEGER) ||
            [1, -1].indexOf(saved.nextServe) < 0 || ['serve', 'playing', 'finished'].indexOf(saved.phase) < 0 ||
            typeof saved.over !== 'boolean' || ['', 'player', 'cpu'].indexOf(saved.winner) < 0 ||
            ['', 'player', 'cpu'].indexOf(saved.lastPoint) < 0) return null;
        const finished = saved.playerScore === saved.goal || saved.cpuScore === saved.goal;
        if (saved.over !== finished || (saved.phase === 'finished') !== finished ||
            saved.playerScore === saved.goal && saved.cpuScore === saved.goal ||
            (finished ? saved.winner !== (saved.playerScore === saved.goal ? 'player' : 'cpu') : saved.winner !== '') ||
            (saved.playerScore + saved.cpuScore === 0 ? saved.lastPoint !== '' : saved.lastPoint === '')) return null;
        if (finished && saved.lastPoint !== saved.winner ||
            saved.lastPoint === 'player' && (!saved.playerScore || saved.nextServe !== 1) ||
            saved.lastPoint === 'cpu' && (!saved.cpuScore || saved.nextServe !== -1)) return null;
        if (saved.phase === 'playing') {
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (Math.abs(ball.vx) < 1 || speed < difficulty.ball - 0.01 || speed > difficulty.maximum + 0.01) return null;
        } else if (ball.x !== W / 2 || ball.y !== H / 2 || ball.vx !== 0 || ball.vy !== 0 || saved.rally !== 0) return null;
        const game = Object.create(Game.prototype);
        Object.assign(game, {
            difficulty: saved.difficulty, goal: saved.goal, rng: saved.rng,
            player: saved.player, target: saved.target, cpu: saved.cpu, cpuTarget: saved.cpuTarget, aiMs: saved.aiMs,
            ball: { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy }, playerScore: saved.playerScore, cpuScore: saved.cpuScore,
            rally: saved.rally, longest: saved.longest, nextServe: saved.nextServe,
            phase: saved.phase, over: saved.over, winner: saved.winner, lastPoint: saved.lastPoint, revision: 0,
        });
        return game;
    }
}

module.exports = { Game, DIFFICULTIES, W, H, R, PADDLE_W, PADDLE_H, PLAYER_X, CPU_X };

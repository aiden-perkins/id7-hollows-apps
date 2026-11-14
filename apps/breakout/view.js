'use strict';

const { DIFFICULTIES, LEVELS, W: GW, H: GH, R, PADDLE_Y, PADDLE_H, COLS, rect } = require('./game');
const W = 1600, H = 520, COURT = { x: 368, y: 50, w: 864, h: 432 };
const C = {
    bg: '#080e18', court: '#091725', panel: '#111c2c', edge: '#293e54', muted: '#8d9eb5', text: '#f1f6ff',
    accent: '#77d7f2', gold: '#efbd65', good: '#88dfad', bad: '#ee9187', disabled: '#536176',
};
const BRICK_COLORS = ['#e9858c', '#dfad66', '#95cf8d', '#6dbed5', '#9b96dd'];

function text(cv, value, x, y, size, color, options) {
    cv.text(String(value), x, y, size, color || C.text, Object.assign({ literal: true }, options));
}

function button(cv, x, y, width, label, key, action, enabled, accent) {
    const color = enabled ? accent || C.text : C.disabled;
    cv.roundRect(x, y, width, 58, 9, accent && enabled ? '#193244' : C.panel);
    cv.strokeRoundRect(x, y, width, 58, 9, accent && enabled ? 2 : 1, accent && enabled ? accent : C.edge);
    if (key === 'left' || key === 'right') {
        const cx = x + width / 2, cy = y + 29, direction = key === 'left' ? -1 : 1;
        cv.line(cx - direction * 12, cy, cx + direction * 12, cy, 4, color);
        cv.line(cx + direction * 12, cy, cx + direction * 2, cy - 10, 4, color);
        cv.line(cx + direction * 12, cy, cx + direction * 2, cy + 10, 4, color);
    } else text(cv, label, x + width / 2, y + 36, 21, color, { align: 'center' });
    if (enabled) cv.target(x, y, width, 58, () => action(key), key + ':' + x + ':' + y, 9);
}

function paddleAt(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < COURT.x || x >= COURT.x + COURT.w || y < COURT.y || y >= COURT.y + COURT.h) return null;
    return (x - COURT.x) * GW / COURT.w;
}

function draw(cv, game, state, action) {
    cv.clear(C.bg);
    if (cv.chrome) cv.chrome.tabs = { tabs: ['Breakout'], sel: 0 };
    const left = 144, right = 1268, width = 188;
    const playing = !!(state.going && game && !game.over);
    const launchable = playing && (game.phase === 'launch' || game.phase === 'cleared');
    const difficulty = DIFFICULTIES[game ? game.difficulty : 'normal'];
    const score = game ? game.score : 0;

    cv.roundRect(left, 50, width, 146, 11, C.panel);
    text(cv, 'Score', left + 18, 84, 20, C.accent);
    text(cv, score, left + 18, 139, Math.min(46, Math.floor(250 / String(score).length)), C.text, { font: 'bold' });
    text(cv, 'Best  ' + state.best, left + 18, 175, 19, C.muted);
    cv.roundRect(left, 210, width, 124, 11, C.panel);
    text(cv, 'Lives', left + 18, 244, 20, C.muted);
    text(cv, game ? game.lives : 3, left + 18, 299, 36, C.gold, { font: 'bold' });
    text(cv, 'Level', left + 108, 244, 20, C.muted);
    text(cv, (game ? game.level : 1) + '/' + LEVELS.length, left + 108, 299, 30, C.text, { font: 'bold' });

    // The kit moves logical y < 38 into its header; the full court stays below it.
    cv.roundRect(COURT.x - 8, COURT.y - 8, COURT.w + 16, COURT.h + 16, 10, C.edge);
    cv.fillRect(COURT.x, COURT.y, COURT.w, COURT.h, C.court);
    cv.clip(COURT.x, COURT.y, COURT.w, COURT.h);
    if (game) {
        const sx = COURT.w / GW, sy = COURT.h / GH;
        game.bricks.forEach((hp, id) => {
            if (!hp) return;
            const brick = rect(id), x = COURT.x + brick.x * sx, y = COURT.y + brick.y * sy;
            const w = brick.w * sx, h = brick.h * sy;
            cv.roundRect(x, y, w, h, 3, BRICK_COLORS[Math.floor(id / COLS)]);
            cv.fillRect(x + 3, y + 3, w - 6, 2, '#ffffff55');
            if (hp > 1) for (let mark = 0; mark < hp; mark++) cv.fillRect(x + w / 2 - hp * 4 + mark * 8 + 1, y + h - 7, 5, 3, '#ffffffdd');
        });
        const paddleWidth = game.width();
        cv.roundRect(COURT.x + (game.paddle - paddleWidth / 2) * sx, COURT.y + PADDLE_Y * sy, paddleWidth * sx, PADDLE_H * sy, 4, C.accent);
        if (playing && Math.abs(game.target - game.paddle) > 5) cv.fillRect(COURT.x + game.target * sx - 2, COURT.y + (PADDLE_Y + 23) * sy, 4, 8, '#77d7f288');
        cv.roundRect(COURT.x + (game.ball.x - R) * sx, COURT.y + (game.ball.y - R) * sy, 2 * R * sx, 2 * R * sy, 4, C.text);
    }
    cv.noclip();

    button(cv, left, 358, width, game && game.phase === 'cleared' ? 'Next level' : 'Launch', 'launch', action, launchable, C.accent);
    button(cv, left, 440, 90, '', 'left', action, playing);
    button(cv, left + 98, 440, 90, '', 'right', action, playing);
    cv.roundRect(right, 50, width, 146, 11, C.panel);
    text(cv, difficulty.title, right + 18, 84, 24, C.text, { font: 'bold' });
    text(cv, 'Bricks left', right + 18, 119, 20, C.muted);
    text(cv, game ? game.remaining() : 50, right + 18, 176, 46, C.gold, { font: 'bold' });
    cv.roundRect(right, 210, width, 124, 11, C.panel);
    text(cv, LEVELS[(game ? game.level : 1) - 1].title, right + 18, 244, 22, C.text, { font: 'bold' });
    text(cv, 'Marked bricks', right + 18, 280, 19, C.muted);
    text(cv, 'need extra hits', right + 18, 310, 19, C.muted);
    button(cv, right, 358, width, 'New game', 'new', action, !state.driving);
    button(cv, right, 440, width, state.going ? 'Pause / menu' : 'Menu', 'menu', action, true);

    let status = game && game.over ? game.won ? 'All six levels cleared' : 'No lives left' : game && game.phase === 'cleared' ?
        'Level cleared - continue when ready' : game && game.phase === 'launch' ?
        game.lastEvent === 'life' ? 'Life lost - launch when ready' : 'Press Launch to begin' : 'Knob / tilt / court taps move the paddle';
    if (state.saveError) status = 'Save failed - progress is still in memory';
    text(cv, status, W / 2, 511, 19, state.saveError || game && game.over && !game.won ? C.bad : game && game.won ? C.good : C.muted, { align: 'center' });

    if (!state.going || game && game.over) {
        cv.fillRect(COURT.x, COURT.y, COURT.w, COURT.h, '#080e18c9');
        const x = W / 2 - 180, y = 164, finished = state.going && game && game.over;
        cv.roundRect(x, y, 360, 218, 12, '#182738');
        cv.strokeRoundRect(x, y, 360, 218, 12, 1, '#4b5c70');
        const title = state.driving ? 'Parked only' : finished ? game.won ? 'You win!' : 'Game over' : game ? 'Paused' : 'Ready to play';
        const detail = state.driving ? 'Resume when parked' : finished ? 'Score  ' + game.score : 'Ready when you are';
        text(cv, title, W / 2, y + 50, 32, finished && game.won ? C.good : C.text, { align: 'center', font: 'bold' });
        text(cv, detail, W / 2, y + 92, 24, C.muted, { align: 'center' });
        const fresh = !game || finished;
        button(cv, x + 28, y + 132, 304, fresh ? 'New game' : 'Resume', fresh ? 'new' : 'resume', action, !state.driving, C.accent);
    } else if (state.ready) {
        cv.roundRect(W / 2 - 96, 270, 192, 76, 11, '#182d3d');
        text(cv, 'Ready', W / 2, 320, 34, C.accent, { align: 'center', font: 'bold' });
    } else if (launchable) {
        const x = W / 2 - 146, y = 252, next = game.phase === 'cleared';
        cv.roundRect(x, y, 292, 156, 12, '#142638');
        text(cv, next ? 'Level cleared!' : game.lastEvent === 'life' ? 'Life lost' : 'Ready to play', W / 2, y + 38, 27, C.text, { align: 'center', font: 'bold' });
        text(cv, next ? 'Level bonus awarded' : 'Move the paddle, then launch', W / 2, y + 72, 19, C.muted, { align: 'center' });
        button(cv, x + 28, y + 88, 236, next ? 'Next level' : 'Launch', 'launch', action, true, C.accent);
    }
    return cv;
}

module.exports = { draw, paddleAt, W, H };

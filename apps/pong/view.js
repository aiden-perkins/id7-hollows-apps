'use strict';

const { DIFFICULTIES, W: GW, H: GH, R, PADDLE_W, PADDLE_H, PLAYER_X, CPU_X } = require('./game');
const W = 1600, H = 520;
const COURT = { x: 368, y: 50, w: 864, h: 432 };
const C = {
    bg: '#080e18', court: '#091725', panel: '#111c2c', edge: '#293e54', muted: '#8d9eb5', text: '#f1f6ff',
    player: '#77d7f2', cpu: '#efbd65', disabled: '#536176', good: '#88dfad', bad: '#ee9187',
};

function text(cv, value, x, y, size, color, options) {
    cv.text(String(value), x, y, size, color || C.text, Object.assign({ literal: true }, options));
}

function button(cv, x, y, width, label, key, action, enabled, accent) {
    const color = enabled ? accent || C.text : C.disabled;
    cv.roundRect(x, y, width, 58, 9, accent && enabled ? '#193244' : C.panel);
    cv.strokeRoundRect(x, y, width, 58, 9, accent && enabled ? 2 : 1, accent && enabled ? accent : C.edge);
    if (key === 'up' || key === 'down') {
        const cx = x + width / 2, cy = y + 29, direction = key === 'up' ? -1 : 1;
        cv.line(cx, cy - direction * 12, cx, cy + direction * 12, 4, color);
        cv.line(cx, cy + direction * 12, cx - 10, cy + direction * 2, 4, color);
        cv.line(cx, cy + direction * 12, cx + 10, cy + direction * 2, 4, color);
    } else text(cv, label, x + width / 2, y + 36, 21, color, { align: 'center' });
    if (enabled) cv.target(x, y, width, 58, () => action(key), key + ':' + x + ':' + y, 9);
}

function paddleAt(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < COURT.x || x >= COURT.x + COURT.w || y < COURT.y || y >= COURT.y + COURT.h) return null;
    return (y - COURT.y) * GH / COURT.h;
}

function draw(cv, game, state, action) {
    cv.clear(C.bg);
    if (cv.chrome) cv.chrome.tabs = { tabs: ['Pong'], sel: 0 };
    const left = 144, right = 1268, width = 188, playing = !!(state.going && game && !game.over);
    const serve = playing && game.phase === 'serve';
    const difficulty = DIFFICULTIES[game ? game.difficulty : 'normal'];

    cv.roundRect(left, 50, width, 138, 11, C.panel);
    text(cv, 'Your score', left + 18, 84, 20, C.player);
    text(cv, game ? game.playerScore : 0, left + 18, 160, 66, C.text, { font: 'bold' });
    cv.roundRect(right, 50, width, 138, 11, C.panel);
    text(cv, 'CPU score', right + 18, 84, 20, C.cpu);
    text(cv, game ? game.cpuScore : 0, right + 18, 160, 66, C.text, { font: 'bold' });

    // Keep the court below logical y = 38, which the kit moves into its header.
    cv.roundRect(COURT.x - 8, COURT.y - 8, COURT.w + 16, COURT.h + 16, 10, C.edge);
    cv.fillRect(COURT.x, COURT.y, COURT.w, COURT.h, C.court);
    cv.clip(COURT.x, COURT.y, COURT.w, COURT.h);
    for (let y = COURT.y + 10; y < COURT.y + COURT.h; y += 28) cv.fillRect(W / 2 - 2, y, 4, 14, '#2d4357');
    if (game) {
        const sx = COURT.w / GW, sy = COURT.h / GH;
        cv.roundRect(COURT.x + PLAYER_X * sx, COURT.y + (game.player - PADDLE_H / 2) * sy, PADDLE_W * sx, PADDLE_H * sy, 3, C.player);
        cv.roundRect(COURT.x + CPU_X * sx, COURT.y + (game.cpu - PADDLE_H / 2) * sy, PADDLE_W * sx, PADDLE_H * sy, 3, C.cpu);
        if (playing && Math.abs(game.target - game.player) > 5) cv.fillRect(COURT.x + 15, COURT.y + game.target * sy - 2, 10, 4, '#77d7f288');
        cv.roundRect(COURT.x + (game.ball.x - R) * sx, COURT.y + (game.ball.y - R) * sy, R * 2 * sx, R * 2 * sy, 4, C.text);
    }
    cv.noclip();

    button(cv, left, 218, width, 'Serve', 'serve', action, serve, C.player);
    button(cv, left, 302, width, '', 'up', action, playing);
    button(cv, left, 372, width, '', 'down', action, playing);
    text(cv, 'Knob / tilt: move', left, 478, 19, C.muted);

    cv.roundRect(right, 202, width, 152, 11, C.panel);
    text(cv, difficulty.title, right + 16, 235, 24, C.text, { font: 'bold' });
    text(cv, 'First to ' + (game ? game.goal : 11), right + 16, 268, 20, C.muted);
    text(cv, 'Rally  ' + (game ? game.rally : 0), right + 16, 303, 20, C.player);
    text(cv, 'Best rally  ' + state.best, right + 16, 335, 19, C.muted);
    button(cv, right, 370, width, 'New match', 'new', action, !state.driving);
    button(cv, right, 440, width, state.going ? 'Pause / menu' : 'Menu', 'menu', action, true);

    let status = game && game.over ? 'Start a new match when ready' : serve ?
        (game.lastPoint ? game.lastPoint === 'player' ? 'You scored - press Serve when ready' : 'CPU scored - press Serve when ready' : 'Press Serve to begin') :
        'Turn the knob or tap the court to move your paddle';
    if (state.saveError) status = 'Save failed - progress is still in memory';
    text(cv, status, W / 2, 511, 19, state.saveError ? C.bad : C.muted, { align: 'center' });

    if (!state.going || game && game.over) {
        cv.fillRect(COURT.x, COURT.y, COURT.w, COURT.h, '#080e18bd');
        const x = W / 2 - 180, y = 164, finished = state.going && game && game.over;
        cv.roundRect(x, y, 360, 218, 12, '#182738');
        cv.strokeRoundRect(x, y, 360, 218, 12, 1, '#4b5c70');
        const title = state.driving ? 'Parked only' : finished ? game.winner === 'player' ? 'You win!' : 'CPU wins' : game ? 'Paused' : 'Ready to play';
        const detail = state.driving ? 'Resume when parked' : finished ? game.playerScore + ' - ' + game.cpuScore : 'Ready when you are';
        text(cv, title, W / 2, y + 50, 32, finished && game.winner === 'player' ? C.good : C.text, { align: 'center', font: 'bold' });
        text(cv, detail, W / 2, y + 92, 24, C.muted, { align: 'center' });
        const fresh = !game || finished;
        button(cv, x + 28, y + 132, 304, fresh ? 'New match' : 'Resume', fresh ? 'new' : 'resume', action, !state.driving, C.player);
    } else if (state.ready) {
        cv.roundRect(W / 2 - 96, 228, 192, 76, 11, '#182d3d');
        text(cv, 'Ready', W / 2, 278, 34, C.player, { align: 'center', font: 'bold' });
    } else if (serve) {
        const x = W / 2 - 142, y = 176;
        cv.roundRect(x, y, 284, 180, 12, '#142638');
        text(cv, game.lastPoint ? game.lastPoint === 'player' ? 'Your point' : 'CPU point' : 'Ready to play', W / 2, y + 42, 27, C.text, { align: 'center', font: 'bold' });
        text(cv, 'Press or tap Serve', W / 2, y + 77, 20, C.muted, { align: 'center' });
        button(cv, x + 28, y + 100, 228, 'Serve', 'serve', action, true, C.player);
    }
    return cv;
}

module.exports = { draw, paddleAt, W, H };

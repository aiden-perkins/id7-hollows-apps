'use strict';

const { COLS, ROWS, DIRECTIONS, DELTAS, point } = require('./game');
const W = 1600, H = 520;
const C = {
    bg: '#080e18', panel: '#111c2c', edge: '#26364b', muted: '#8d9eb5', text: '#f1f6ff',
    accent: '#86eab1', disabled: '#536176', board: '#071610', grid: '#142a21', food: '#f07e78',
};
const BODY = ['#63d99a', '#53c68a', '#43b37a', '#359d6b', '#2c895e'];

function text(cv, value, x, y, size, color, options) {
    cv.text(String(value), x, y, size, color || C.text, Object.assign({ literal: true }, options));
}

function arrow(cv, heading, x, y, color) {
    const d = DELTAS[heading];
    const tx = x + d[0] * 13, ty = y + d[1] * 13;
    cv.line(x - d[0] * 12, y - d[1] * 12, tx, ty, 4, color);
    cv.line(tx, ty, tx - d[0] * 10 - d[1] * 9, ty - d[1] * 10 + d[0] * 9, 4, color);
    cv.line(tx, ty, tx - d[0] * 10 + d[1] * 9, ty - d[1] * 10 - d[0] * 9, 4, color);
}

function button(cv, x, y, width, label, key, action, enabled, accent) {
    const color = enabled ? accent ? C.accent : C.text : C.disabled;
    cv.roundRect(x, y, width, 58, 9, enabled && accent ? '#193b30' : C.panel);
    cv.strokeRoundRect(x, y, width, 58, 9, 1, enabled && accent ? '#3b7a5a' : C.edge);
    if (DIRECTIONS.indexOf(key) >= 0) arrow(cv, key, x + width / 2, y + 29, color);
    else text(cv, label, x + width / 2, y + 36, 22, color, { align: 'center' });
    if (enabled) cv.target(x, y, width, 58, () => action(key), key, 9);
}

function snake(cv, game, bx, by, size) {
    for (let i = game.body.length - 1; i >= 0; i--) {
        const p = point(game.body[i]), x = bx + p[0] * size, y = by + p[1] * size;
        const color = i === 0 ? C.accent : BODY[Math.min(BODY.length - 1, Math.floor(i * BODY.length / game.body.length))];
        if (i > 0) {
            const previous = point(game.body[i - 1]);
            // Edge wrapping connects across the boundary, not through the middle of the board.
            if (Math.abs(previous[0] - p[0]) === 1 && previous[1] === p[1]) {
                cv.fillRect(bx + Math.min(previous[0], p[0]) * size + size / 2, y + 6, size, size - 12, color);
            } else if (Math.abs(previous[1] - p[1]) === 1 && previous[0] === p[0]) {
                cv.fillRect(x + 6, by + Math.min(previous[1], p[1]) * size + size / 2, size - 12, size, color);
            }
        }
        cv.roundRect(x + 3, y + 3, size - 6, size - 6, 5, color);
    }
    const head = point(game.body[0]), x = bx + head[0] * size, y = by + head[1] * size;
    const eyes = {
        up: [[8, 6], [17, 6]], right: [[17, 7], [17, 17]],
        down: [[8, 17], [17, 17]], left: [[6, 7], [6, 17]],
    }[game.direction];
    eyes.forEach((p) => cv.fillRect(x + p[0], y + p[1], 4, 4, C.board));
}

function draw(cv, game, state, action) {
    cv.clear(C.bg);
    if (cv.chrome) cv.chrome.tabs = { tabs: ['Snake'], sel: 0 };
    const left = 180, right = 1184, width = 244;
    // Keep the board below logical y = 38, which the kit uses for its header.
    const bx = 464, by = 46, size = 28, bw = COLS * size, bh = ROWS * size;
    const playing = !!(state.going && game && !game.over);

    cv.roundRect(left, 46, width, 168, 12, C.panel);
    text(cv, 'Score', left + 20, 80, 22, C.muted);
    text(cv, game ? game.score : 0, left + 20, 139, 48, C.text, { font: 'bold' });
    text(cv, 'Best  ' + state.best, left + 20, 188, 22, C.muted);
    cv.roundRect(left, 230, width, 118, 12, C.panel);
    text(cv, 'Level', left + 20, 264, 20, C.muted);
    text(cv, game ? game.level() : 1, left + 20, 318, 36, C.text, { font: 'bold' });
    text(cv, 'Length', left + 130, 264, 20, C.muted);
    text(cv, game ? game.body.length : 4, left + 130, 318, 36, C.text, { font: 'bold' });
    text(cv, 'Tilt to steer', left + 2, 389, 21, C.muted);
    text(cv, 'Knob: turn', left + 2, 420, 21, C.muted);
    text(cv, 'Press: pause', left + 2, 451, 21, C.muted);

    cv.roundRect(bx - 8, by - 8, bw + 16, bh + 16, 8, C.edge);
    cv.fillRect(bx, by, bw, bh, C.board);
    if (state.grid) {
        for (let x = 1; x < COLS; x++) cv.fillRect(bx + x * size, by, 1, bh, C.grid);
        for (let y = 1; y < ROWS; y++) cv.fillRect(bx, by + y * size, bw, 1, C.grid);
    }
    if (game) {
        if (game.food !== null) {
            const p = point(game.food), x = bx + p[0] * size, y = by + p[1] * size;
            cv.roundRect(x + 5, y + 7, size - 10, size - 11, 6, C.food);
            cv.fillRect(x + 14, y + 3, 5, 5, C.accent);
            cv.fillRect(x + 8, y + 10, 4, 4, '#ffb4a8');
        }
        snake(cv, game, bx, by, size);
    }

    cv.roundRect(right, 46, width, 112, 12, C.panel);
    const difficulty = game ? game.difficulty : 'normal';
    text(cv, difficulty[0].toUpperCase() + difficulty.slice(1), right + 20, 79, 25, C.accent);
    text(cv, game && game.edges === 'wrap' ? 'Wrap around' : 'Solid walls', right + 20, 111, 21, C.muted);
    text(cv, game ? (1000 / game.interval()).toFixed(1) + ' cells / sec' : 'Tilt or tap to steer', right + 20, 141, 20, C.muted);
    button(cv, right + 74, 180, 96, '', 'up', action, playing);
    button(cv, right, 250, 108, '', 'left', action, playing);
    button(cv, right + 136, 250, 108, '', 'right', action, playing);
    button(cv, right + 74, 320, 96, '', 'down', action, playing);
    button(cv, right, 402, width, state.going ? 'Pause / menu' : 'Menu', 'menu', action, true);

    if (state.saveError) text(cv, 'Save failed - progress is still in memory', bx + bw / 2, 516, 19, '#ed8c8c', { align: 'center' });
    if (playing && state.ready) {
        cv.roundRect(bx + bw / 2 - 98, 232, 196, 76, 12, '#142b22');
        text(cv, 'Ready', bx + bw / 2, 282, 34, C.accent, { align: 'center', font: 'bold' });
    }
    if (!playing) {
        cv.fillRect(bx, by, bw, bh, '#06120dcc');
        const x = bx + bw / 2 - 180, y = 164;
        cv.roundRect(x, y, 360, 210, 12, '#142b22');
        cv.strokeRoundRect(x, y, 360, 210, 12, 1, '#38694e');
        const fresh = !game || game.over;
        const title = game && game.won ? 'Board cleared!' : game && game.over ? 'Game over' : state.driving ? 'Parked only' : game ? 'Paused' : 'Ready to play';
        const detail = state.driving ? 'Resume when parked' : game && game.over ?
            game.won ? 'Every cell filled' : game.reason === 'wall' ? 'Hit a wall' : 'Hit your body' : 'Ready when you are';
        text(cv, title, x + 180, y + 48, 32, C.text, { align: 'center', font: 'bold' });
        text(cv, detail, x + 180, y + 89, 22, C.muted, { align: 'center' });
        button(cv, x + 28, y + 126, 304, fresh ? 'New game' : 'Resume', fresh ? 'new' : 'resume', action, !state.driving, true);
    }
    return cv;
}

module.exports = { draw, W, H };

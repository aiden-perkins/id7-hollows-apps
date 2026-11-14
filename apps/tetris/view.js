'use strict';

const { cells, COLS, ROWS, HIDDEN } = require('./game');
const W = 1600, H = 520;
const C = {
    bg: '#080e18', panel: '#111c2c', edge: '#26364b', muted: '#8d9eb5', text: '#f1f6ff',
    accent: '#49c9ec', disabled: '#536176', board: '#060b13', grid: '#142034',
};
const COLORS = ['#000000', '#41cfe5', '#f2ce56', '#ac7ae8', '#55cc8b', '#ed6d80', '#5d96ef', '#efa45c'];

function text(cv, value, x, y, size, color, options) {
    cv.text(String(value), x, y, size, color || C.text, Object.assign({ literal: true }, options));
}

function block(cv, x, y, size, kind, ghost) {
    const color = COLORS[kind];
    if (ghost) { cv.strokeRoundRect(x + 2, y + 2, size - 4, size - 4, 2, 2, color); return; }
    cv.fillRect(x + 1, y + 1, size - 2, size - 2, color);
    cv.fillRect(x + 3, y + 3, size - 6, 2, '#ffffff50');
    cv.fillRect(x + 3, y + size - 5, size - 6, 2, '#00000035');
}

function preview(cv, kind, cx, cy, size, dim) {
    if (!kind) return;
    const points = cells({ type: kind, rotation: 0, x: 0, y: 0 });
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    const ox = cx - (maxX - minX + 1) * size / 2, oy = cy - (maxY - minY + 1) * size / 2;
    if (dim) cv.alpha(0.35);
    points.forEach((p) => block(cv, ox + (p[0] - minX) * size, oy + (p[1] - minY) * size, size, kind));
    if (dim) cv.alpha(1);
}

function button(cv, x, y, width, label, key, action, enabled, accent) {
    const color = enabled ? accent ? C.accent : C.text : C.disabled;
    cv.roundRect(x, y, width, 58, 9, enabled && accent ? '#173b4d' : C.panel);
    cv.strokeRoundRect(x, y, width, 58, 9, 1, enabled && accent ? '#367b96' : C.edge);
    text(cv, label, x + width / 2, y + 36, 22, color, { align: 'center' });
    if (enabled) cv.target(x, y, width, 58, () => action(key), key, 9);
}

function draw(cv, game, state, action) {
    cv.clear(C.bg);
    if (cv.chrome) cv.chrome.tabs = { tabs: ['Tetris'], sel: 0 };
    const left = 232, right = 1000, width = 360;
    // The kit moves logical y < 38 into its header in the full-screen layout.
    const size = 22, bx = 690, by = 46, bw = COLS * size, bh = (ROWS - HIDDEN) * size;
    const playing = state.going && game && !game.over;

    cv.roundRect(left, 46, width, 136, 12, C.panel);
    text(cv, 'Score', left + 22, 77, 22, C.muted);
    text(cv, game ? game.score : 0, left + 22, 126, 46, C.text, { font: 'bold' });
    text(cv, 'Best  ' + state.best, left + 22, 164, 21, C.muted);

    cv.roundRect(left, 198, width, 112, 12, C.panel);
    text(cv, 'Level', left + 22, 231, 20, C.muted);
    text(cv, game ? game.level() : 1, left + 22, 279, 36, C.text, { font: 'bold' });
    text(cv, 'Lines', left + 145, 231, 20, C.muted);
    text(cv, game ? game.lines : 0, left + 145, 279, 36, C.text, { font: 'bold' });
    text(cv, 'Hold', left + 286, 231, 20, C.muted, { align: 'center' });
    if (game && game.held) preview(cv, game.held, left + 286, 271, 16, game.holdUsed);
    else text(cv, '-', left + 286, 277, 26, C.disabled, { align: 'center' });

    text(cv, 'Turn / tilt to move', left + 2, 349, 22, C.muted);
    text(cv, 'Press to rotate', left + 2, 379, 22, C.muted);
    button(cv, left, 402, 110, 'Left', 'left', action, playing);
    button(cv, left + 125, 402, 110, 'Rotate', 'rotate', action, playing);
    button(cv, left + 250, 402, 110, 'Right', 'right', action, playing);

    cv.roundRect(bx - 8, by - 8, bw + 16, bh + 16, 8, C.edge);
    cv.fillRect(bx, by, bw, bh, C.board);
    for (let x = 1; x < COLS; x++) cv.fillRect(bx + x * size, by, 1, bh, C.grid);
    for (let y = 1; y < ROWS - HIDDEN; y++) cv.fillRect(bx, by + y * size, bw, 1, C.grid);
    if (game) {
        const paint = (piece, ghost) => cells(piece).forEach((p) => {
            if (p[1] >= HIDDEN && p[1] < ROWS) block(cv, bx + p[0] * size, by + (p[1] - HIDDEN) * size, size, piece.type, ghost);
        });
        for (let y = HIDDEN; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
            if (game.board[y][x]) block(cv, bx + x * size, by + (y - HIDDEN) * size, size, game.board[y][x]);
        }
        if (!game.over) {
            if (state.ghost) paint(game.landing(), true);
            paint(game.active, false);
        }
    }

    cv.roundRect(right, 46, width, 136, 12, C.panel);
    text(cv, 'Next', right + 22, 77, 22, C.muted);
    if (game) game.queue.slice(0, 3).forEach((kind, i) => preview(cv, kind, right + 65 + i * 115, 125, 20));
    text(cv, 'Down: soft drop', right + 2, 218, 22, C.muted);
    text(cv, 'Up: hard drop', right + 2, 248, 22, C.muted);
    button(cv, right, 270, 172, 'Hold', 'hold', action, playing && !game.holdUsed);
    button(cv, right + 188, 270, 172, 'Soft drop', 'down', action, playing);
    button(cv, right, 336, 172, 'Rotate back', 'ccw', action, playing);
    button(cv, right + 188, 336, 172, 'Hard drop', 'drop', action, playing, true);
    button(cv, right, 402, width, state.going ? 'Pause / menu' : 'Menu', 'menu', action, true);

    if (game && playing && game.noticeMs > 0) {
        text(cv, ['', 'Single', 'Double', 'Triple', 'Four lines'][game.lastClear], bx + bw / 2, 514, 21, C.accent, { align: 'center' });
    }
    if (state.saveError) text(cv, 'Save failed - retry from menu', right, 493, 19, '#ed8c8c');

    if (!playing) {
        cv.fillRect(bx, by, bw, bh, '#060b13ce');
        const x = bx - 48, y = 153, popupWidth = bw + 96;
        cv.roundRect(x, y, popupWidth, 207, 12, '#142338');
        cv.strokeRoundRect(x, y, popupWidth, 207, 12, 1, '#38516b');
        const title = game && game.over ? 'Game over' : state.driving ? 'Parked only' : game ? 'Paused' : 'Ready to play';
        text(cv, title, bx + bw / 2, y + 48, 32, C.text, { align: 'center', font: 'bold' });
        text(cv, state.driving ? 'Resume when parked' : game && game.over ? 'Score  ' + game.score : 'Ready when you are', bx + bw / 2, y + 89, 21, C.muted, { align: 'center' });
        const fresh = !game || game.over;
        button(cv, x + 28, y + 122, popupWidth - 56, fresh ? 'New game' : 'Resume', fresh ? 'new' : 'resume', action, !state.driving, true);
    }
    return cv;
}

module.exports = { draw, W, H };

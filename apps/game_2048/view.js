'use strict';

const { SIZE, COUNT, DIRECTIONS, DELTAS } = require('./game');
const W = 1600, H = 520;
const C = {
    bg: '#080e18', panel: '#111c2c', edge: '#29394f', muted: '#8d9eb5', text: '#f1f6ff',
    accent: '#efbd65', disabled: '#536176', board: '#26374a', empty: '#17283a',
};
const PALETTE = [null,
    ['#dbe5ea', '#172b37'], ['#d1e4db', '#172b37'], ['#8bd4b4', '#102c2a'],
    ['#50c79a', '#102c2a'], ['#43b4ab', '#102c2a'], ['#45a3c3', '#102c2a'],
    ['#6d99e0', '#ffffff'], ['#8b8cdd', '#ffffff'], ['#b17dcf', '#ffffff'],
    ['#d77cb5', '#ffffff'], ['#efbd65', '#352714'], ['#e89d5a', '#352714'],
    ['#d97769', '#ffffff'], ['#965c95', '#ffffff'], ['#337e87', '#ffffff'],
];

function text(cv, value, x, y, size, color, options) {
    cv.text(String(value), x, y, size, color || C.text, Object.assign({ literal: true }, options));
}

function arrow(cv, heading, x, y, color) {
    const d = DELTAS[heading], tx = x + d[0] * 13, ty = y + d[1] * 13;
    cv.line(x - d[0] * 12, y - d[1] * 12, tx, ty, 4, color);
    cv.line(tx, ty, tx - d[0] * 10 - d[1] * 9, ty - d[1] * 10 + d[0] * 9, 4, color);
    cv.line(tx, ty, tx - d[0] * 10 + d[1] * 9, ty - d[1] * 10 - d[0] * 9, 4, color);
}

function button(cv, x, y, width, label, key, action, enabled, selected) {
    const active = enabled && selected, color = enabled ? active ? C.accent : C.text : C.disabled;
    cv.roundRect(x, y, width, 58, 9, active ? '#3a3021' : C.panel);
    cv.strokeRoundRect(x, y, width, 58, 9, active ? 2 : 1, active ? '#967640' : C.edge);
    if (DIRECTIONS.indexOf(key) >= 0) arrow(cv, key, x + width / 2, y + 29, color);
    else text(cv, label, x + width / 2, y + 36, 22, color, { align: 'center' });
    if (enabled) cv.target(x, y, width, 58, () => action(key), key + ':' + x + ':' + y, 9);
}

function tile(cv, value, x, y, size) {
    const palette = PALETTE[Math.min(PALETTE.length - 1, Math.round(Math.log2(value)))];
    const fontSize = Math.max(9, Math.min(56, Math.floor(152 / String(value).length)));
    cv.roundRect(x, y, size, size, 9, palette[0]);
    text(cv, value, x + size / 2, y + size / 2 + fontSize * 0.35, fontSize, palette[1], { align: 'center', font: 'bold' });
}

function board(cv, game, animation, bx, by) {
    const pad = 12, size = 100, step = 108;
    const at = (id) => [bx + pad + id % SIZE * step, by + pad + Math.floor(id / SIZE) * step];
    cv.roundRect(bx - 8, by - 8, 464, 464, 12, C.edge);
    cv.roundRect(bx, by, 448, 448, 10, C.board);
    for (let id = 0; id < COUNT; id++) {
        const p = at(id);
        cv.roundRect(p[0], p[1], size, size, 9, C.empty);
    }
    if (!game) return;
    if (animation && animation.progress < 0.75) {
        const fraction = animation.progress / 0.75, progress = 1 - Math.pow(1 - fraction, 3);
        animation.move.motions.forEach((motion) => {
            const from = at(motion.from), to = at(motion.to);
            tile(cv, motion.value, from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress, size);
        });
    } else {
        const phase = animation ? Math.max(0, Math.min(1, (animation.progress - 0.75) / 0.25)) : 1;
        game.board.forEach((value, id) => {
            if (!value) return;
            const p = at(id), spawned = animation && id === animation.move.spawned;
            if (spawned) cv.alpha(phase);
            tile(cv, value, p[0], p[1], size);
            if (spawned) cv.alpha(1);
            if (animation && animation.move.merged.indexOf(id) >= 0) {
                cv.alpha(1 - phase).strokeRoundRect(p[0] + 2, p[1] + 2, size - 4, size - 4, 8, 3, C.accent).alpha(1);
            }
        });
    }
}

function draw(cv, game, state, action) {
    cv.clear(C.bg);
    if (cv.chrome) cv.chrome.tabs = { tabs: ['2048'], sel: 0 };
    // Logical y < 38 is moved into the kit's header in the full-screen layout.
    const left = 204, right = 1102, width = 294, bx = 576, by = 46;
    const playing = !!(state.going && game && game.canPlay());
    const undoable = !!(game && game.undoState && !state.driving);

    cv.roundRect(left, 46, width, 162, 12, C.panel);
    text(cv, 'Score', left + 20, 80, 22, C.muted);
    const score = game ? game.score : 0;
    text(cv, score, left + 20, 139, Math.min(46, Math.floor(420 / String(score).length)), C.text, { font: 'bold' });
    text(cv, 'Best  ' + state.best, left + 20, 185, 22, C.muted);
    cv.roundRect(left, 224, width, 110, 12, C.panel);
    text(cv, 'Moves', left + 20, 258, 20, C.muted);
    text(cv, game ? game.moves : 0, left + 20, 310, 32, C.text, { font: 'bold' });
    text(cv, 'Top tile', left + 153, 258, 20, C.muted);
    const highest = game ? game.highest() : 0;
    text(cv, highest, left + 153, 310, Math.min(32, Math.floor(180 / String(highest).length)), C.accent, { font: 'bold' });
    button(cv, left, 352, width, 'Undo', 'undo', action, undoable, false);
    if (state.gain > 0) text(cv, '+' + state.gain, left + 20, 469, 30, C.accent, { font: 'bold' });
    else {
        text(cv, 'Join equal tiles', left + 2, 451, 22, C.muted);
        text(cv, 'Reach 2048', left + 2, 482, 22, C.muted);
    }

    board(cv, game, state.animation, bx, by);
    text(cv, 'Tilt to move', right + 2, 79, 24, C.muted);
    text(cv, 'Or turn, then press', right + 2, 111, 21, C.muted);
    button(cv, right + 95, 140, 104, '', 'up', action, playing, state.selected === 'up');
    button(cv, right, 210, 128, '', 'left', action, playing, state.selected === 'left');
    button(cv, right + 166, 210, 128, '', 'right', action, playing, state.selected === 'right');
    button(cv, right + 95, 280, 104, '', 'down', action, playing, state.selected === 'down');
    button(cv, right, 352, width, 'New game', 'new', action, !state.driving, false);
    button(cv, right, 422, width, state.going ? 'Pause / menu' : 'Menu', 'menu', action, true, false);
    if (state.saveError) text(cv, 'Save failed - progress is still in memory', bx + 224, 516, 18, '#ed8c8c', { align: 'center' });

    if (!state.going || game && !game.canPlay() && !state.animation) {
        cv.fillRect(bx, by, 448, 448, '#080e18cc');
        const x = bx + 34, y = 164;
        cv.roundRect(x, y, 380, 218, 12, '#182738');
        cv.strokeRoundRect(x, y, 380, 218, 12, 1, '#4b5c70');
        let title = state.driving ? 'Parked only' : game ? 'Paused' : 'Ready to play';
        let detail = state.driving ? 'Resume when parked' : 'Ready when you are';
        let key = game ? 'resume' : 'new', label = game ? 'Resume' : 'New game';
        if (state.going && game) {
            title = game.waiting() ? '2048 reached!' : 'Game over';
            detail = game.over ? 'No moves left' : 'Keep going for a higher tile';
            if (game.waiting() && !game.over) { key = 'continue'; label = 'Keep playing'; }
            else if (undoable) { key = 'undo'; label = 'Undo last move'; }
            else { key = 'new'; label = 'New game'; }
        }
        text(cv, title, x + 190, y + 50, 32, C.text, { align: 'center', font: 'bold' });
        text(cv, detail, x + 190, y + 92, 21, C.muted, { align: 'center' });
        button(cv, x + 28, y + 132, 324, label, key, action, !state.driving, true);
    }
    return cv;
}

module.exports = { draw, W, H };

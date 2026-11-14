'use strict';

const { position } = require('./game');
const { MAZES, COLS, ROWS, DIRECTIONS, DELTAS } = require('./maze');
const W = 1600, H = 520, SIZE = 24, BX = 428, BY = 58;
const C = {
    bg: '#080e18', floor: '#060e1a', panel: '#111c2c', edge: '#293e54', wall: '#122743', outline: '#3973b7',
    muted: '#8d9eb5', text: '#f1f6ff', player: '#f5cf5d', pellet: '#f2d7a9', power: '#88b5ff', disabled: '#536176', bad: '#ee9187',
};
const GHOSTS = ['#ef8791', '#dba4e8', '#75d6d7', '#efb46d'];

function text(cv, value, x, y, size, color, options) {
    cv.text(String(value), x, y, size, color || C.text, Object.assign({ literal: true }, options));
}

function button(cv, x, y, width, label, key, action, enabled, selected) {
    const color = enabled ? selected ? C.player : C.text : C.disabled;
    cv.roundRect(x, y, width, 54, 9, enabled && selected ? '#3b3322' : C.panel);
    cv.strokeRoundRect(x, y, width, 54, 9, enabled && selected ? 2 : 1, enabled && selected ? '#9b8245' : C.edge);
    if (DIRECTIONS.indexOf(key) >= 0) {
        const d = DELTAS[key], cx = x + width / 2, cy = y + 27, tx = cx + d[0] * 11, ty = cy + d[1] * 11;
        cv.line(cx - d[0] * 11, cy - d[1] * 11, tx, ty, 4, color);
        cv.line(tx, ty, tx - d[0] * 9 - d[1] * 8, ty - d[1] * 9 + d[0] * 8, 4, color);
        cv.line(tx, ty, tx - d[0] * 9 + d[1] * 8, ty - d[1] * 9 - d[0] * 8, 4, color);
    } else text(cv, label, x + width / 2, y + 34, 21, color, { align: 'center' });
    if (enabled) cv.target(x, y, width, 54, () => action(key), key + ':' + x + ':' + y, 9);
}

function player(cv, a, x, y) {
    const r = SIZE * 0.39, d = DELTAS[a.direction], angle = Math.atan2(d[1], d[0]);
    const opening = 0.15 + Math.abs(Math.sin(a.progress * Math.PI * 2)) * 0.3, reach = r * 1.28;
    cv.circle(x, y, r, C.player);
    const px = -Math.sin(angle) * 0.15, py = Math.cos(angle) * 0.15;
    cv.quad([[x - px, y - py], [x + Math.cos(angle - opening) * reach, y + Math.sin(angle - opening) * reach],
        [x + Math.cos(angle + opening) * reach, y + Math.sin(angle + opening) * reach], [x + px, y + py]], C.floor);
}

function ghost(cv, a, id, x, y, powered, flash) {
    const r = SIZE * 0.38, d = DELTAS[a.direction], returning = a.state === 'returning';
    const frightened = powered && !returning, color = frightened ? flash ? '#edf4ff' : '#426bc6' : GHOSTS[id];
    if (a.releaseMs) cv.alpha(0.45);
    if (!returning) {
        cv.roundRect(x - r, y - r, r * 2, r * 1.7, r * 0.8, color);
        for (let i = 0; i < 3; i++) cv.circle(x - r * 0.67 + i * r * 0.67, y + r * 0.65, r * 0.33, color);
    }
    if (frightened) {
        cv.circle(x - 3.3, y - 2.8, 1.6, flash ? '#426bc6' : '#edf4ff');
        cv.circle(x + 3.3, y - 2.8, 1.6, flash ? '#426bc6' : '#edf4ff');
        cv.polyline([[x - 5, y + 4], [x - 2.5, y + 2], [x, y + 4], [x + 2.5, y + 2], [x + 5, y + 4]], 1.5, flash ? '#426bc6' : '#edf4ff');
    } else {
        [-3.8, 3.8].forEach((offset) => {
            cv.circle(x + offset, y - 2.2, 3, '#ffffff');
            cv.circle(x + offset + d[0] * 1.3, y - 2.2 + d[1] * 1.3, 1.5, '#1e3960');
        });
    }
    if (a.releaseMs) cv.alpha(1);
}

function drawMaze(cv, game, time) {
    const maze = game ? game.maze : MAZES[0], width = COLS * SIZE, height = ROWS * SIZE;
    cv.roundRect(BX - 8, BY - 8, width + 16, height + 16, 10, C.edge);
    cv.fillRect(BX, BY, width, height, C.floor);
    cv.clip(BX, BY, width, height);
    maze.walls.forEach((wall, id) => {
        const col = id % COLS, row = Math.floor(id / COLS), x = BX + col * SIZE, y = BY + row * SIZE;
        if (wall) {
            cv.fillRect(x, y, SIZE, SIZE, C.wall);
            if (row > 0 && maze.passable(id - COLS)) cv.line(x, y + 1.5, x + SIZE, y + 1.5, 2.5, C.outline);
            if (row + 1 < ROWS && maze.passable(id + COLS)) cv.line(x, y + SIZE - 1.5, x + SIZE, y + SIZE - 1.5, 2.5, C.outline);
            if (col > 0 && maze.passable(id - 1)) cv.line(x + 1.5, y, x + 1.5, y + SIZE, 2.5, C.outline);
            if (col + 1 < COLS && maze.passable(id + 1)) cv.line(x + SIZE - 1.5, y, x + SIZE - 1.5, y + SIZE, 2.5, C.outline);
        } else if (game && game.pellets[id]) {
            const power = game.pellets[id] === 2;
            if (!power || Math.floor(time / 200) % 2 === 0) cv.circle(x + SIZE / 2, y + SIZE / 2, power ? 4.8 : 1.8, C.pellet);
        }
    });
    if (game) {
        const drawActor = (a, run) => {
            const p = position(a), draw = (x) => run(BX + (x + 0.5) * SIZE, BY + (p.y + 0.5) * SIZE);
            draw(p.x);
            if (p.x < 0) draw(p.x + COLS);
            if (p.x > COLS - 1) draw(p.x - COLS);
        };
        game.ghosts.forEach((a, id) => drawActor(a, (x, y) => ghost(cv, a, id, x, y, game.powerMs > 0, game.powerMs < 2000 && Math.floor(time / 150) % 2 === 0)));
        drawActor(game.player, (x, y) => player(cv, game.player, x, y));
    }
    cv.noclip();
}

function draw(cv, game, state, action) {
    cv.clear(C.bg);
    if (cv.chrome) cv.chrome.tabs = { tabs: ['Pac-Man'], sel: 0 };
    const left = 144, right = 1268, width = 188, playing = !!(state.going && game && !game.over);
    const steering = playing && game.phase !== 'cleared', score = game ? game.score : 0;
    const selected = game ? game.wanted : 'left';

    cv.roundRect(left, 50, width, 146, 11, C.panel);
    text(cv, 'Score', left + 18, 84, 20, C.player);
    text(cv, score, left + 18, 139, Math.min(46, Math.floor(250 / String(score).length)), C.text, { font: 'bold' });
    text(cv, 'Best  ' + state.best, left + 18, 175, 19, C.muted);
    cv.roundRect(left, 210, width, 124, 11, C.panel);
    text(cv, 'Lives', left + 18, 244, 20, C.muted);
    text(cv, game ? game.lives : 3, left + 18, 299, 36, C.player, { font: 'bold' });
    text(cv, 'Level', left + 108, 244, 20, C.muted);
    text(cv, game ? game.level : 1, left + 108, 299, 30, C.text, { font: 'bold' });
    button(cv, left, 358, width, game && game.phase === 'playing' ? 'Pause' : game && game.phase === 'cleared' ? 'Next level' : 'Start', 'press', action, playing, true);
    button(cv, left, 440, width, state.going ? 'Pause / menu' : 'Menu', 'menu', action, true, false);

    drawMaze(cv, game, state.time);
    cv.roundRect(right, 50, width, 138, 11, C.panel);
    text(cv, 'Pellets left', right + 18, 84, 20, C.muted);
    text(cv, game ? game.remaining : 0, right + 18, 139, 46, C.text, { font: 'bold' });
    text(cv, game && game.powerMs ? 'Power  ' + Math.ceil(game.powerMs / 1000) + 's' : game && game.mode === 'chase' ? 'Chase' : 'Patrol',
        right + 18, 174, 21, game && game.powerMs ? C.power : C.muted);
    button(cv, right + 56, 202, 76, '', 'up', action, steering, selected === 'up');
    button(cv, right, 266, 80, '', 'left', action, steering, selected === 'left');
    button(cv, right + 108, 266, 80, '', 'right', action, steering, selected === 'right');
    button(cv, right + 56, 330, 76, '', 'down', action, steering, selected === 'down');
    button(cv, right, 420, width, 'New game', 'new', action, !state.driving, false);

    let status = game && game.over ? 'Game over' : game && game.phase === 'cleared' ? 'Maze cleared - press Next level' :
        game && game.phase === 'ready' ? game.lastEvent === 'life' ? 'Life lost - collected pellets stay cleared' : 'Press Start when ready' :
        game && game.powerMs ? 'Power pellets let you chase ghosts' : 'Queue turns early at corners';
    if (state.saveError) status = 'Save failed - progress is still in memory';
    text(cv, status, W / 2, 510, 19, state.saveError || game && game.over ? C.bad : C.muted, { align: 'center' });

    if (!state.going || game && game.over) {
        cv.fillRect(BX, BY, COLS * SIZE, ROWS * SIZE, '#080e18c9');
        const x = W / 2 - 180, y = 164, finished = state.going && game && game.over;
        cv.roundRect(x, y, 360, 218, 12, '#182738');
        cv.strokeRoundRect(x, y, 360, 218, 12, 1, '#4b5c70');
        text(cv, state.driving ? 'Parked only' : finished ? 'Game over' : game ? 'Paused' : 'Ready to play', W / 2, y + 50, 32, C.text, { align: 'center', font: 'bold' });
        text(cv, state.driving ? 'Resume when parked' : finished ? 'Score  ' + game.score : 'Ready when you are', W / 2, y + 92, 23, C.muted, { align: 'center' });
        const fresh = !game || finished;
        button(cv, x + 28, y + 134, 304, fresh ? 'New game' : 'Resume', fresh ? 'new' : 'resume', action, !state.driving, true);
    } else if (state.ready) {
        cv.roundRect(W / 2 - 96, 228, 192, 76, 11, '#182d3d');
        text(cv, 'Ready', W / 2, 278, 34, C.player, { align: 'center', font: 'bold' });
    } else if (game && game.phase !== 'playing') {
        const x = W / 2 - 160, y = 184, next = game.phase === 'cleared';
        cv.roundRect(x, y, 320, 190, 12, '#142638');
        text(cv, next ? 'Maze cleared!' : game.lastEvent === 'life' ? 'Life lost' : 'Ready to play', W / 2, y + 44, 28, C.text, { align: 'center', font: 'bold' });
        text(cv, next ? '500 point bonus awarded' : 'Collect every pellet', W / 2, y + 82, 20, C.muted, { align: 'center' });
        button(cv, x + 28, y + 110, 264, next ? 'Next level' : 'Start', 'press', action, true, true);
    }
    return cv;
}

module.exports = { draw, W, H };

'use strict';

const { PRESETS, DIRECTIONS, DELTAS, MODE_NAMES } = require('./game');
const W = 1600, H = 520;
const C = {
    bg: '#080e18', panel: '#111c2c', edge: '#29394f', muted: '#8d9eb5', text: '#f1f6ff',
    disabled: '#536176', closed: '#293f55', open: '#101f2d', empty: '#0c1b27',
    reveal: '#77c8ef', flag: '#efbd65', chord: '#bda2f0', bad: '#ee887f', good: '#85dfad',
};
const CLUES = ['', '#81c5ff', '#87d9a6', '#f29b94', '#b5a3ee', '#edc271', '#79d5d7', '#d8dfe9', '#aab4c5'];

function duration(ms) {
    const seconds = Math.floor(ms / 1000), minutes = Math.floor(seconds / 60), hours = Math.floor(minutes / 60);
    const pad = (value) => String(value).padStart(2, '0');
    return hours ? hours + ':' + pad(minutes % 60) + ':' + pad(seconds % 60) : minutes + ':' + pad(seconds % 60);
}

function text(cv, value, x, y, size, color, options) {
    cv.text(String(value), x, y, size, color || C.text, Object.assign({ literal: true }, options));
}

function arrow(cv, heading, x, y, color) {
    const d = DELTAS[heading], tx = x + d[0] * 11, ty = y + d[1] * 11;
    cv.line(x - d[0] * 10, y - d[1] * 10, tx, ty, 3, color);
    cv.line(tx, ty, tx - d[0] * 8 - d[1] * 7, ty - d[1] * 8 + d[0] * 7, 3, color);
    cv.line(tx, ty, tx - d[0] * 8 + d[1] * 7, ty - d[1] * 8 - d[0] * 7, 3, color);
}

function button(cv, x, y, width, label, key, action, enabled, accent) {
    const color = enabled ? accent || C.text : C.disabled;
    cv.roundRect(x, y, width, 50, 8, C.panel);
    cv.strokeRoundRect(x, y, width, 50, 8, accent && enabled ? 2 : 1, accent && enabled ? accent : C.edge);
    if (DIRECTIONS.indexOf(key) >= 0) arrow(cv, key, x + width / 2, y + 25, color);
    else text(cv, label, x + width / 2, y + 32, 20, color, { align: 'center' });
    if (enabled) cv.target(x, y, width, 50, () => action(key), key + ':' + x + ':' + y, 8);
}

function flag(cv, x, y, size, color) {
    const cx = x + size * 0.4, top = y + size * 0.23, bottom = y + size * 0.77;
    cv.line(cx, top, cx, bottom, Math.max(2, size * 0.05), C.text);
    cv.fillRect(cx, top, size * 0.33, size * 0.16, color);
    cv.fillRect(cx, top + size * 0.16, size * 0.22, size * 0.07, color);
    cv.fillRect(x + size * 0.24, bottom, size * 0.4, Math.max(2, size * 0.05), C.text);
}

function mine(cv, x, y, size) {
    const cx = x + size / 2, cy = y + size / 2, r = size * 0.28;
    cv.line(cx - r, cy, cx + r, cy, 2, C.text);
    cv.line(cx, cy - r, cx, cy + r, 2, C.text);
    cv.line(cx - r * 0.75, cy - r * 0.75, cx + r * 0.75, cy + r * 0.75, 2, C.text);
    cv.line(cx - r * 0.75, cy + r * 0.75, cx + r * 0.75, cy - r * 0.75, 2, C.text);
    cv.roundRect(cx - r * 0.58, cy - r * 0.58, r * 1.16, r * 1.16, 3, C.text);
    cv.fillRect(cx - r * 0.3, cy - r * 0.3, Math.max(2, size * 0.08), Math.max(2, size * 0.08), C.closed);
}

function drawBoard(cv, game, state, action) {
    const preset = game || PRESETS.beginner;
    const size = Math.floor(Math.min(780 / preset.cols, 416 / preset.rows));
    const width = size * preset.cols, height = size * preset.rows;
    const bx = Math.floor((W - width) / 2), by = Math.floor(58 + (416 - height) / 2);
    cv.roundRect(bx - 7, by - 7, width + 14, height + 14, 8, C.edge);
    cv.fillRect(bx, by, width, height, '#07111d');
    if (!game) return { x: bx, y: by, w: width, h: height };
    const playing = state.going && !game.over;
    for (let id = 0; id < game.size; id++) {
        const x = bx + id % game.cols * size, y = by + Math.floor(id / game.cols) * size;
        const revealed = game.revealed[id], marked = game.flagged[id], showMine = game.over && game.mines[id] && !marked;
        const exploded = game.exploded === id, count = game.counts[id];
        cv.roundRect(x + 1, y + 1, size - 2, size - 2, 2,
            exploded ? '#9e413f' : revealed ? count ? C.open : C.empty : C.closed);
        if (marked) {
            flag(cv, x, y, size, C.flag);
            if (game.over && !game.mines[id]) {
                cv.line(x + 5, y + 5, x + size - 5, y + size - 5, 2, C.bad);
                cv.line(x + size - 5, y + 5, x + 5, y + size - 5, 2, C.bad);
            }
        } else if (showMine) mine(cv, x, y, size);
        else if (revealed && count) text(cv, count, x + size / 2, y + size * 0.74, Math.round(size * 0.65), CLUES[count], { align: 'center', font: 'bold' });
        else if (!revealed) cv.fillRect(x + 3, y + 2, size - 6, 1, '#ffffff22');
        if (id === game.cursor && !game.over) cv.strokeRoundRect(x + 2, y + 2, size - 4, size - 4, 2, 2, C[game.mode]);
        if (playing) cv.target(x, y, size, size, () => action('cell', id), 'cell:' + id, 2);
    }
    return { x: bx, y: by, w: width, h: height };
}

function draw(cv, game, state, action) {
    cv.clear(C.bg);
    if (cv.chrome) cv.chrome.tabs = { tabs: ['Minesweeper'], sel: 0 };
    const left = 150, right = 1230, width = 220;
    const playing = !!(state.going && game && !game.over);
    const preset = PRESETS[game ? game.difficulty : 'beginner'];
    const record = state.records[game ? game.difficulty : 'beginner'];
    const mode = game ? game.mode : 'reveal';

    cv.roundRect(left, 52, width, 132, 10, C.panel);
    text(cv, 'Time', left + 18, 85, 21, C.muted);
    const time = duration(game ? game.elapsedMs : 0);
    text(cv, time, left + 18, 134, Math.min(42, Math.floor(340 / time.length)), C.text, { font: 'bold' });
    text(cv, 'Best  ' + (record.bestMs === null ? '--' : duration(record.bestMs)), left + 18, 168, 19, C.muted);
    cv.roundRect(left, 196, width, 90, 10, C.panel);
    text(cv, 'Flags left', left + 15, 224, 18, C.muted);
    text(cv, game ? game.mineCount - game.flags() : preset.mines, left + 15, 267, 30, C.flag, { font: 'bold' });
    text(cv, 'Cleared', left + 123, 224, 18, C.muted);
    text(cv, game ? game.cleared : 0, left + 123, 267, 30, C.text, { font: 'bold' });
    button(cv, left, 300, width, 'Reveal', 'reveal', action, playing && !game.revealed[game.cursor] && !game.flagged[game.cursor], C.reveal);
    button(cv, left, 360, width, game && game.flagged[game.cursor] ? 'Unflag' : 'Flag', 'flag', action,
        playing && !game.revealed[game.cursor] && (game.flagged[game.cursor] || game.flags() < game.mineCount), C.flag);
    button(cv, left, 420, width, 'Mode: ' + MODE_NAMES[mode], 'mode', action, playing, C[mode]);

    const bounds = drawBoard(cv, game, state, action);
    text(cv, preset.title, right + width / 2, 82, preset.title === 'Intermediate' ? 22 : 25, C.text, { align: 'center', font: 'bold' });
    text(cv, preset.cols + ' x ' + preset.rows + ' / ' + preset.mines + ' mines', right + width / 2, 113, 19, C.muted, { align: 'center' });
    button(cv, right + 72, 140, 76, '', 'up', action, playing);
    button(cv, right, 200, 96, '', 'left', action, playing);
    button(cv, right + 124, 200, 96, '', 'right', action, playing);
    button(cv, right + 72, 260, 76, '', 'down', action, playing);
    button(cv, right, 320, width, 'Open around', 'chord', action, playing && game.canChord(game.cursor), C.chord);
    button(cv, right, 380, width, 'New game', 'new', action, !state.driving);
    button(cv, right, 440, width, state.going ? 'Pause / menu' : 'Menu', 'menu', action, true);

    let status = state.message || (game && game.won ? 'Cleared in ' + duration(game.elapsedMs) : game && game.over ?
        'Mine hit - review the board or try again' : game && game.started ? 'Turn: choose action / press: apply' : 'First reveal opens a safe area');
    if (state.saveError) status = 'Save failed - progress is still in memory';
    text(cv, status, W / 2, 510, 19, state.saveError || game && game.over && !game.won ? C.bad : game && game.won ? C.good : C.muted, { align: 'center' });
    if (!state.going) {
        cv.fillRect(bounds.x, bounds.y, bounds.w, bounds.h, '#080e18d9');
        const x = W / 2 - 180, y = 164;
        cv.roundRect(x, y, 360, 218, 12, '#182738');
        cv.strokeRoundRect(x, y, 360, 218, 12, 1, '#4b5c70');
        text(cv, state.driving ? 'Parked only' : game ? 'Paused' : 'Ready to play', W / 2, y + 50, 31, C.text, { align: 'center', font: 'bold' });
        text(cv, state.driving ? 'Resume when parked' : 'Ready when you are', W / 2, y + 92, 21, C.muted, { align: 'center' });
        button(cv, x + 28, y + 138, 304, game ? 'Resume' : 'New game', game ? 'resume' : 'new', action, !state.driving, C.reveal);
    }
    return cv;
}

module.exports = { draw, duration, W, H };

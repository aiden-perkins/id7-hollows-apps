'use strict';

const G = require('./kit/gauges');
const { hex } = require('./scenes');
const { MODES, EFFECTS } = require('./interior');
const { PRESETS, presetFor } = require('./presets');
const { FUNCTIONS, PATTERNS } = require('./exterior');
const { SWITCH_COMMANDS } = require('./vehicle');

const TABS = ['Interior colors', 'Interior modes', 'Interior animations', 'Exterior control', 'Exterior animations'];
const C = { bg: '#10151d', panel: '#171f2a', line: '#2e3a4a', soft: '#223042', text: '#f4f6fa', muted: '#acb9c9', accent: '#ffc56e', red: '#ff8e83' };
const EXT_PAGES = [['outputs', 'Lamp outputs'], ['functions', 'Lamp functions'], ['switch', 'Factory switch']];

function text(cv, label, x, y, size, color, options) {
    cv.text(label, x, y, size, color || C.text, Object.assign({ literal: true }, options));
}

function panel(cv, x, y, w, h, active) {
    cv.roundRect(x, y, w, h, 16, C.panel);
    cv.strokeRoundRect(x, y, w, h, 16, active ? 2 : 1, active ? C.accent : C.line);
}

function button(cv, x, y, w, h, label, run, key, options) {
    const o = options || {};
    const color = o.danger ? C.red : C.accent;
    cv.roundRect(x, y, w, h, 10, o.selected ? color : o.disabled ? C.panel : C.soft);
    cv.strokeRoundRect(x, y, w, h, 10, 1, o.selected || o.danger ? color : C.line);
    text(cv, label, x + w / 2, y + h / 2 + 8, o.size || 23, o.selected ? C.bg : o.disabled ? C.muted : o.danger ? C.red : C.text,
        { align: 'center', font: 'bold' });
    if (!o.disabled && run) cv.target(x, y, w, h, run, key, 10);
}

function slider(cv, data, tracks, group, index, label, value, max, ramp) {
    const y = 129 + index * 59, x = 226, w = 510, h = 43;
    text(cv, label, 60, y + 29, 24);
    text(cv, String(value) + (max === 100 ? '%' : ''), 821, y + 29, 25, C.text, { align: 'right', font: 'num' });
    cv.rampRect(x, y + 11, w, 22, 7, ramp);
    const thumb = x + w * value / max;
    cv.roundRect(thumb - 8, y + 3, 16, 38, 7, C.bg);
    cv.roundRect(thumb - 5, y + 5, 10, 34, 5, '#ffffff');
    button(cv, 842, y, 55, h, '-', data.act(() => data.adjust(group, -1)), 'down-' + group);
    button(cv, 903, y, 55, h, '+', data.act(() => data.adjust(group, 1)), 'up-' + group);
    tracks.push({ x, y, w, h, max, group });
}

function colors(cv, data, tracks) {
    const { interior, state } = data;
    const { profile } = interior, rgb = data.rgb(), editing = state.editMode;
    const selection = editing ? state.draft : interior.baseColor();
    const mode = MODES.find(([key]) => key === editing);
    panel(cv, 30, 54, 950, 392);
    panel(cv, 998, 54, 572, 392);
    text(cv, mode ? mode[1] + ' color' : 'Custom RGB', 59, 112, 37, C.text, { font: 'bold' });
    cv.roundRect(740, 79, 68, 36, 8, rgb);
    cv.strokeRoundRect(740, 79, 68, 36, 8, 1, C.muted);
    text(cv, hex(rgb).toUpperCase(), 824, 109, 24, C.text, { font: 'num' });

    ['Red', 'Green', 'Blue'].forEach((channel, i) => {
        const low = rgb.slice(), high = rgb.slice();
        low[i] = 0;
        high[i] = 255;
        slider(cv, data, tracks, i, i, channel, rgb[i], 255, [low, high]);
    });
    if (!editing) slider(cv, data, tracks, 'brightness', 3, 'Brightness', profile.brightness, 100, [C.bg, rgb]);
    else text(cv, 'Custom RGB uses the cabin brightness setting.', 60, 337, 23, C.muted);

    button(cv, 60, 378, 258, 50, 'Use custom RGB', data.act(() => data.selectColor(rgb.slice())), 'enable-color', { selected: Array.isArray(selection) });
    if (editing) {
        button(cv, 565, 378, 135, 50, 'Cancel', data.act(data.cancelMode), 'cancel-mode');
        button(cv, 712, 378, 246, 50, 'Save mode color', data.act(data.saveMode), 'save-mode', { selected: true });
    }

    text(cv, 'iDrive presets', 1025, 107, 31, C.text, { font: 'bold' });
    PRESETS.forEach(([slot, label, primary, secondary], i) => {
        const x = 1025 + i % 2 * 264, y = 124 + Math.floor(i / 2) * 51;
        const selected = selection === slot;
        button(cv, x, y, 252, 45, label, data.act(() => data.selectColor(slot)), 'preset-' + slot, { selected, size: 19 });
        cv.roundRect(x + 11, y + 13, 16, 19, 4, primary);
        if (secondary) cv.fillRect(x + 19, y + 14, 7, 17, secondary);
    });
    button(cv, 1289, 379, 252, 45, editing ? 'Use cabin default' : 'Use vehicle setting', data.act(() => data.selectColor(null)),
        'preset-default', { selected: selection === null, size: 19 });
}

function modes(cv, data) {
    const { interior, vehicle } = data, profile = interior.profile;
    text(cv, 'Follow the driving mode', 32, 94, 29, C.text, { font: 'bold' });
    button(cv, 1218, 55, 351, 53, profile.follow ? 'Mode colors on' : 'Mode colors off',
        data.act(() => interior.setFollow(!profile.follow)), 'mode-follow', { selected: profile.follow });
    MODES.forEach(([mode, label], i) => {
        const x = 30 + i * 518, w = 504, active = vehicle.mode === mode, color = profile.modes[mode];
        const preset = presetFor(color);
        panel(cv, x, 124, w, 322, active);
        text(cv, label, x + 27, 184, 41, C.text, { font: 'bold' });
        if (active) text(cv, 'Current', x + w - 27, 183, 23, C.accent, { align: 'right' });
        cv.roundRect(x + 28, 209, 448, 83, 12, preset ? preset[2] : color || C.soft);
        if (preset && preset[3]) cv.roundRect(x + 252, 209, 224, 83, 12, preset[3]);
        const description = preset ? preset[1] : color ? hex(color).toUpperCase() : 'Cabin default';
        text(cv, description, x + 29, 326, 23, C.muted, { font: color && !preset ? 'num' : 'label' });
        button(cv, x + 27, 359, 216, 61, 'Set color', data.act(() => data.editMode(mode)), 'mode-edit-' + mode);
        button(cv, x + 254, 359, 223, 61, 'Use default', data.act(() => interior.setColor(null, mode)), 'mode-clear-' + mode, { disabled: !color });
    });
}

function interiorAnimations(cv, data) {
    EFFECTS.forEach(([id, name, description], i) => {
        const x = i < 4 ? 30 : 807, y = 56 + i % 4 * 99, w = 763;
        const on = data.interior.effectOn(id);
        panel(cv, x, y, w, 88, on);
        text(cv, name, x + 25, y + 35, 27, C.text, { font: 'bold' });
        text(cv, description, x + 25, y + 66, 22, C.muted);
        button(cv, x + w - 111, y + 19, 86, 48, on ? 'On' : 'Off', null, '', { selected: on });
        cv.target(x, y, w, 88, data.act(() => data.interior.toggleEffect(id)), 'effect-' + id, 16);
    });
}

function grid(items, drawButton) {
    items.forEach((item, i) => drawButton(item, 30 + i % 4 * 388, 130 + Math.floor(i / 4) * 84));
}

function exteriorControl(cv, data) {
    const { exterior, state, vehicle } = data;
    const blocked = !!exterior.blocked(), busy = exterior.busy || exterior.active;
    EXT_PAGES.forEach(([id, label], i) => {
        button(cv, 30 + i * 250, 58, 232, 51, label, data.act(() => data.selectExterior(id)), 'ext-' + id, { selected: state.exterior === id });
    });
    if (state.exterior !== 'switch') {
        button(cv, 1288, 58, 282, 51, 'Detect lamps', data.act(() => exterior.detect()), 'detect-lamps', { disabled: busy || blocked });
    }

    if (state.exterior === 'switch') {
        grid(SWITCH_COMMANDS, (command, x, y) => {
            button(cv, x, y, 376, 72, command.label, data.act(() => vehicle.setSwitch(command)), 'switch-' + command.id,
                { selected: vehicle.switchSelected(command), disabled: busy || !vehicle.switchAllowed(command) });
        });
        return;
    }

    if (state.exterior === 'functions') {
        if (exterior.strobe.kind !== 'fn') {
            text(cv, 'Timed lamp functions require a compatible body controller.', 33, 169, 25, C.muted);
            return;
        }
        grid(FUNCTIONS, ([id, label], x, y) => {
            button(cv, x, y, 376, 72, label, data.act(() => exterior.pulse(id)), 'lamp-' + id, { disabled: busy || blocked });
        });
        text(cv, 'Tap a lamp to pulse it briefly.', 32, 421, 24, C.muted);
        return;
    }

    if (!exterior.outputs.length) {
        text(cv, 'Individual outputs appear when the body controller reports them.', 33, 169, 25, C.muted);
        return;
    }
    grid(exterior.outputs, ([id, label], x, y) => {
        button(cv, x, y, 376, 72, label, data.act(() => data.selectOutput(id)), 'output-' + id, { selected: state.output === id });
    });
    const selected = exterior.outputs.find(([id]) => id === state.output);
    text(cv, selected ? selected[1] + ' / 3-second test' : 'Select an output to test', 33, 374, 26, C.text, { font: 'bold' });
    button(cv, 984, 336, 279, 59, 'Turn on', data.act(() => exterior.testOutput(state.output, true)), 'output-on', { disabled: !selected || busy || blocked });
    button(cv, 1276, 336, 294, 59, 'Turn off', data.act(() => exterior.testOutput(state.output, false)), 'output-off', { disabled: !selected || busy || blocked });
}

function patternGraphic(cv, x, y, pattern) {
    const phases = { strobe: [[1, 1], [0, 0], [1, 1]], show: [[1, 0], [1, 1], [0, 1]], cop: [[1, 0], [1, 1], [0, 1]] }[pattern];
    phases.forEach((phase, step) => {
        const left = x + 12 + step * 151;
        cv.roundRect(left, y, 137, 77, 10, C.bg);
        phase.forEach((on, side) => {
            const color = pattern === 'show' && step === 1 ? '#ffc56e' : '#e6f2ff';
            cv.roundRect(left + 17 + side * 57, y + 28, 46, 21, 7, on ? color : C.line);
        });
    });
}

function exteriorAnimations(cv, data) {
    const exterior = data.exterior, blocked = !!exterior.blocked();
    PATTERNS.forEach(([id, name, description], i) => {
        const x = 30 + i * 518, active = exterior.pattern === id;
        panel(cv, x, 54, 504, 337, active);
        text(cv, name, x + 26, 117, 39, C.text, { font: 'bold' });
        patternGraphic(cv, x + 14, 145, id);
        description.forEach((line, row) => text(cv, line, x + 27, 256 + row * 26, 23, C.muted));
        button(cv, x + 26, 306, 452, 60, active ? exterior.busy ? 'Running' : 'Selected' : 'Start',
            data.act(() => exterior.startPattern(id)), 'pattern-' + id,
            { selected: active, disabled: blocked || exterior.active || exterior.busy || !exterior.canPattern(id) });
    });
    text(cv, 'Repeats while parked, with cooldowns between runs.', 33, 429, 23, C.muted);
    if (exterior.strobe.head && !exterior.strobe.high) {
        button(cv, 1248, 400, 322, 47, 'Learn high beams', data.act(() => exterior.learn()), 'learn-high',
            { disabled: blocked || exterior.busy || exterior.active });
    } else if (!exterior.strobe.kind) {
        button(cv, 1288, 400, 282, 47, 'Detect lamps', data.act(() => exterior.detect()), 'detect-effects', { disabled: blocked || exterior.busy });
    }
}

function render(cv, theme, data) {
    const { state, exterior, interior, vehicle } = data;
    const tracks = [];
    cv.clear(C.bg);
    [colors, modes, interiorAnimations, exteriorControl, exteriorAnimations][state.page](cv, data, tracks);
    cv.fillRect(30, 458, 1540, 1, C.line);
    let status = state.page < 3 ? interior.status() : exterior.status();
    if (state.page === 1 && vehicle.mode === null) status = 'Waiting for driving mode';
    if (state.page < 3 && exterior.busy && !interior.blocked()) status = 'Cabin updates paused during exterior diagnostics';
    if (state.page === 3 && state.exterior === 'switch') {
        status = vehicle.switchNote || (vehicle.switchAvailable() ? 'The vehicle controls which switches are available' : 'Factory light switch unavailable');
    }
    text(cv, status, 33, 498, 25, C.muted);
    if (exterior.active) button(cv, 1262, 466, 308, 48, 'Stop exterior', data.act(() => exterior.stop()), 'stop-exterior', { danger: true });
    G.frame(cv, theme, TABS, state.page, []);
    return tracks;
}

module.exports = { TABS, render };

'use strict';
const G = require('./kit/gauges');
const D = require('./domain');

const NAMES = ['Input', 'Drive mode', 'Lighting', 'Status'];
const SECTIONS = ['input', 'mode', 'lights', 'status'];
function stamp(at) {
    if (!at) return '--:--:--';
    const d = new Date(at), p = (n) => String(n).padStart(2, '0');
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}
function fit(cv, text, width, size, font) {
    text = String(text == null ? '--' : text).replace(/[^\x20-\x7e]/g, ' ');
    if (cv.textWidth(text, size, { font: font || 'label' }) <= width) return text;
    while (text && cv.textWidth(text + '...', size, { font: font || 'label' }) > width) text = text.slice(0, -1);
    return text + '...';
}
function txt(cv, t, text, x, y, width, size, colour, font) {
    cv.text(fit(cv, text, width, size || 22, font), x, y, size || 22, colour || t.text, { font: font || 'label' });
}
function wrapped(cv, t, text, x, y, width, lines, size, colour) {
    let rest = String(text == null ? '--' : text).replace(/[^\x20-\x7e]/g, ' ');
    for (let i = 0; i < lines && rest; i++) {
        let line = fit(cv, rest, width, size || 20);
        if (line.endsWith('...')) line = line.slice(0, -3);
        if (!line) break;
        cv.text(line, x, y + i * ((size || 20) + 6), size || 20, colour || t.dim);
        rest = rest.slice(line.length);
    }
}
function tone(t, value) { return value === 'error' ? t.crit : value === 'warn' ? t.warn : value === 'good' ? '#56d793' : t.text; }
function statusColour(t, status) {
    return status === 'live' ? '#56d793' : status === 'error' ? t.crit : status === 'offline' || status === 'unavailable' ? t.dim : t.warn;
}
function stat(cv, t, label, value, x, y, width) {
    txt(cv, t, label, x, y, width, 19, t.dim);
    txt(cv, t, value, x, y + 35, width, 30, t.text, 'bold');
}
function recent(cv, t, lab, x, y, width, count, kinds) {
    const list = kinds ? lab.events.filter((e) => kinds.some((k) => e.kind.indexOf(k) >= 0)) : lab.events;
    list.slice(0, count).forEach((ev, i) => txt(cv, t, stamp(ev.at) + '  ' + ev.text, x, y + i * 25, width, 19, i ? t.dim : t.text));
    if (!list.length) txt(cv, t, 'No events received', x, y, width, 21, t.dim);
}
function input(cv, t, lab) {
    const d = lab.inputs;
    G.panel(cv, t, 24, 58, 900, 282, 'Raw touch coordinates');
    const box = { x: 46, y: 118, w: 854, h: 177 };
    cv.fillRect(box.x, box.y, box.w, box.h, t.bg);
    for (let i = 1; i < 4; i++) cv.line(box.x + box.w * i / 4, box.y, box.x + box.w * i / 4, box.y + box.h, 1, t.track);
    cv.line(box.x, box.y + box.h / 2, box.x + box.w, box.y + box.h / 2, 1, t.track);
    const trail = d.trail.filter((p) => lab.now() - p.at < 8000);
    const controller = d.touch && d.touch.source.indexOf('CONTROLLER') === 0;
    const maxX = Math.max(controller ? 4095 : 1920, ...trail.map((p) => p.x));
    const maxY = Math.max(controller ? 4095 : 720, ...trail.map((p) => p.y));
    const previous = {};
    trail.forEach((p) => {
        const x = box.x + G.clamp(p.x / maxX, 0, 1) * box.w, y = box.y + G.clamp(p.y / maxY, 0, 1) * box.h;
        const old = previous[p.source + p.id], colour = ['#81c4ff', '#ef737a', '#56d793'][Math.abs(Number(p.id) || 0) % 3];
        if (old && p.at - old.at < 250) cv.line(old.x, old.y, x, y, 3, G.withAlpha(colour, 0.65));
        cv.circle(x, y, 4, colour);
        previous[p.source + p.id] = { x, y, at: p.at };
    });
    if (!trail.length) {
        const svc = lab.services.relay, touchpad = lab.services.touchpad;
        txt(cv, t, svc && svc.status === 'error' ? 'Display relay error - try the controller touchpad' : 'Waiting for raw touch events', box.x + 24, box.y + 74, box.w - 48, 28, t.dim);
        txt(cv, t, touchpad && touchpad.status !== 'idle' ? 'Controller coordinates use direct vehicle signals.' : 'Connect input, then touch the display or controller pad.', box.x + 24, box.y + 111, box.w - 48, 20, t.dim);
    }
    const f = d.touch && d.touch.fingers[0];
    const detail = f ? d.touch.source + '  x=' + f.x + ' y=' + f.y + ' z=' + f.z + ' id=' + f.id + ' event=' + f.event
        : 'Plot range 0..' + maxX + ' x 0..' + maxY + ' - raw values are shown as received';
    txt(cv, t, detail, 46, 323, 854, 20, t.accent2);

    G.panel(cv, t, 948, 58, 628, 282, 'iDrive controller / native controls');
    stat(cv, t, 'APP ACTIONS', String(d.actions), 970, 125, 160);
    stat(cv, t, 'FOCUS EVENTS', String(d.focusEvents), 1170, 125, 185);
    stat(cv, t, 'RAW KEYS', String(d.keyEvents), 1380, 125, 170);
    txt(cv, t, 'Focused: ' + d.focused, 970, 214, 580, 22);
    txt(cv, t, 'Key: ' + d.lastKey, 970, 248, 580, 23, t.accent2);
    txt(cv, t, 'Clockwise ' + d.clockwise + '    Counterclockwise ' + d.counterclockwise + '    Touch ' + d.touchEvents, 970, 282, 580, 20, t.dim);
    txt(cv, t, d.wheel, 970, 315, 580, 19, t.dim);

    G.panel(cv, t, 24, 360, 900, 150, 'Latest input payload');
    wrapped(cv, t, JSON.stringify(d.raw), 46, 425, 854, 3, 19);
    G.panel(cv, t, 948, 360, 628, 150, 'Recent input');
    recent(cv, t, lab, 970, 422, 580, 4, ['native', 'controller', 'touch', 'relay']);
}
function mode(cv, t, lab, view) {
    G.panel(cv, t, 24, 58, 704, 275, 'Current drive mode');
    txt(cv, t, lab.mode.valid ? lab.mode.family || 'OTHER' : 'WAITING', 46, 160, 660, 48, lab.mode.valid ? t.accent2 : t.dim, 'bold');
    wrapped(cv, t, lab.mode.label, 46, 209, 660, 2, 26);
    txt(cv, t, 'Raw: ' + String(lab.mode.raw) + '   Received: ' + stamp(lab.modeAt), 46, 299, 660, 22, t.dim);
    G.panel(cv, t, 752, 58, 824, 275, 'Mode changes');
    lab.modeHistory.slice(0, 6).forEach((m, i) => txt(cv, t, stamp(m.at) + '  ' + m.label + (m.hidden ? '  [off screen]' : ''), 774, 133 + i * 31, 780, 21, i ? t.dim : t.text));
    if (!lab.modeHistory.length) txt(cv, t, 'No mode value received', 774, 137, 780, 25, t.dim);
    G.panel(cv, t, 24, 355, 1552, 155, view.modeRaw ? 'Raw mode payload' : 'Mode-linked lighting');
    if (view.modeRaw) wrapped(cv, t, JSON.stringify(lab.modeRaw), 46, 421, 1508, 3, 20);
    else {
        ['Sport', 'Comfort', 'Eco'].forEach((name, i) => stat(cv, t, name.toUpperCase(), 'Preset ' + lab.settings.get('map' + name), 46 + i * 490, 423, 450));
    }
}
function lights(cv, t, lab) {
    const backend = lab.backend(), current = lab.current();
    G.panel(cv, t, 24, 58, 1000, 200, 'Current ambient lighting');
    txt(cv, t, D.lightSummary(current), 46, 156, 956, 34, current ? t.text : t.dim, 'bold');
    txt(cv, t, 'Interface: ' + (backend === 'profile' ? 'Light profiles' : 'Legacy colour'), 46, 197, 956, 23, t.accent2);
    txt(cv, t, 'Original: ' + D.lightSummary(lab.baselines[backend]), 46, 234, 956, 22, t.dim);
    G.panel(cv, t, 1048, 58, 528, 200, 'Mode linking');
    txt(cv, t, lab.follow ? 'ON' : 'OFF', 1070, 158, 484, 48, lab.follow ? '#56d793' : t.dim, 'bold');
    txt(cv, t, lab.mode.family || 'No supported family', 1070, 200, 484, 25);
    txt(cv, t, 'Assigned: ' + (lab.mode.family ? lab.settings.get('map' + lab.mode.family) : '--'), 1070, 234, 484, 22, t.dim);
    ['A', 'B', 'C'].forEach((slot, i) => {
        const x = 24 + i * 526, p = lab.presets[slot];
        G.panel(cv, t, x, 280, 500, 132, 'Preset ' + slot);
        wrapped(cv, t, p ? D.lightSummary(p) : 'Empty', x + 22, 356, 456, 2, 23, p ? t.text : t.dim);
    });
    G.panel(cv, t, 24, 434, 1552, 76, null);
    txt(cv, t, lab.writeResult.text, 46, 469, 1508, 23,
        lab.writeResult.state === 'matched' ? '#56d793' : lab.writeResult.state === 'error' ? t.crit : t.warn);
    txt(cv, t, lab.notice.text, 46, 497, 1508, 19, tone(t, lab.notice.tone));
}
function status(cv, t, lab, ctx, view) {
    G.panel(cv, t, 24, 58, 790, 345, 'Interfaces');
    const services = Object.keys(lab.services).map((k) => lab.services[k]);
    services.slice(0, 9).forEach((s, i) => {
        const y = 127 + i * 29;
        cv.circle(48, y - 7, 4, statusColour(t, s.status));
        txt(cv, t, s.label, 64, y, 315, 20);
        txt(cv, t, view.details ? s.detail || s.status : s.status + (s.samples ? ' / ' + s.samples + ' samples' : ''), 390, y, 402, 19, statusColour(t, s.status));
    });
    G.panel(cv, t, 838, 58, 738, 345, 'Vehicle / runtime');
    const s = lab.sensors, value = (v, unit, n) => D.number(v) ? v.toFixed(n || 0) + unit : '--';
    stat(cv, t, 'ENGINE', value(s.rpm, ' rpm'), 860, 125, 330);
    stat(cv, t, 'SPEED', value(s.speed, ' km/h', 1), 1214, 125, 340);
    stat(cv, t, 'COOLANT', value(s.coolant, ' C'), 860, 218, 330);
    stat(cv, t, 'OIL', value(s.oil, ' C'), 1214, 218, 340);
    const gps = s.gps && s.gps.position, valid = gps && gps.coordinatesValid && D.number(gps.latitude) && D.number(gps.longitude);
    txt(cv, t, 'GPS: ' + (valid ? gps.latitude.toFixed(5) + ', ' + gps.longitude.toFixed(5) : s.gps ? String(s.gps.fixType) : 'Waiting'), 860, 315, 694, 22, t.accent2);
    txt(cv, t, 'Battery condition (raw): ' + (s.battery == null || s.battery === 255 ? '--' : s.battery), 860, 346, 694, 21, t.dim);
    const gpu = ctx.display && ctx.display.active && ctx.display.active('MAIN');
    txt(cv, t, 'Renderer: ' + (gpu ? 'GPU' : 'Software') + '   Uptime: ' + Math.floor((lab.now() - lab.started) / 1000) + ' s', 860, 379, 694, 21, t.dim);
    G.panel(cv, t, 24, 425, 1552, 85, null);
    const logger = lab.logger;
    txt(cv, t, 'Event log: ' + (logger && logger.enabled ? 'ON' : 'OFF') + '   Off-screen mode changes: ' + lab.hiddenModeChanges, 46, 460, 1508, 22);
    txt(cv, t, logger && logger.error ? 'Log: ' + logger.error : lab.store.error || lab.notice.text, 46, 493, 1508, 20, tone(t, lab.notice.tone));
}
function draw(ctx, lab, view) {
    const t = ctx.theme(), cv = ctx.canvas(1600, 520).clear(t.bg);
    const page = SECTIONS.indexOf(view.section);
    G.frame(cv, t, NAMES, page, lab.preview ? [{ text: 'PREVIEW' }] : [{ text: 'LIVE' }]);
    if (view.section === 'mode') mode(cv, t, lab, view);
    else if (view.section === 'lights') lights(cv, t, lab);
    else if (view.section === 'status') status(cv, t, lab, ctx, view);
    else input(cv, t, lab);
    return cv;
}
module.exports = { draw, fit, stamp, SECTIONS };

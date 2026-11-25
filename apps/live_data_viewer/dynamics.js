'use strict';
const { temperatureColor, text, get, calibrated, fmt } = require('./instruments');

// Fixed display scales.
const MOTOR_TORQUE_FULL_SCALE_NM = 10;
const REAR_DIFF_LOCK_FULL_SCALE_NM = 1500;
const WHEEL_OFFSET = 180, WHEEL_HALF_WIDTH = 30, WHEEL_HALF_HEIGHT = 52;
const POWER_BOX_HALF_WIDTH = 52, POWER_BOX_HALF_HEIGHT = 22, POWER_BOX_RADIUS = 6;
const G_TRAIL_MS = 10000;
const wheelFields = [
    { prefix: 'pressure', unit: 'psi', label: 'PSI', places: 0 },
    { prefix: 'tyreTemp', unit: 'F', label: '°F', places: 0 },
    { prefix: 'wheelSpeed', unit: 'mph', label: 'MPH', places: 1 },
];
function reading(vm, id) {
    const state = get(vm, id);
    const live = state.state === 'live' && !state.retained;
    // Keep the last validated sample visible without promoting it to live data.
    return { sample: live ? state : vm.model.readings[id].lastValid, live };
}
function physical(vm, id, unit) {
    const definition = vm.model.definitions[id], current = reading(vm, id), sample = current.sample;
    const value = calibrated(definition) && definition.unit === unit && sample &&
        sample.unit === unit && Number.isFinite(sample.value) ? sample.value : null;
    return { value, live: current.live && value !== null };
}
function liveRaw(vm, id) {
    const state = get(vm, id);
    return state.state === 'live' && !state.retained && state.unit === 'raw' && Number.isFinite(state.value) ? state.value : null;
}
function gMeter(cv, t, vm, box) {
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const radius = Math.min(108, (box.w - 32) / 2, (box.h - 140) / 2);
    const now = Date.now(), cutoff = now - G_TRAIL_MS;
    cv.line(cx - radius - 4, cy, cx + radius + 4, cy, 1, t.track);
    cv.line(cx, cy - radius - 4, cx, cy + radius + 4, 1, t.track);
    [0.5, 1, 1.5].forEach((value) => {
        const r = radius * value / 1.5;
        cv.arc(cx, cy, r - 1, r + 1, 0, 360, t.tick);
        text(cv, String(value), cx + r - 6, cy - 8, 40, 16, t.dim, { align: 'right', font: 'num' });
    });
    const history = vm.model.readings.gForce.history;
    let start = history.length, previousAt = null, previousX, previousY;
    while (start > 0 && history[start - 1].at >= cutoff) start--;
    for (let i = start; i < history.length; i++) {
        const point = history[i];
        if (point.at > now || !Number.isFinite(point.value) ||
            !Number.isFinite(point.lateral) || !Number.isFinite(point.longitudinal)) {
            previousAt = null; continue;
        }
        const scale = radius / Math.max(1.5, point.value);
        const x = cx - point.lateral * scale, y = cy - point.longitudinal * scale;
        if (previousAt !== null && point.at - previousAt <= vm.model.definitions.gForce.staleMs) {
            const alpha = Math.round(220 * (1 - (now - previousAt) / G_TRAIL_MS));
            cv.line(previousX, previousY, x, y, 3, t.accent2 + alpha.toString(16).padStart(2, '0'));
        }
        previousAt = point.at; previousX = x; previousY = y;
    }
    const force = physical(vm, 'gForce', 'g');
    const lateral = physical(vm, 'gLat', 'g'), longitudinal = physical(vm, 'gLong', 'g');
    const live = force.live && lateral.live && longitudinal.live;
    // A held marker uses one combined sample rather than mixing old and fresh axes.
    const point = live ? { value: force.value, lateral: lateral.value, longitudinal: longitudinal.value } :
        vm.model.readings.gForce.lastValid;
    if (point && Number.isFinite(point.value) && Number.isFinite(point.lateral) && Number.isFinite(point.longitudinal)) {
        const scale = radius / Math.max(1.5, point.value);
        cv.circle(cx - point.lateral * scale, cy - point.longitudinal * scale, 7, live ? t.accent2 : t.dim);
    }
    const peaks = ['gLat', 'gLong'].map((id) => {
        const reading = vm.model.readings[id];
        return fmt(Number.isFinite(reading.min) && Number.isFinite(reading.max) ?
            Math.max(Math.abs(reading.min), Math.abs(reading.max)) : null, 1).replace(/\.0$/, '');
    });
    text(cv, 'Lat ' + peaks[0] + 'G | Long ' + peaks[1] + 'G', cx, cy + radius + 26,
        box.w, 18, t.text, { align: 'center', font: 'num' });
}
function pedalStatus(cv, t, vm, id, title, cx, y, width) {
    const current = reading(vm, id), value = current.sample ? current.sample.value : null;
    const active = value === 'APPLIED' || value === 'ENGAGED';
    const changing = value === 'LOCKING' || value === 'RELEASING';
    const activeColor = id === 'parkingBrake' ? t.crit : t.accel;
    const color = !current.live ? t.dim : changing ? t.warn : active ? activeColor : t.dim;
    cv.roundRect(cx - width / 2, y, width, 32, 6, active || changing ? color + '20' : t.panelTop);
    cv.strokeRoundRect(cx - width / 2, y, width, 32, 6, 1.5, color);
    text(cv, title, cx, y + 13, width - 8, 12, t.text, { align: 'center', font: 'bold' });
    text(cv, value || '--', cx, y + 27, width - 8, 12, color, { align: 'center', font: 'bold' });
}
function wheel(cv, t, x, y, angle, cosine, sine) {
    const point = (dx, dy) => [x + dx * cosine - dy * sine, y + dx * sine + dy * cosine];
    const line = (ax, ay, bx, by, width, color) => {
        const a = point(ax, ay), b = point(bx, by);
        cv.line(a[0], a[1], b[0], b[1], width, color);
    };
    const body = (inset, color) => {
        const w = WHEEL_HALF_WIDTH - inset, h = WHEEL_HALF_HEIGHT - inset, r = 10 - inset;
        cv.quad([point(-w, -h + r), point(w, -h + r), point(w, h - r), point(-w, h - r)], color);
        line(-w + r, -h + r, w - r, -h + r, r * 2, color);
        line(-w + r, h - r, w - r, h - r, r * 2, color);
    };
    body(-1, t.tick);
    body(1, t.panelTop);
    const shown = fmt(angle.value, 1) + '°', options = { align: 'center', font: 'num' };
    const size = Math.min(30, 30 * 54 / Math.max(1, cv.textWidth(shown, 30, options)));
    text(cv, shown, x, y + 10, 54, size, angle.live ? t.accent2 : t.dim, options);
}
function wheelData(cv, t, vm, wheelId, x, y) {
    const options = { align: 'center', font: 'num' };
    wheelFields.forEach((field, index) => {
        const current = physical(vm, field.prefix + wheelId, field.unit);
        const shown = fmt(current.value, field.places) + ' ' + field.label;
        const color = field.unit === 'F' ? temperatureColor(t, field.prefix, current) : (current.live ? t.accent : t.dim);
        const size = Math.min(26, 26 * 108 / Math.max(1, cv.textWidth(shown, 26, options)));
        text(cv, shown, x, y - 20 + index * 28, 108, size, color, options);
    });
}
function progress(cv, t, cx, y, end, value, color, fullScale) {
    cv.line(cx, y, end, y, 14, t.track);
    if (value === null) return;
    const fill = Math.min(1, value / fullScale);
    if (fill > 0) cv.line(cx, y, cx + (end - cx) * fill, y, 10, color);
}
function axle(cv, t, vm, name, cx, cy) {
    const motorTorque = physical(vm, 'sway' + name + 'MotorActual', 'Nm');
    const front = name === 'Front';
    let roadAngle = physical(vm, front ? 'frontAxleNative' : 'rearAxle', 'deg');
    let visualAngle = (roadAngle.value || 0) * (front ? 2 : 10);
    if (front && !roadAngle.live) {
        const diagnostic = physical(vm, 'frontAxle', 'deg');
        if (diagnostic.live || roadAngle.value === null) roadAngle = diagnostic;
        const noCrc = physical(vm, 'steeringNoCrc', 'deg');
        const driver = noCrc.live ? noCrc : physical(vm, 'steeringCrc', 'deg');
        // The driver angle can animate the graphic while the numeric label still shows axle angle.
        visualAngle = driver.live ? Math.max(-60, Math.min(60, driver.value / 8)) : (roadAngle.value || 0) * 2;
    }
    const rotation = -visualAngle * Math.PI / 180;
    const cosine = Math.cos(rotation), sine = Math.sin(rotation);
    const options = { align: 'center', font: 'num' }, width = 92;
    const torqueColor = motorTorque.live ? t.accent2 : t.dim;
    [-1, 1].forEach((side) => {
        const start = cx + side * POWER_BOX_HALF_WIDTH;
        const wheelX = cx + side * WHEEL_OFFSET;
        const torque = motorTorque.value === null ? null : Math.max(0, motorTorque.value * side);
        // The wheel masks the bar ends at every steering angle.
        progress(cv, t, start, cy, wheelX, torque, torqueColor, MOTOR_TORQUE_FULL_SCALE_NM);
        wheel(cv, t, wheelX, cy, roadAngle, cosine, sine);
        const wheelId = (front ? 'F' : 'R') + (side < 0 ? 'LH' : 'RH');
        wheelData(cv, t, vm, wheelId, cx + side * 306, cy);
        const shown = fmt(torque, 2) + ' Nm';
        const size = Math.min(20, 20 * width / Math.max(1, cv.textWidth(shown, 20, options)));
        text(cv, shown, start + side * (8 + width / 2), cy + 43, width, size, torqueColor, options);
    });
}
function powerBox(cv, t, vm, id, cx, cy) {
    const power = physical(vm, id, 'hp');
    const shown = fmt(power.value, 0) + ' HP';
    const options = { align: 'center', font: 'num' };
    const size = Math.min(22, 22 * 92 / Math.max(1, cv.textWidth(shown, 22, options)));
    const x = cx - POWER_BOX_HALF_WIDTH, y = cy - POWER_BOX_HALF_HEIGHT;
    const w = POWER_BOX_HALF_WIDTH * 2, h = POWER_BOX_HALF_HEIGHT * 2;
    cv.roundRect(x, y, w, h, POWER_BOX_RADIUS, t.panelTop);
    cv.strokeRoundRect(x, y, w, h, POWER_BOX_RADIUS, 2, t.tick);
    text(cv, shown, cx, cy + 8, 92, size, power.live ? t.accent : t.dim, options);
}
function torqueSplit(cv, t, vm, cx, frontY, rearY) {
    const current = physical(vm, 'rearTorqueShare', '%'), rear = current.value, middle = (frontY + rearY) / 2;
    const color = current.live ? t.accent2 : t.dim;
    const front = rear === null ? null : 100 - rear, top = frontY - 16, bottom = rearY + 16;
    cv.fillRect(cx - 14, top, 28, bottom - top, t.track);
    if (front !== null && front > 0) {
        const height = (middle - top) * front / 100;
        cv.fillRect(cx - 11, middle - height, 22, height, color);
    }
    if (rear !== null && rear > 0) cv.fillRect(cx - 11, middle, 22, (bottom - middle) * rear / 100, color);
    cv.line(cx - 18, middle, cx + 18, middle, 2, t.tick);
}
function rearDiffLock(cv, t, vm, cx, cy) {
    const current = physical(vm, 'rearDiffLockTorque', 'Nm');
    const shown = current.live ? fmt(current.value, 0) + ' Nm' : '--';
    const color = current.live ? t.accent2 : t.dim;
    text(cv, 'DIFF ' + shown, cx, cy + 44, 112, 15, color, { align: 'center' });
    if (!current.live || current.value <= 0) return;

    const stroke = 3, inset = stroke / 2, radius = POWER_BOX_RADIUS;
    const x = POWER_BOX_HALF_WIDTH - radius, y = POWER_BOX_HALF_HEIGHT - radius;
    const sideX = POWER_BOX_HALF_WIDTH - inset;
    const top = cy - POWER_BOX_HALF_HEIGHT + inset, bottom = cy + POWER_BOX_HALF_HEIGHT - inset;
    const quarterArc = (radius - inset) * Math.PI / 2;
    let remaining = Math.min(1, current.value / REAR_DIFF_LOCK_FULL_SCALE_NM) * 2 * (x + y + quarterArc);
    const line = (offsetX, startY, dx, dy) => {
        if (remaining <= 0) return;
        const length = Math.abs(dx) + Math.abs(dy);
        const fill = Math.min(1, remaining / length);
        const endX = offsetX + dx * fill, endY = startY + dy * fill;
        cv.line(cx + offsetX, startY, cx + endX, endY, stroke, color);
        cv.line(cx - offsetX, startY, cx - endX, endY, stroke, color);
        remaining -= length;
    };
    const corner = (cornerY, angle) => {
        if (remaining <= 0) return;
        const endAngle = angle + 90 * Math.min(1, remaining / quarterArc);
        cv.arc(cx + x, cornerY, radius - stroke, radius, angle, endAngle, color);
        cv.arc(cx - x, cornerY, radius - stroke, radius, 360 - endAngle, 360 - angle, color);
        remaining -= quarterArc;
    };
    // Both halves advance from the top center to the bottom center.
    line(0, top, x, 0);
    corner(cy - y, 0);
    line(sideX, cy - y, 0, 2 * y);
    corner(cy + y, 90);
    line(x, bottom, -x, 0);
}
function chassis(cv, t, vm, box) {
    const cx = box.x + box.w / 2, top = box.y + 8, bottom = box.y + box.h - 8;
    const spacing = Math.min(222, bottom - top - (WHEEL_HALF_HEIGHT + 12) * 2), middle = (top + bottom) / 2;
    const frontY = middle - spacing / 2, rearY = middle + spacing / 2;
    [-1, 1].forEach((side) => {
        const outer = cx + side * box.w / 2;
        cv.line(outer, top, outer, bottom, 2, t.tick);
        cv.line(outer, middle, cx + side * POWER_BOX_HALF_WIDTH, middle, 2, t.tick);
    });
    axle(cv, t, vm, 'Front', cx, frontY);
    axle(cv, t, vm, 'Rear', cx, rearY);
    torqueSplit(cv, t, vm, cx, frontY, rearY);
    powerBox(cv, t, vm, 'frontPower', cx, frontY);
    powerBox(cv, t, vm, 'rearPower', cx, rearY);
    rearDiffLock(cv, t, vm, cx, rearY);
}
module.exports = { chassis, gMeter, pedalStatus, physical, liveRaw };

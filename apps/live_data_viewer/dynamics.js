'use strict';
const { C, text, get, numeric, fmt } = require('./instruments');

// Fixed display references only, not measured mechanical limits.
const ANGLE_FULL_SCALE_RAD = Math.PI;
const ACTUATOR_TORQUE_FULL_SCALE_NM = 1000;
const WHEEL_OFFSET = 260, WHEEL_HALF_WIDTH = 42, WHEEL_HALF_HEIGHT = 68;
const POWER_BOX_HALF_WIDTH = 58;
const G_TRAIL_MS = 10000;
const fields = [
    { suffix: 'MotorAngle', unit: 'rad', places: 1 },
    { suffix: 'Torque', unit: 'Nm', places: 1 },
    { suffix: 'MotorTarget', unit: 'Nm', places: 2 },
    { suffix: 'MotorActual', unit: 'Nm', places: 2 },
];
const wheelFields = [
    { prefix: 'pressure', unit: 'psi', label: 'PSI', places: 0 },
    { prefix: 'tyreTemp', unit: 'F', label: 'F', places: 0 },
    { prefix: 'wheelSpeed', unit: 'mph', label: 'MPH', places: 1 },
];
function physical(vm, id, unit) {
    const state = get(vm, id);
    return vm.model.definitions[id].unit === unit && state.state === 'live' && !state.retained ? numeric(vm, id) : null;
}
function gMeter(cv, t, vm, cy) {
    const cx = 160, radius = 126, now = Date.now(), cutoff = now - G_TRAIL_MS;
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
            cv.line(previousX, previousY, x, y, 3, C.cyan + alpha.toString(16).padStart(2, '0'));
        }
        previousAt = point.at; previousX = x; previousY = y;
    }
    const force = physical(vm, 'gForce', 'g');
    const lateral = physical(vm, 'gLat', 'g'), longitudinal = physical(vm, 'gLong', 'g');
    if (force !== null && lateral !== null && longitudinal !== null) {
        const scale = radius / Math.max(1.5, force);
        cv.circle(cx - lateral * scale, cy - longitudinal * scale, 7, C.cyan);
    }
    const peaks = ['gLat', 'gLong'].map((id) => {
        const reading = vm.model.readings[id];
        return fmt(Number.isFinite(reading.min) && Number.isFinite(reading.max) ?
            Math.max(Math.abs(reading.min), Math.abs(reading.max)) : null, 1).replace(/\.0$/, '');
    });
    text(cv, 'Lat ' + peaks[0] + 'G | Long ' + peaks[1] + 'G', cx, cy + radius + 26,
        280, 20, t.text, { align: 'center', font: 'num' });
}
function pedalStatus(cv, t, vm, id, title, cx, y) {
    const state = get(vm, id), value = state.state === 'live' && !state.retained ? state.value : null;
    const active = value === 'APPLIED' || value === 'ENGAGED';
    const changing = value === 'LOCKING' || value === 'RELEASING';
    const color = changing ? C.amber : active ? id === 'parkingBrake' ? C.red : C.blue : t.dim;
    cv.roundRect(cx - 68, y, 136, 32, 6, active || changing ? color + '20' : t.panelTop);
    cv.strokeRoundRect(cx - 68, y, 136, 32, 6, 1.5, color);
    text(cv, title, cx, y + 12, 124, 11, t.text, { align: 'center', font: 'bold' });
    text(cv, value || '--', cx, y + 26, 124, 11, color, { align: 'center', font: 'bold' });
}
function pedals(cv, t, vm) {
    const top = vm.contentTop + 98, bottom = vm.contentBottom - 46, width = 64;
    [['brakePressure', 'BRAKE', 1360, 84, 'bar'], ['accelerator', 'ACCELERATOR', 1520, 100, '%']].forEach((field) => {
        const [id, title, cx, fullScale, unit] = field, x = cx - width / 2;
        const value = physical(vm, id, unit), color = value === null ? t.dim : C.cyan;
        const shown = fmt(value, id === 'accelerator' ? 0 : 1) + ' ' + unit;
        const options = { align: 'center', font: 'num' };
        const size = Math.min(28, 28 * 136 / Math.max(1, cv.textWidth(shown, 28, options)));
        text(cv, title, cx, vm.contentTop + 36, 136, 16, t.dim, { align: 'center', font: 'bold' });
        text(cv, shown, cx, vm.contentTop + 72, 136, size, color, options);
        cv.roundRect(x, top, width, bottom - top, 6, t.track);
        if (value !== null) {
            const height = (bottom - top - 6) * Math.max(0, Math.min(1, value / fullScale));
            if (height > 0) cv.roundRect(x + 3, bottom - 3 - height, width - 6, height, Math.min(4, height / 2), color);
        }
        cv.strokeRoundRect(x, top, width, bottom - top, 6, 2, t.tick);
        [0, fullScale].forEach((limit) => {
            const y = limit === 0 ? bottom : top;
            cv.line(x + width + 4, y, x + width + 10, y, 1, t.tick);
            text(cv, String(limit), x + width + 12, y + 5, 32, 13, t.dim, { font: 'num' });
        });
    });
    pedalStatus(cv, t, vm, 'parkingBrake', 'PARKING BRAKE', 1360, bottom + 12);
    pedalStatus(cv, t, vm, 'kickdown', 'KICKDOWN', 1520, bottom + 12);
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
    const shown = fmt(angle, 1) + '°', options = { align: 'center', font: 'num' };
    const size = Math.min(36, 36 * 68 / Math.max(1, cv.textWidth(shown, 36, options)));
    text(cv, shown, x, y + 12, 68, size, angle === null ? t.dim : C.cyan, options);
}
function wheelData(cv, t, vm, wheelId, x, y) {
    const options = { align: 'center', font: 'num' };
    wheelFields.forEach((field, index) => {
        const value = physical(vm, field.prefix + wheelId, field.unit);
        const shown = fmt(value, field.places) + ' ' + field.label;
        const size = Math.min(28, 28 * 128 / Math.max(1, cv.textWidth(shown, 28, options)));
        text(cv, shown, x, y - 24 + index * 32, 128, size, value === null ? t.dim : C.cyan, options);
    });
}
function progress(cv, t, cx, y, end, value, side, fullScale) {
    cv.line(cx, y, end, y, 14, t.track);
    if (value === null) return;
    const fill = Math.min(1, Math.max(0, value * side) / fullScale);
    if (fill > 0) cv.line(cx, y, cx + (end - cx) * fill, y, 10, C.cyan);
}
function axle(cv, t, vm, name, cx, cy) {
    const prefix = 'sway' + name;
    const angle = physical(vm, prefix + 'MotorAngle', 'rad');
    const actuatorTorque = physical(vm, prefix + 'Torque', 'Nm');
    const roadAngle = physical(vm, name === 'Front' ? 'frontAxle' : 'rearAxle', 'deg');
    const rotation = -(roadAngle === null ? 0 : roadAngle) * (name === 'Front' ? 2 : 10) * Math.PI / 180;
    const cosine = Math.cos(rotation), sine = Math.sin(rotation);
    [-1, 1].forEach((side) => {
        const start = cx + side * POWER_BOX_HALF_WIDTH;
        const wheelX = cx + side * WHEEL_OFFSET;
        // The wheel masks the bar ends at every steering angle.
        progress(cv, t, start, cy - 9, wheelX, angle, side, ANGLE_FULL_SCALE_RAD);
        progress(cv, t, start, cy + 9, wheelX, actuatorTorque, side, ACTUATOR_TORQUE_FULL_SCALE_NM);
        wheel(cv, t, wheelX, cy, roadAngle, cosine, sine);
        const wheelId = (name === 'Front' ? 'F' : 'R') + (side < 0 ? 'LH' : 'RH');
        wheelData(cv, t, vm, wheelId, cx + side * (WHEEL_OFFSET + 150), cy);
    });
    cv.line(cx, cy - 20, cx, cy + 20, 2, t.tick);
    fields.forEach((field, index) => {
        const raw = field.suffix === 'MotorAngle' ? angle :
            field.suffix === 'Torque' ? actuatorTorque : physical(vm, prefix + field.suffix, field.unit);
        const value = raw === null ? null : field.unit === 'rad' ? raw * 180 / Math.PI : raw;
        const unitSuffix = field.unit === 'rad' ? '°' : ' ' + field.unit;
        const row = cy + (index < 2 ? -25 : 43);
        [-1, 1].forEach((side) => {
            const start = cx + side * POWER_BOX_HALF_WIDTH, end = cx + side * (WHEEL_OFFSET - WHEEL_HALF_WIDTH);
            const left = Math.min(start, end) + 8, right = Math.max(start, end) - 8;
            const columnWidth = (right - left) / 2, width = columnWidth - 8;
            const x = left + columnWidth * (index % 2 + 0.5);
            // Split each original signed sample independently; missing/held is unknown, never zero.
            const magnitude = value === null ? null : Math.max(0, value * side);
            const shown = (magnitude === 0 ? '0' : fmt(magnitude, field.places)) + unitSuffix;
            const options = { align: 'center', font: 'num' };
            const size = Math.min(21, 21 * width / Math.max(1, cv.textWidth(shown, 21, options)));
            text(cv, shown, x, row, width, size, magnitude === null || magnitude === 0 ? t.dim : C.cyan, options);
        });
    });
}
function powerBox(cv, t, vm, id, cx, cy) {
    const power = physical(vm, id, 'hp');
    const shown = fmt(power, 0) + ' HP';
    const options = { align: 'center', font: 'num' };
    const size = Math.min(22, 22 * 100 / Math.max(1, cv.textWidth(shown, 22, options)));
    cv.roundRect(cx - POWER_BOX_HALF_WIDTH, cy - 22, POWER_BOX_HALF_WIDTH * 2, 44, 6, t.panelTop);
    cv.strokeRoundRect(cx - POWER_BOX_HALF_WIDTH, cy - 22, POWER_BOX_HALF_WIDTH * 2, 44, 6, 2, t.tick);
    text(cv, shown, cx, cy + 8, 100, size, power === null ? t.dim : C.cyan, options);
}
function torqueSplit(cv, t, vm, cx, frontY, rearY) {
    const rear = physical(vm, 'rearTorqueShare', '%'), middle = (frontY + rearY) / 2;
    const front = rear === null ? null : 100 - rear, top = frontY - 16, bottom = rearY + 16;
    cv.fillRect(cx - 14, top, 28, bottom - top, t.track);
    if (front !== null && front > 0) {
        const height = (middle - top) * front / 100;
        cv.fillRect(cx - 11, middle - height, 22, height, C.cyan);
    }
    if (rear !== null && rear > 0) cv.fillRect(cx - 11, middle, 22, (bottom - middle) * rear / 100, C.cyan);
    cv.line(cx - 18, middle, cx + 18, middle, 2, t.tick);
}
module.exports = function dynamics(cv, t, vm) {
    cv.targets = [];
    const cx = 800, top = vm.contentTop + 24, bottom = vm.contentBottom - 36;
    const spacing = Math.min(276, bottom - top - WHEEL_HALF_HEIGHT * 2), middle = (top + bottom) / 2;
    pedals(cv, t, vm);
    gMeter(cv, t, vm, middle);
    [-1, 1].forEach((side) => {
        const outer = cx + side * 480;
        cv.line(outer, top - 16, outer, bottom + 16, 2, t.tick);
        cv.line(outer, middle, cx + side * POWER_BOX_HALF_WIDTH, middle, 2, t.tick);
    });
    axle(cv, t, vm, 'Front', cx, middle - spacing / 2);
    axle(cv, t, vm, 'Rear', cx, middle + spacing / 2);
    torqueSplit(cv, t, vm, cx, middle - spacing / 2, middle + spacing / 2);
    powerBox(cv, t, vm, 'frontPower', cx, middle - spacing / 2);
    powerBox(cv, t, vm, 'rearPower', cx, middle + spacing / 2);
};

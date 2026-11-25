'use strict';
const channels = require('./bm3_channels');
const { rpmColor, text } = require('./instruments');

const titles = {
    14: ['Intake manifold pressure', '(measured)'],
    20: ['Exhaust-relevant misfires', '(all cylinders)'],
    26: ['RAM Boost Pressure', '(Manifold Target)'],
    43: ['RAM Torque at Clutch', 'Pre-DrivDynmcs (Target)'],
};
const unavailable = { unsupported: 'N/A', ambient: 'Ambient', error: 'Error' };
function lines(cv, channel, width) {
    if (titles[channel.id]) return titles[channel.id];
    const words = channel.name.replace('(RAM) ', 'RAM ').split(' '), out = [''];
    words.forEach((word) => {
        const last = out.length - 1, next = out[last] ? out[last] + ' ' + word : word;
        if (out[last] && cv.textWidth(next, 11) > width) out.push(word);
        else out[last] = next;
    });
    return out;
}
module.exports = function drawBm3(cv, t, vm) {
    const feed = vm.bm3, now = Date.now(), gap = 5, x0 = 16;
    const top = vm.contentTop, bottom = vm.contentBottom - 22;
    const width = (cv.w - x0 * 2 - gap * 5) / 6, height = (bottom - top - gap * 7) / 8;
    channels.forEach((channel, index) => {
        const x = x0 + (index % 6) * (width + gap), y = top + Math.floor(index / 6) * (height + gap);
        cv.roundRect(x, y, width, height, 4, t.panelBottom);
        const target = /\b(?:target|setpoint)\b/i.test(channel.name);
        const label = lines(cv, channel, width - 44);
        label.slice(0, 2).forEach((line, row) => text(cv, line, x + 7, y + 12 + row * 11, width - 44, 11, target ? t.target : t.text));
        text(cv, channel.unit, x + width - 6, y + 12, 41, 10, t.dim, { align: 'right' });
        for (let bank = 0; bank < 2; bank++) {
            const readings = !vm.demo && feed && feed.banks[bank];
            const sample = readings && readings.samples[channel.id], reason = readings && readings.reasons[channel.id];
            const fresh = sample && Number.isFinite(sample.value) && now <= sample.expiresAt;
            const value = fresh ? (Number.isInteger(sample.value) ? String(sample.value) : sample.value.toFixed(2)) :
                sample ? 'Stale' : reason && unavailable[reason.kind] || '--';
            const color = !fresh ? t.dim : channel.unit === 'rpm' ? rpmColor(t, sample.value) : target ? t.target : t.accent;
            const left = x + 7 + bank * (width / 2);
            text(cv, 'DME ' + (bank + 1), left, y + height - 6, 36, 9, t.dim);
            text(cv, value, left + 39, y + height - 5, width / 2 - 52, 17, color, { font: 'num' });
        }
    });
    if (!feed || vm.demo) {
        const status = vm.demo ? 'BM3 live diagnostics are disabled in demo' : 'BM3 diagnostics inactive';
        text(cv, status, x0, vm.contentBottom - 5, cv.w - x0 * 2, 12, t.dim);
    } else {
        const half = (cv.w - x0 * 2) / 2;
        feed.banks.forEach((bank, index) => text(cv, 'DME ' + (index + 1) + ': ' + feed.summary(bank, now),
            x0 + half * index, vm.contentBottom - 5, half - gap, 12, t.dim));
    }
};

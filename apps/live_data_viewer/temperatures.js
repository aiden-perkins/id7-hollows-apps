'use strict';

const I = require('./instruments');
const C = I.C;

// Keep source leads and sensor locations separate; none establishes a safe range.
// Units, current values and observation extrema are owned by the plot helper.
const groups = [
    {
        box: { x: 24, w: 770 },
        options: { title: 'ENGINE / OIL & COOLANT' },
        series: [
            { id: 'oil', label: 'Engine oil', color: C.amber },
            { id: 'coolant', label: 'Coolant / water', color: C.blue },
        ],
    },
    {
        box: { x: 806, w: 770 },
        options: { title: 'DRIVELINE / DISTINCT SOURCE LEADS' },
        series: [
            { id: 'transmission1', label: 'Oil 1 / BasicDataSet', color: C.purple },
            { id: 'transmission2', label: 'Oil 2 / EGS', color: C.cyan },
            { id: 'converter', label: 'Torque converter', color: C.amber },
        ],
    },
    {
        box: { x: 24, w: 770 },
        options: { title: 'AIR / SENSOR LOCATIONS' },
        series: [
            { id: 'iat', label: 'Intake air / IAT', color: C.amber },
            { id: 'outside', label: 'Outside air', color: C.blue },
            { id: 'chargeAir', label: 'Charge air', color: C.purple },
            { id: 'cabin', label: 'Cabin air', color: C.cyan },
        ],
    },
    {
        box: { x: 806, w: 770 },
        options: { title: 'TYRES / REPORTED WHEEL POSITIONS' },
        series: [
            { id: 'tyreTempFLH', label: 'Front left', color: C.blue },
            { id: 'tyreTempFRH', label: 'Front right', color: C.cyan },
            { id: 'tyreTempRLH', label: 'Rear left', color: C.amber },
            { id: 'tyreTempRRH', label: 'Rear right', color: C.purple },
        ],
    },
];

module.exports = function temperatures(cv, t, vm) {
    const bottom = Number.isFinite(vm.contentBottom) ? vm.contentBottom : 452;
    const height = (bottom - 44 - 12) / 2;
    groups.forEach((group, index) => {
        group.box.y = 44 + Math.floor(index / 2) * (height + 12);
        group.box.h = height;
        I.plot(cv, t, vm, group.box, group.series, group.options);
        // Small trace-colour tabs echo the M Vitals headings without another panel.
        group.series.forEach((series, index) => {
            const x = group.box.x + 14 + index * 22;
            cv.line(x, group.box.y + 1, x + 16, group.box.y + 1, 2, series.color);
        });
    });
};

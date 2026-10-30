'use strict';

const I = require('./instruments');
const C = I.C;

// Keep physical sensor identities separate; unvalidated channels remain unavailable.
// Blue-family trace colors share the same palette as the driving and health pages.
const groups = [
    {
        box: { x: 24, w: 770 },
        options: {},
        series: [
            { id: 'oil', label: 'Engine oil', color: C.series[0] },
            { id: 'coolant', label: 'Coolant', color: C.series[1] },
        ],
    },
    {
        box: { x: 806, w: 770 },
        options: {},
        series: [
            { id: 'transmission1', label: 'Trans oil 1', color: C.series[0] },
            { id: 'transmission2', label: 'Trans oil 2', color: C.series[1] },
            { id: 'converter', label: 'Converter', color: C.series[2] },
        ],
    },
    {
        box: { x: 24, w: 770 },
        options: {},
        series: [
            { id: 'iatBank1', label: 'IAT bank 1', color: C.series[0] },
            { id: 'iatBank2', label: 'IAT bank 2', color: C.series[1] },
            { id: 'outside', label: 'Outside', color: C.series[2] },
            { id: 'chargeAir', label: 'Charge air', color: C.series[3] },
            { id: 'cabin', label: 'Cabin air', color: C.series[0] },
        ],
    },
    {
        box: { x: 806, w: 770 },
        options: {},
        series: [
            { id: 'oilPressure', label: 'Oil pressure', color: C.series[0] },
            { id: 'transmissionPressure', label: 'Trans pressure', color: C.series[1] },
            { id: 'fuelLowActual', label: 'Fuel supply', color: C.series[2] },
        ],
    },
];

module.exports = function temperatures(cv, t, vm) {
    const top = Number.isFinite(vm.contentTop) ? vm.contentTop : 44;
    const bottom = Number.isFinite(vm.contentBottom) ? vm.contentBottom : 452;
    const height = (bottom - top - 10) / 2;
    groups.forEach((group, index) => {
        group.box.x = index % 2 ? 806 : 16;
        group.box.w = 778;
        group.box.y = top + Math.floor(index / 2) * (height + 10);
        group.box.h = height;
        I.plot(cv, t, vm, group.box, group.series, group.options);
        // Small trace-colour tabs echo the M Vitals headings without another panel.
        group.series.forEach((series, index) => {
            const x = group.box.x + 14 + index * 22;
            cv.line(x, group.box.y + 1, x + 16, group.box.y + 1, 2, series.color);
        });
    });
};

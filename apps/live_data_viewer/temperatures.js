'use strict';

const I = require('./instruments');
const C = I.C;

// Keep physical sensor identities separate; unvalidated channels remain unavailable.
// Colors are refreshed at draw time to follow the active driving-mode palette.
const groups = [
    {
        box: {},
        options: { title: 'ENGINE / CHARGE COOLER', legendWidth: 200 },
        series: [
            { id: 'oil', label: 'Engine oil' },
            { id: 'coolant', label: 'Coolant' },
            { id: 'chargeCoolerCoolant', label: 'CC coolant' },
        ],
    },
    {
        box: {},
        options: { title: 'TRANSMISSION', legendWidth: 200 },
        series: [
            { id: 'transmission1', label: 'Trans oil 1' },
            { id: 'transmission2', label: 'Trans oil 2' },
            { id: 'converter', label: 'Converter' },
        ],
    },
    {
        box: {},
        options: { title: 'EXHAUST MODEL / CATALYST GAS', legendWidth: 200 },
        series: [
            { id: 'exhaustBank1', label: 'Exh B1 mdl' },
            { id: 'exhaustBank2', label: 'Exh B2 mdl' },
            { id: 'catalystBank1', label: 'Catalyst B1' },
            { id: 'catalystBank2', label: 'Catalyst B2' },
        ],
    },
    {
        box: {},
        options: { legendWidth: 200 },
        series: [
            { id: 'iatBank1', label: 'IAT bank 1' },
            { id: 'iatBank2', label: 'IAT bank 2' },
            { id: 'outside', label: 'Outside' },
            { id: 'chargeAir', label: 'Charge air' },
            { id: 'cabin', label: 'Cabin air' },
        ],
    },
    {
        box: {},
        options: { title: 'TRANSFER CASE / REAR DIFF', legendWidth: 200 },
        series: [
            { id: 'transferCase', label: 'Clutch mdl' },
            { id: 'rearDifferential', label: 'Rear diff' },
        ],
    },
    {
        box: {},
        options: { title: 'PRESSURES', legendWidth: 200 },
        series: [
            { id: 'oilPressure', label: 'Oil pressure' },
            { id: 'transmissionPressure', label: 'Trans press.' },
            { id: 'fuelLowActual', label: 'Fuel supply' },
        ],
    },
];

module.exports = function temperatures(cv, t, vm) {
    const top = Number.isFinite(vm.contentTop) ? vm.contentTop : 44;
    const bottom = Number.isFinite(vm.contentBottom) ? vm.contentBottom : 452;
    const gap = 10, width = (1568 - 2 * gap) / 3, height = (bottom - top - gap) / 2;
    groups.forEach((group, index) => {
        group.box.x = 16 + index % 3 * (width + gap);
        group.box.w = width;
        group.box.y = top + Math.floor(index / 3) * (height + gap);
        group.box.h = height;
        group.series.forEach((series, color) => { series.color = C.series[color % C.series.length]; });
        I.plot(cv, t, vm, group.box, group.series, group.options);
        // Match each legend entry to its rolling trace and session min/max ruler.
        group.series.forEach((series, index) => {
            const x = group.box.x + 14 + index * 22;
            cv.line(x, group.box.y + 1, x + 16, group.box.y + 1, 2, series.color);
        });
    });
};

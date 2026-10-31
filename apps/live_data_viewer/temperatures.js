'use strict';

const I = require('./instruments');
const C = I.C;

// Sensor location and modeled temperatures stay explicit, including missing channels.
// All traces use the fixed instrument blue/cyan palette.
const groups = [
    {
        box: {},
        options: { title: 'ENGINE / ENVIRONMENT', legendWidth: 200, quiet: true },
        series: [
            { id: 'oil', label: 'Engine oil' },
            { id: 'coolant', label: 'Coolant' },
            { id: 'chargeCoolerCoolant', label: 'CC coolant' },
            { id: 'outside', label: 'Outside' },
            { id: 'cabin', label: 'Cabin' },
        ],
    },
    {
        box: {},
        options: { title: 'TRANSMISSION', legendWidth: 200, quiet: true },
        series: [
            { id: 'transmission1', label: 'Oil · vehicle' },
            { id: 'transmission2', label: 'Oil · EGS' },
            { id: 'converter', label: 'Converter' },
        ],
    },
    {
        box: {},
        options: { title: 'EXHAUST MODEL / CATALYST GAS', legendWidth: 200, quiet: true },
        series: [
            { id: 'exhaustBank1', label: 'Exh B1 mdl' },
            { id: 'exhaustBank2', label: 'Exh B2 mdl' },
            { id: 'catalystBank1', label: 'Cat gas B1' },
            { id: 'catalystBank2', label: 'Cat gas B2' },
        ],
    },
    {
        box: {},
        options: { title: 'AIR TEMPERATURES', legendWidth: 200, quiet: true },
        series: [
            { id: 'iat', label: 'Intake' },
            { id: 'iatBank1', label: 'Intake B1' },
            { id: 'iatBank2', label: 'Intake B2' },
            { id: 'chargeAir', label: 'CC B1/S1' },
            { id: 'preThrottleAir', label: 'Pre-thr.' },
        ],
    },
    {
        box: {},
        options: { title: 'TRANSFER CASE / REAR DIFF', legendWidth: 200, quiet: true },
        series: [
            { id: 'transferCase', label: 'Clutch mdl' },
            { id: 'rearDifferential', label: 'Rear diff' },
        ],
    },
    {
        box: {},
        options: { title: 'PRESSURES', legendWidth: 200, quiet: true },
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

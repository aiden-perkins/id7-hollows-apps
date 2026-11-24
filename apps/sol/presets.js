'use strict';

// The eleven entries in the downloaded ID7 HMI's Color menu, in its menu order.
// The swatches are illustrative. The vehicle supplies its programmed colors for each slot.
const PRESETS = [
    [1, 'Bronze', '#b97637'],
    [2, 'Bronze and white', '#b97637', '#eaf1ff'],
    [3, 'Orange', '#f56c28'],
    [4, 'Orange and white', '#f56c28', '#eaf1ff'],
    [5, 'White', '#eaf1ff'],
    [6, 'Blue', '#397ef6'],
    [7, 'Blue and white', '#397ef6', '#eaf1ff'],
    [8, 'Green', '#32cc79'],
    [9, 'Green and white', '#32cc79', '#eaf1ff'],
    [10, 'Lilac', '#b179f4'],
    [11, 'Lilac and white', '#b179f4', '#eaf1ff'],
];

function presetFor(slot) { return PRESETS.find(([id]) => id === slot); }

module.exports = { PRESETS, presetFor };

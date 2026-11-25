'use strict';

const base = {
    bg: '#080808', panelTop: '#1d1d1d', panelBottom: '#121212', panelEdge: '#333333',
    track: '#292929', tick: '#666666', text: '#f5f5f5', dim: '#9a9a9a',
    cold: '#348cff', warn: '#ff8c23', crit: '#ff4c55', accel: '#3cde54',
};

function palette(colors) {
    return Object.freeze(Object.assign({}, base, colors, { selText: colors.target }));
}

const themes = {
    carbon_track: palette({
        bg: '#151515', panelTop: '#252525', panelBottom: '#1d1d1d', track: '#303030',
        accent: '#fafafa', target: '#f6df00', accent2: '#b5b5b5', sel: '#766600',
    }),
    black_gold: palette({
        panelTop: '#211c13', panelBottom: '#14110d', panelEdge: '#393022', track: '#2a241b',
        accent: '#e8b42b', target: '#fafafa', accent2: '#a5a39c', sel: '#765b1b',
    }),
    neon_rally: palette({
        accent: '#d8f500', target: '#ff32bd', accent2: '#b5b5b5', sel: '#9c136e',
    }),
    blackened_copper: palette({
        bg: '#160e0a', panelTop: '#2a1b13', panelBottom: '#22160f', panelEdge: '#4c3427',
        track: '#34241c', tick: '#78655b', dim: '#a99b92',
        accent: '#fafafa', target: '#e47838', accent2: '#be50b7', sel: '#8d4618',
    }),
    obsidian_violet: palette({
        panelTop: '#20172a', panelBottom: '#140e1b', panelEdge: '#3a2d46', track: '#29202e',
        accent: '#fafafa', target: '#b16cff', accent2: '#e6b435', sel: '#6e30ba',
    }),
};

function themeFor(id) {
    return Object.prototype.hasOwnProperty.call(themes, id) ? themes[id] : themes.carbon_track;
}

module.exports = themeFor;

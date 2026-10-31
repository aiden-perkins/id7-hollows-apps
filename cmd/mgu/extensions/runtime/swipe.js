'use strict';

// Distances are in app drawing pixels, as are the renderer's touch coordinates.
const SLOP = 14, DISTANCE = 90, DIRECTION_RATIO = 2;

function cancelSwipe(display) {
    display.swipe = null;
    display.ownDown = null;
    display.tabDown = -1;
    display.downAt = null;
    display.dragging = false;
}

function contentTabs(display, info) {
    if (!info || !info.tabs) return 0;
    // Full-screen Settings is added by the display; other layouts may draw it in the app.
    return info.tabs.length - (display.hasSettings() && info.tabs[info.tabs.length - 1] === 'Settings' ? 1 : 0);
}

// Return true when the gesture owns this event; the normal touch handler must not also tap/scroll.
function swipeTouch(display, phase, x, y, left) {
    const info = display.tabInfo;
    if (phase === 1) {
        display.swipe = null;
        if (!display.active() || !display.gpu.touch || display.sheet || !display.onTab ||
            display.screen.chrome === false || !info) return false;
        const count = contentTabs(display, info), pl = display.place;
        if (count < 2 || !Number.isInteger(info.sel) || info.sel < 0 || info.sel >= count) return false;
        // The bottom button bar and HMI back/status areas are never swipe origins.
        const sx = x * pl.scale + pl.ox, sy = y * pl.scale + pl.oy;
        if (pl.full && (sx < left - pl.x || sx >= pl.w || sy < 0 ||
            sy >= pl.h - display.barH() || sy < display.headH() && sx >= display.headEnd)) return false;
        display.swipe = { x, y, tabs: info.tabs, selected: info.sel, count, place: pl, axis: null };
        return false;
    }

    const gesture = display.swipe;
    if (!gesture) return false;
    if (!display.active() || !display.gpu.touch || display.sheet || !display.onTab ||
        display.place !== gesture.place || !info || info.sel !== gesture.selected ||
        contentTabs(display, info) !== gesture.count) {
        // Consume the rest of a cancelled contact, even if its page/sheet changes back.
        gesture.cancelled = true;
    }
    if (!gesture.cancelled) {
        for (let i = 0; i < gesture.count; i++) {
            if (info.tabs[i] !== gesture.tabs[i]) { gesture.cancelled = true; break; }
        }
    }
    if (gesture.cancelled) {
        if (phase === 3) cancelSwipe(display);
        return true;
    }

    const dx = x - gesture.x, dy = y - gesture.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (!gesture.axis && Math.max(ax, ay) > SLOP) {
        if (ax >= DIRECTION_RATIO * ay) gesture.axis = 'horizontal';
        else if (ay >= ax) gesture.axis = 'vertical';
    }
    if (gesture.axis === 'horizontal') {
        // Lock direction until release so a diagonal tail cannot scroll or activate a target.
        display.ownDown = null; display.tabDown = -1; display.downAt = null; display.dragging = false;
        if (phase === 3) {
            cancelSwipe(display);
            const next = gesture.selected + (dx < 0 ? 1 : -1);
            if (ax >= DISTANCE && ax >= DIRECTION_RATIO * ay && next >= 0 && next < gesture.count) {
                display._openTab(next);
            }
        }
        return true;
    }
    if (phase === 3) {
        display.swipe = null;
        if (gesture.axis === 'vertical' && !display.dragging) { cancelSwipe(display); return true; }
        if (!gesture.axis && Math.max(ax, ay) > SLOP) { cancelSwipe(display); return true; }
    }
    // Leave an established vertical drag to upstream's page/sheet scrolling.
    if (gesture.axis === 'vertical') {
        display.ownDown = null; display.tabDown = -1;
        return false;
    }
    // Wait for a clear axis before upstream can interpret a diagonal move as scrolling.
    return phase === 2;
}

module.exports = { swipeTouch, cancelSwipe };

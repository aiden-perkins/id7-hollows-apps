'use strict';
const { listSheet } = require('./kit/sheet');
const G = require('./kit/gauges');
const screens = require('./screens');

// Keep vehicle actions in the controller; this view only presents sections and dispatches clicks.
class View {
    constructor(ctx) {
        this.ctx = ctx;
        this.screen = 'MAIN';
        this.values = new Map();
        this.handlers = new Map();
        this.disabled = new Set();
        this.listeners = [];
        this.positions = new Map();
        this.revision = 0;
        this.detail = null;
        this.builtRevision = -1;
        this.lines = [];
        this.active = ctx.ui.isVisible('MAIN');
        this.pendingSheet = true;
        this.sheet = listSheet({ schema: [] }, 'xDrive Lab');
        this.sheet.rows = () => { this.build(this.metrics || ctx.canvas(1600, 520)); return this.lines; };
        this.sheet.key = () => 'xdrive-' + this.screen + (this.detail ? '-' + this.detail : '');
        this.sheet.choose = () => this.select();
        this.sheet.back = () => this.back();
        const draw = this.sheet.draw.bind(this.sheet);
        this.sheet.draw = (cv, t) => {
            this.metrics = cv;
            this.build(cv);
            const targets = draw(cv, t);
            // Reuse upstream's settings list, scroll and input handling; give it a section heading.
            cv.fillRect(0, 46, 1600, 72, t.bg);
            cv.text(this.detail ? 'Read detail / ' + this.definition().title : this.definition().title, 44, 88, 30, t.text, { font: 'bold' });
            cv.roundRect(1410, 54, 150, 46, 23, t.sel || t.accent);
            cv.text(this.screen === 'MAIN' && !this.detail ? 'Top' : 'Back', 1485, 86, 24, t.bg, { align: 'center' });
            return targets;
        };
        ctx.ui.onVisible((name, on) => {
            if (name !== 'MAIN') return;
            this.active = !!on;
            this.pendingSheet = !!on;
            this.emit(this.screen, !!on);
        });
        ctx.ui.onClick('BTN_UP', () => this.sheet.move(-1));
        ctx.ui.onClick('BTN_DOWN', () => this.sheet.move(1));
        ctx.ui.onClick('BTN_SELECT', () => this.sheet.press());
        ctx.ui.onClick('BTN_BACK', () => this.back());
        ctx.display.onTap = (x, y) => {
            const target = (this.targets || []).find((q) => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h);
            return target && target.act();
        };
        ctx.display.onScroll = (dy) => { this.sheet.scroll(dy); this.sheet.release(); return true; };
        ctx.loop('MAIN', 5, () => {
            const cv = ctx.canvas(1600, 520), t = ctx.theme();
            cv.clear(t.bg);
            G.frame(cv, t, ['xDrive Lab'], 0, []);
            this.targets = this.sheet.draw(cv, t);
            cv.scroll = true;
            const result = ctx.ui.image('MAIN_GFX', cv);
            if (this.pendingSheet && this.active && ctx.display.openSheet(this.sheet)) this.pendingSheet = false;
            return result;
        });
    }
    definition() { return screens.find((entry) => entry.name === this.screen); }
    text(id, value, row) {
        const values = this.values.get(id) || [];
        values[row || 0] = String(value);
        this.values.set(id, values);
        this.revision++;
    }
    rows(id, count) {
        const values = this.values.get(id) || [];
        values.length = count;
        this.values.set(id, values);
        this.revision++;
    }
    enabled(id, on) {
        const wasDisabled = this.disabled.has(id);
        if (on) this.disabled.delete(id); else this.disabled.add(id);
        if (wasDisabled === !!on) this.revision++;
        return Promise.resolve();
    }
    onClick(id, action) { this.handlers.set(id, action); }
    onVisible(action) { this.listeners.push(action); action(this.screen, this.active); }
    emit(name, on) { this.listeners.forEach((action) => action(name, on)); }
    open(name) {
        if (!screens.some((entry) => entry.name === name)) throw new Error('Unknown lab section: ' + name);
        if (name === this.screen) return;
        this.detail = null;
        this.positions.set(this.screen, this.sheet.focus);
        this.emit(this.screen, false);
        this.screen = name;
        this.sheet.focus = this.positions.get(name) || 0;
        this.sheet.title = this.definition().title;
        this.revision++;
        this.pendingSheet = true;
        this.emit(name, this.active);
    }
    back() {
        if (this.detail) { this.detail = null; this.sheet.focus = this.detailFocus; this.revision++; return null; }
        if (this.screen === 'MAIN') { this.sheet.focus = 0; return null; }
        const item = this.definition().items.find((entry) => /_(BACK|CANCEL|HOME)$/.test(entry[1]));
        if (item && this.handlers.has(item[1])) return this.handlers.get(item[1])({ row: 0 });
        this.open('MAIN');
        return null;
    }
    select() {
        this.build(this.metrics || this.ctx.canvas(1600, 520));
        const line = this.lines[this.sheet.focus];
        if (line && line.detail) {
            this.detail = line.id;
            this.detailFocus = this.sheet.focus;
            this.sheet.focus = 0;
            this.revision++;
            return null;
        }
        if (!line || !line.action || this.disabled.has(line.id)) return null;
        const handler = this.handlers.get(line.id);
        return handler && handler({ row: line.row });
    }
    build(cv) {
        if (this.builtRevision === this.revision) return;
        this.builtRevision = this.revision;
        const lines = [];
        const items = this.detail ? this.definition().items.filter((item) => item[1] === this.detail) :
            this.screen === 'MAIN' ? this.definition().items.slice().sort((a, b) => {
                const rank = (item) => item[1] === 'HOME_SAFETY' ? 0 : item[0] === 'button' ? 1 : 2;
                return rank(a) - rank(b);
            }) : this.definition().items;
        for (const item of items) {
            const [kind, id, initial] = item;
            const action = kind === 'button' && this.handlers.has(id);
            const disabled = this.disabled.has(id);
            const values = this.values.get(id) || [initial || ''];
            if (kind !== 'button' && !this.detail && this.screen !== 'RAW') {
                const full = values.join('\n'), first = full.split('\n')[0];
                const summary = Array.from(first).slice(0, 70).join('');
                lines.push({ label: summary + (full !== summary ? ' … (read full text)' : ''),
                    id, detail: true, kind: 'more' });
                continue;
            }
            values.forEach((value, row) => {
                // Measure using the same font as upstream settings. Never ellipsize evidence.
                const prefix = action && disabled ? '[Blocked] ' : '';
                for (const paragraph of String(value || '').split('\n')) {
                    let remaining = prefix + paragraph;
                    if (!remaining.trim()) continue;
                    while (remaining.length) {
                        let end = remaining.length;
                        if (cv.textWidth(remaining, 28) > 1390) {
                            let lo = 1, hi = end;
                            while (lo < hi) {
                                const mid = Math.ceil((lo + hi) / 2);
                                if (cv.textWidth(remaining.slice(0, mid), 28) <= 1390) lo = mid; else hi = mid - 1;
                            }
                            end = lo;
                            const space = remaining.lastIndexOf(' ', end);
                            if (space > end / 2) end = space + 1;
                        }
                        lines.push({ label: remaining.slice(0, end), id, row, action: action && !disabled, kind: action && !disabled ? 'more' : null });
                        remaining = remaining.slice(end);
                    }
                }
            });
        }
        this.lines = lines;
        this.sheet.focus = Math.min(this.sheet.focus, Math.max(0, lines.length - 1));
    }
}
module.exports = View;

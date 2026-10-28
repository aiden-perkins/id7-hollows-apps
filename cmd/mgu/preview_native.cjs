'use strict';

// Host-only approximation of RHMI lists. The car still renders its own native UI.
const path = require('path');

class NativePreview {
    constructor(spec, kitDir) {
        this.spec = spec;
        this.Canvas = require(path.join(kitDir, 'canvas')).Canvas;
        this.play = require(path.join(kitDir, 'record')).play;
        this.screens = new Map();
        this.items = new Map();
        this.names = new Map();
        this.nextId = 1000000;
        this.revision = 0;
        this.focused = new Map();
        this.offsets = new Map();
        for (const screen of spec.screens || []) this.addScreen(screen);
        const withSettings = (spec.screens || []).find((s) => s.settings);
        if ((spec.settings || []).length) {
            const name = withSettings ? withSettings.name : 'SETTINGS';
            if (!this.screens.has(name)) this.addScreen({ name, title: 'Settings', parent: spec.screens[0].name, kind: 'settings' });
            for (const setting of spec.settings) {
                const id = 'SET_' + setting.key.toUpperCase();
                const kind = setting.type === 'bool' ? 'checkbox' : ['choice', 'number'].includes(setting.type) ? 'dropdown' : 'tworow';
                const item = this.addItem(name, kind, id, setting.label);
                item.setting = setting;
                if (kind === 'dropdown') {
                    const values = setting.type === 'choice' ? (setting.options || []).map((o) => o[0]) : setting.steps || [];
                    item.rows = values.map((value, i) => ({ ItemText: setting.type === 'choice' ? String(setting.options[i][1]) : String(value) }));
                    item.header = setting.label;
                }
            }
        }
    }
    addScreen(screen) {
        const value = Object.assign({ kind: 'list' }, screen, { items: [] });
        const id = this.spec.stateIds && this.spec.stateIds[screen.name];
        value.id = id == null ? this.nextId++ : id;
        this.screens.set(screen.name, value);
        this.names.set(String(value.id), screen.name);
        this.addItem(screen.name, 'title', screen.name + '_TITLE', screen.title || this.spec.title);
        for (const item of screen.items || []) this.addItem(screen.name, item[0], item[1], item[2] || '');
        for (const button of screen.buttons || []) this.addItem(screen.name, 'button', button[0], button[1] || '');
    }
    addItem(screen, kind, name, label) {
        if (this.items.has(name)) return this.items.get(name);
        const cells = kind === 'twocol' ? { Text1stCol: String(label), Text2ndCol: '' } :
            kind === 'tworow' ? { Text1stRow: String(label), Text2ndRow: '' } : { Text: String(label) };
        const item = { id: this.nextId++, name, screen, kind, rows: [cells], visible: true, enabled: true, selected: 0, image: null };
        this.items.set(name, item);
        this.names.set(String(item.id), name);
        if (kind !== 'title') this.screens.get(screen).items.push(item);
        return item;
    }
    item(name) {
        if (!this.items.has(name)) {
            this.items.set(name, { id: this.nextId++, name, kind: 'text', rows: [{}], visible: true, enabled: true, selected: 0 });
        }
        return this.items.get(name);
    }
    id(name) { const screen = this.screens.get(name); return screen ? screen.id : this.item(name).id; }
    screen(name) { return this.screens.get(name); }
    parent(name) {
        const screen = this.screen(name);
        if (!screen || screen.parent === false) return null;
        const target = typeof screen.parent === 'string' ? screen.parent : (this.spec.screens[0] || {}).name;
        return target && target !== name && this.screens.has(target) ? target : null;
    }
    property(name, key, value) {
        if (key === 'ParentState' || key === 9) {
            const screen = this.screen(name);
            if (screen) { screen.parent = this.names.get(String(value)) || value; this.revision++; }
            return;
        }
        const item = this.item(name);
        const property = key === 'Visible' || key === 2 ? 'visible' : key === 'Enabled' || key === 1 ? 'enabled' : null;
        if (property && item[property] !== !!value) { item[property] = !!value; this.revision++; }
    }
    count(name, count) {
        if (!Number.isInteger(count) || count < 0) throw new Error('Invalid row count for ' + name);
        const item = this.item(name);
        if (item.rows.length === count) return;
        item.rows.length = count;
        for (let row = 0; row < count; row++) if (!item.rows[row]) item.rows[row] = {};
        this.revision++;
    }
    cells(name, row, values) {
        if (!Number.isInteger(row) || row < 0) throw new Error('Invalid row for ' + name);
        const item = this.item(name);
        while (item.rows.length <= row) item.rows.push({});
        for (const [key, value] of Object.entries(values)) {
            if (item.rows[row][key] !== value) { item.rows[row][key] = value; this.revision++; }
        }
    }
    text(name, value, row = 0, cell = 'Text') { this.cells(name, row, { [cell]: String(value) }); }
    selected(name, row) {
        const item = this.item(name);
        if (item.selected !== row) { item.selected = row; this.revision++; }
    }
    checked(name, checked, row = 0) { this.cells(name, row, { checked: !!checked }); }
    setValue(name, args) {
        if (typeof args[0] === 'number') this.cells(name, args[0], { [args[1]]: args[2] });
        else if (args[0] === 'SelectedItem') this.selected(name, args[1]);
        else if (args[0] === 'HeaderText') { this.item(name).header = String(args[1]); this.revision++; }
        else this.cells(name, 0, { [args[0]]: args[1] });
    }
    inline(name) {
        const item = this.items.get(name);
        return !!item && item.kind === 'graphic' && this.screen(item.screen).kind !== 'canvas';
    }
    image(name, drawing) {
        const item = this.item(name);
        if (drawing && drawing.d && Number.isInteger(drawing.w) && Number.isInteger(drawing.h)) item.image = drawing;
        else if (drawing && typeof drawing.words === 'function') {
            const canvas = new this.Canvas(drawing.w, drawing.h);
            this.play(drawing.words(), canvas); item.image = canvas;
        } else item.image = null;
        this.revision++;
    }
    focus(name, row) {
        const item = this.items.get(name);
        if (!item || !item.screen || !item.visible) throw new Error('Unknown or hidden preview component ' + name);
        if (!Number.isInteger(row) || row < 0 || row >= item.rows.length) throw new Error('Row outside ' + name + ': ' + row);
        this.focused.set(item.screen, { name, row, scroll: true }); this.revision++;
    }
    press(name, row) {
        const item = this.items.get(name);
        if (item && !item.enabled) throw new Error('Preview component is disabled: ' + name);
        this.focus(name, row);
    }
    selectable(item) { return ['button', 'iconbutton', 'checkbox', 'twocol', 'tworow', 'dropdown'].includes(item.kind); }
    entries(screen) {
        const entries = [];
        for (const item of screen.items) {
            if (!item.visible) continue;
            const rows = item.kind === 'dropdown' ? [item.rows[item.selected] || {}] : item.rows;
            rows.forEach((cells, row) => entries.push({ item, cells, row: item.kind === 'dropdown' ? item.selected : row }));
        }
        return entries;
    }
    wrap(canvas, text, width, size, limit) {
        const lines = [];
        for (const paragraph of String(text).split('\n')) {
            let line = '';
            for (const word of paragraph.split(/\s+/).filter(Boolean)) {
                if (line && canvas.textWidth(line + word, size) > width) { lines.push(line); line = ''; }
                for (const ch of word) {
                    if (line && canvas.textWidth(line + ch, size) > width) { lines.push(line); line = ''; }
                    line += ch;
                }
                line += ' ';
            }
            lines.push(line.trimEnd());
        }
        if (lines.length > limit) {
            lines.length = limit;
            let last = lines[limit - 1] || '';
            while (last && canvas.textWidth(last + '...', size) > width) last = last.slice(0, -1);
            lines[limit - 1] = last + '...';
        }
        return lines;
    }
    layout(canvas, entry, width) {
        const item = entry.item, cells = entry.cells;
        if (item.kind === 'graphic') return { height: item.image ? Math.min(280, Math.round(item.image.h * Math.min(width / item.image.w, 1))) + 20 : 56 };
        if (item.kind === 'dropdown') return { height: 78, first: [item.header || 'Select'], second: [String(cells.ItemText == null ? '' : cells.ItemText)] };
        if (item.kind === 'tworow') return { height: 92,
            first: this.wrap(canvas, cells.Text1stRow == null ? (cells.Text == null ? '' : cells.Text) : cells.Text1stRow, width - 40, 26, 1),
            second: this.wrap(canvas, cells.Text2ndRow == null ? '' : cells.Text2ndRow, width - 40, 23, 2) };
        if (item.kind === 'twocol') return { height: 62 };
        const prefix = item.kind === 'checkbox' ? (cells.checked || cells.eParam_RowSelected ? '[x] ' : '[ ] ') : '';
        const limit = item.kind === 'text3' ? 3 : item.kind === 'scroll' ? 6 : 1;
        const lines = this.wrap(canvas, prefix + (cells.Text == null ? '' : cells.Text), width - 40, 26, limit);
        return { height: Math.max(this.selectable(item) ? 56 : 40, lines.length * 32 + 14), first: lines };
    }
    render(name) {
        const screen = this.screen(name);
        if (!screen) throw new Error('No native preview screen ' + name);
        const width = 1600, height = 720, left = 92, top = 96, listWidth = 1472, listHeight = 560;
        const canvas = new this.Canvas(width, height).clear('#0b1018');
        const content = new this.Canvas(listWidth, listHeight).clear('#0b1018');
        const entries = this.entries(screen);
        let y = 0;
        for (const entry of entries) { entry.layout = this.layout(content, entry, listWidth); entry.y = y; y += entry.layout.height; }
        let focus = this.focused.get(name);
        if (!focus) {
            const first = entries.find((entry) => entry.item.enabled && this.selectable(entry.item));
            if (first) focus = { name: first.item.name, row: first.row, scroll: false };
        }
        let offset = this.offsets.get(name) || 0;
        const target = focus && entries.find((entry) => entry.item.name === focus.name && entry.row === focus.row);
        if (target && focus.scroll) {
            if (target.y < offset) offset = target.y;
            else if (target.y + target.layout.height > offset + listHeight) offset = target.y + target.layout.height - listHeight;
        }
        offset = Math.max(0, Math.min(offset, Math.max(0, y - listHeight))); this.offsets.set(name, offset);
        for (const entry of entries) {
            const item = entry.item, cells = entry.cells, layout = entry.layout, py = entry.y - offset;
            if (py >= listHeight || py + layout.height <= 0) continue;
            const focused = target === entry, color = item.enabled ? '#edf3fa' : '#7e8a9c';
            if (focused) { content.fillRect(0, py, listWidth, layout.height, '#174a70'); content.fillRect(0, py, 4, layout.height, '#62caff'); }
            if (this.selectable(item)) content.fillRect(18, py + layout.height - 1, listWidth - 36, 1, '#243040');
            if (item.kind === 'graphic') {
                if (item.image) {
                    const scale = Math.min((listWidth - 40) / item.image.w, (layout.height - 20) / item.image.h);
                    content.drawImage(item.image.d, item.image.w, item.image.h, 20, py + 10, Math.round(item.image.w * scale), Math.round(item.image.h * scale));
                } else content.text('Graphic: ' + item.name, 20, py + 36, 24, '#8d9aaf');
            } else if (item.kind === 'twocol') {
                const first = this.wrap(content, cells.Text1stCol == null ? '' : cells.Text1stCol, listWidth * 0.68 - 30, 26, 1);
                const second = this.wrap(content, cells.Text2ndCol == null ? '' : cells.Text2ndCol, listWidth * 0.3 - 30, 26, 1);
                content.text(first[0], 20, py + 39, 26, color);
                content.text(second[0], Math.round(listWidth * 0.7), py + 39, 26, color);
            } else {
                (layout.first || []).forEach((line, i) => content.text(line, 20, py + 32 + i * 32, 26, color));
                (layout.second || []).forEach((line, i) => content.text(line, 20, py + 61 + i * 25, 23, item.enabled ? '#bac9dc' : '#7e8a9c'));
            }
        }
        canvas.fillRect(0, 0, 74, height, '#05080d');
        canvas.text('<', 23, 54, 38, '#b6c9dd');
        const title = this.item(name + '_TITLE').rows[0].Text || screen.title || this.spec.title;
        canvas.text(this.wrap(canvas, title, 1180, 32, 1)[0], left + 18, 47, 32, '#edf3fa');
        canvas.text('Native menu preview - approximate layout', left + 18, 76, 18, '#8eacc8');
        canvas.drawImage(content.d, listWidth, listHeight, left, top, listWidth, listHeight);
        if (y > listHeight) {
            canvas.fillRect(1580, top, 5, listHeight, '#273344');
            const thumb = Math.max(24, listHeight * listHeight / y);
            canvas.fillRect(1580, top + offset / (y - listHeight) * (listHeight - thumb), 5, thumb, '#8db8d5');
        }
        canvas.text('Host preview only | ' + this.spec.id + ' / ' + name, left + 18, 698, 18, '#8eacc8');
        return canvas;
    }
}
module.exports = { NativePreview };

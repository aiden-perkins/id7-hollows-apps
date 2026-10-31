'use strict';

// Embedded Node adapter. Go owns the preview timeline, output paths and encoders.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const EventEmitter = require('events');
const readline = require('readline');
const util = require('util');

for (const name of ['log', 'info', 'warn', 'error', 'debug']) {
    console[name] = (...args) => process.stderr.write(util.format(...args) + '\n');
}

function installClock() {
    const NativeDate = Date, epoch = Date.now(), origin = process.hrtime();
    const immediate = setImmediate, timers = new Set();
    let elapsed = 0;
    function PreviewDate(...args) {
        if (!new.target) return new NativeDate(epoch + elapsed).toString();
        return Reflect.construct(NativeDate, args.length ? args : [epoch + elapsed], new.target);
    }
    Object.setPrototypeOf(PreviewDate, NativeDate);
    PreviewDate.prototype = NativeDate.prototype;
    PreviewDate.now = () => Math.floor(epoch + elapsed);
    global.Date = PreviewDate;
    const nanos = () => BigInt(origin[0]) * 1000000000n + BigInt(origin[1]) + BigInt(Math.round(elapsed * 1000000));
    process.hrtime = (previous) => {
        let ns = nanos();
        if (previous) ns -= BigInt(previous[0]) * 1000000000n + BigInt(previous[1]);
        return [Number(ns / 1000000000n), Number(ns % 1000000000n)];
    };
    process.hrtime.bigint = nanos;
    const schedule = (fn, delay, repeat, args) => {
        if (typeof fn !== 'function') throw new TypeError('Timer callback must be a function');
        delay = Math.max(1, Number(delay) || 1);
        const timer = { fn, delay, repeat, args, at: elapsed + delay, ref() { return this; }, unref() { return this; } };
        timers.add(timer);
        return timer;
    };
    global.setTimeout = (fn, delay, ...args) => schedule(fn, delay, false, args);
    global.setInterval = (fn, delay, ...args) => schedule(fn, delay, true, args);
    global.clearTimeout = global.clearInterval = (timer) => { timers.delete(timer); };
    const settle = () => new Promise((resolve) => immediate(resolve));
    const nextTimer = () => {
        let next = null;
        for (const timer of timers) if (!next || timer.at < next.at) next = timer;
        return next;
    };
    async function advance(ms) {
        if (!Number.isFinite(ms) || ms < 0) throw new RangeError('Preview time must be non-negative');
        const target = elapsed + ms;
        let timer;
        while ((timer = nextTimer()) && timer.at <= target) {
            elapsed = timer.at;
            if (timer.repeat) timer.at += timer.delay; else timers.delete(timer);
            timer.fn.apply(timer, timer.args);
            await settle();
        }
        elapsed = target;
        await settle();
    }
    async function run(fn) {
        let done = false, rejected = false, result, error;
        Promise.resolve().then(fn).then(
            (value) => { result = value; done = true; },
            (err) => { error = err; rejected = done = true; }
        );
        while (!done) {
            await settle();
            if (done) break;
            const timer = nextTimer();
            if (!timer) throw new Error('Preview action is pending with no timer to advance');
            await advance(timer.at - elapsed);
        }
        if (rejected) throw error;
        return result;
    }
    return { get now() { return elapsed; }, advance, run };
}

let state = null;
async function initialize(config) {
    if (state) throw new Error('Preview host is already initialized');
    if (config.gpu) {
        process.env.MGU_RENDERD_FILE = config.gpu;
        process.env.MGU_RENDERER = 'auto';
    } else {
        delete process.env.MGU_RENDERD_FILE;
        process.env.MGU_RENDERER = 'software';
    }
    const clock = config.fast ? installClock() : null;
    const invoke = (fn) => clock ? clock.run(fn) : Promise.resolve().then(fn);
    const pause = (ms) => clock ? clock.advance(ms) : new Promise((resolve) => setTimeout(resolve, ms));
    const kitDir = path.join(config.stage, 'source', 'javascript', 'kit');
    const spec = JSON.parse(fs.readFileSync(path.join(kitDir, 'app-spec.json'), 'utf8'));
    if (!spec.screens || !spec.screens.length) throw new Error('App has no screens to preview');
    if (config.gpu && !spec.screens.some((screen) => screen.kind === 'canvas')) {
        throw new Error('Native-menu previews use software rendering; omit --gpu and --record');
    }
    const source = fs.readFileSync(path.join(kitDir, 'mgu.js'), 'utf8').replace(/\r\n/g, '\n');
    const match = source.match(/class Settings[\s\S]*?\n}\n/);
    if (!match) throw new Error('Built runtime does not contain the expected Settings class');
    const unitModule = path.join(kitDir, 'setting_units.js');
    const numberLabel = fs.existsSync(unitModule) ? require(unitModule).numberLabel : undefined;
    const Settings = new Function('fs', 'path', 'DATA_DIR', 'log', 'numberLabel', match[0] + '\nreturn Settings;')(
        fs, path, config.dir, console, numberLabel
    );
    const settings = new Settings(spec.settings);
    settings.values = {};
    for (const item of spec.settings || []) settings.values[item.key] = item.default;
    Object.assign(settings.values, { demo: 'on' }, config.settings);
    if (config.gpu && config.settings.renderer === 'software') {
        throw new Error('GPU capture conflicts with the renderer=software setting');
    }
    const { NativePreview } = require('./preview_native.cjs');
    const native = new NativePreview(spec, kitDir);
    const handlers = {}, components = {};
    const component = (name) => {
        if (!components[name]) {
            const c = new EventEmitter();
            c.getId = () => native.id(name);
            c.setProperty = async (key, value) => native.property(name, key, value);
            c.setValue = async (...args) => native.setValue(name, args);
            c.setRowCount = async (count) => native.count(name, count);
            c.setRowSelected = async (row, checked) => native.checked(name, checked, row);
            c.updateResources = async () => {};
            c.on('focus', (event) => {
                const item = native.items.get(name);
                if (item && item.screen && event && event.value !== false) {
                    const row = Number.isInteger(event.row) ? event.row : 0;
                    if (row >= 0 && row < item.rows.length) native.focus(name, row);
                }
            });
            components[name] = c;
        }
        return components[name];
    };
    let display = null, lastPNG = '', imageIndex = 0, frame = 0, nativePNG = null;
    let shown = spec.screens[0].name;
    const loops = {}, visibleHandlers = [], focusHandlers = [];
    const notify = (name, visible) => {
        component(name).emit('visible', { visible });
        visibleHandlers.forEach((fn) => fn(name, visible));
        focusHandlers.forEach((fn) => fn(name, visible));
    };
    const open = async (name) => {
        if (!native.screen(name)) throw new Error('Unknown screen ' + name);
        if (name === shown) return;
        const previous = shown;
        shown = name;
        notify(previous, false); notify(shown, true);
        console.log('open', name);
    };
    const closeScreen = async (name) => {
        if (name !== shown) return;
        const parent = native.parent(name);
        if (parent) await open(parent);
    };
    fs.mkdirSync(path.join(config.dir, 'captures'), { recursive: true });
    const saveFrame = (drawing) => {
        const data = Buffer.isBuffer(drawing) ? drawing : drawing.png();
        const file = path.join(config.dir, 'captures', String(imageIndex++) + '.png');
        fs.writeFileSync(file, data);
        return file;
    };
    const ui = {
        image: async (name, drawing) => {
            if (native.inline(name)) return native.image(name, drawing);
            return display.present(name, drawing, softImage);
        },
        _image: async (name, drawing) => {
            if (native.inline(name)) return native.image(name, drawing);
            lastPNG = saveFrame(drawing);
        },
        text: async (name, value, row = 0, cell = 'Text') => {
            native.text(name, value, row, cell);
            if (display && row === 0 && cell === 'Text') display.label(name, value);
        },
        cells: async (name, row, values) => native.cells(name, row, values),
        rows: async (name, count) => native.count(name, count),
        visible: async (name, visible) => native.property(name, 'Visible', visible),
        enabled: async (name, enabled) => native.property(name, 'Enabled', enabled),
        checked: async (name, checked, row = 0) => native.checked(name, checked, row),
        selected: async (name, row) => native.selected(name, row),
        onClick: (name, fn) => { handlers[name] = fn; },
        open, close: closeScreen,
        isVisible: (name) => name === shown, onVisible: (fn) => visibleHandlers.push(fn),
        hasFocus: (name) => name === shown, onFocus: (fn) => focusHandlers.push(fn),
        comp: component, rhmi: { getByName: component },
    };
    const softImage = (name, canvas) => ui._image(name, canvas);
    const log = { info: console.info, warn: console.warn, error: console.error, debug: () => {} };
    const theme = () => require(path.join(kitDir, 'themes')).theme(settings.get('theme'));
    const Display = require(path.join(kitDir, 'display')).Display;
    display = new Display(ui, log, spec, settings, theme);
    const send = display._send.bind(display);
    display._send = (name, drawing, image) => send(name, drawing, image, true);
    const gpuFrame = display.gpu ? display.gpu.frame.bind(display.gpu) : null;
    if (gpuFrame) display.gpu.frame = () => true;
    const app = new EventEmitter();
    const unavailable = async () => { throw new Error('Preview has no live vehicle connection'); };
    const ctx = {
        ui, settings, spec, dataDir: config.dir, log, display, preview: true, theme, app,
        canvas: (width, height) => display.canvas(width, height),
        signals: {
            hasNative: () => false,
            watch: async (iface) => ({ iface, available: false, error: 'preview', shutdown: async () => {} }),
            proxy: unavailable, onAvailable: unavailable, on: unavailable, get: unavailable, set: unavailable, call: unavailable,
        },
        controller: { grab(on) { display.grab(on); }, onInput(fn) { display.onCcu = fn; } },
        onTab: (fn) => { display.onTab = fn; },
        onTap: (fn) => { display.onTap = fn; },
        onLayout: (fn) => display.onLayout(fn),
        loop: (name, fps, fn) => { loops[name] = fn; return { stop() {}, kick() {} }; },
    };
    const settingValues = (s) => s.type === 'choice' ? (s.options || []).map((o) => o[0]) : s.type === 'number' ? s.steps || [] : null;
    const refreshSettings = () => {
        for (const s of spec.settings || []) {
            const name = 'SET_' + s.key.toUpperCase(), values = settingValues(s);
            if (s.type === 'bool') { native.text(name, s.label); native.checked(name, !!settings.get(s.key)); }
            else if (values) {
                native.count(name, values.length);
                values.forEach((value, row) => {
                    const label = s.type === 'choice' ? s.options[row][1] : numberLabel ? numberLabel(s, value, (key) => settings.get(key)) :
                        String(value) + (s.unit ? ' ' + s.unit : '') + (s.markDefault && value === s.default ? ' (default)' : '');
                    native.text(name, label, row, 'ItemText');
                });
                native.selected(name, Math.max(0, values.indexOf(settings.get(s.key))));
            } else native.cells(name, 0, { Text1stRow: s.label, Text2ndRow: settings.display(s.key) });
        }
    };
    const settingsMatch = source.match(/function wireSettings\(ctx\) \{[\s\S]*?\n}\n/);
    if (!settingsMatch) throw new Error('Built runtime does not contain the expected settings wiring');
    const wireSettings = new Function('listSheet', 'SPEC', settingsMatch[0] + '\nreturn wireSettings;')(
        require(path.join(kitDir, 'sheet')).listSheet, spec
    );
    await invoke(() => wireSettings(ctx));
    settings.onChange(refreshSettings); refreshSettings();
    const fixture = config.fixture ? require(config.fixture) : null;
    if (fixture && fixture.setup) fixture.setup(ctx);
    let appStarted;
    const realLoad = Module._load;
    Module._load = function (request) {
        if (/kit[\\/]mgu$/.test(request) || request === './kit/mgu') {
            return { run: (impl) => (appStarted = Promise.resolve(impl.start(ctx))), log, SPEC: spec };
        }
        return realLoad.apply(this, arguments);
    };
    require(path.join(config.stage, 'source', 'javascript', 'app.js'));
    if (!appStarted) throw new Error('App did not call mgu.run');
    await invoke(() => appStarted);
    if (fixture && fixture.afterStart) await invoke(() => fixture.afterStart(ctx, components));
    notify(shown, true);
    await pause(1500);
    const target = (value) => {
        const match = /^(.*):(\d+)$/.exec(value);
        const name = match ? match[1] : value, row = match ? Number(match[2]) : 0;
        if (!Number.isSafeInteger(row)) throw new Error('Invalid preview row: ' + value);
        return { name, row };
    };
    state = {
        now: () => clock ? clock.now : Date.now(),
        pause,
        focus: async (value) => {
            const { name, row } = target(value), item = native.items.get(name);
            if (!item || item.screen !== shown) throw new Error('Component is not on the visible screen: ' + name);
            native.focus(name, row);
            await invoke(() => component(name).emit('focus', { row, value: true }));
            await pause(300);
        },
        click: async (value) => {
            if (value === '@back') { await invoke(() => closeScreen(shown)); await pause(300); return; }
            const { name, row } = target(value);
            if (!handlers[name]) {
                throw new Error('Unknown button ' + name + '. Available: ' + Object.keys(handlers).sort().join(', '));
            }
            if (native.items.has(name)) native.press(name, row);
            component(name).emit('focus', { row, value: true });
            component(name).emit('action', { row });
            await invoke(() => handlers[name]({ row }));
            await pause(300);
        },
        draw: async () => {
            const current = native.screen(shown), loopFn = loops[shown];
            if (current.kind === 'canvas') {
                if (!loopFn) throw new Error('Canvas screen ' + shown + ' has no render loop');
                await invoke(loopFn);
                if (gpuFrame) {
                    if (!display.last) throw new Error('App did not draw a frame');
                    gpuFrame(display.last.frame);
                } else if (!lastPNG) throw new Error('App did not produce a PNG frame');
            } else {
                if (config.gpu) throw new Error('Native-menu previews use software rendering; omit --gpu and --record');
                if (loopFn) await invoke(loopFn);
                const key = shown + ':' + native.revision;
                if (!nativePNG || nativePNG.key !== key) nativePNG = { key, png: saveFrame(native.render(shown)) };
                lastPNG = nativePNG.png;
            }
            frame++;
        },
        reply: () => ({ png: lastPNG, frame, now: clock ? clock.now : Date.now() }),
        close: () => {
            const previous = shown; shown = null; notify(previous, false);
            app.emit('shutdown');
            if (display.gpu) display.gpu.close();
        },
    };
    return state.reply();
}

async function handle(request) {
    if (request.op === 'init') return initialize(request);
    if (!state) throw new Error('Preview host is not initialized');
    switch (request.op) {
    case 'wait':
        if (!Number.isFinite(request.ms) || request.ms < 0) throw new Error('Invalid wait duration');
        await state.pause(request.ms); break;
    case 'click': await state.click(request.name); break;
    case 'focus': await state.focus(request.name); break;
    case 'frame': await state.draw(); break;
    case 'close': state.close(); break;
    default: throw new Error('Unknown preview host operation');
    }
    return state.reply();
}

async function main() {
    const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
    for await (const line of input) {
        let request, response;
        try {
            request = JSON.parse(line);
            response = Object.assign({ ok: true }, await handle(request));
        } catch (error) {
            response = { ok: false, error: error && error.stack || String(error) };
        }
        await new Promise((resolve) => process.stdout.write(JSON.stringify(response) + '\n', resolve));
        if (request && request.op === 'close') process.exit(response.ok ? 0 : 1);
    }
    if (state) state.close();
    process.exit(0);
}
main().catch((error) => { console.error(error && error.stack || error); process.exit(1); });


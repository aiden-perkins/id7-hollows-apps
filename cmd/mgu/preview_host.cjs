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
    const handlers = {}, components = {};
    const component = (name) => {
        if (!components[name]) {
            const c = new EventEmitter();
            c.setProperty = c.setValue = c.setRowCount = async () => {};
            components[name] = c;
        }
        return components[name];
    };
    const screen = (spec.screens || []).find((item) => item.kind === 'canvas');
    if (!screen) throw new Error('App has no canvas screen to preview');
    let display = null, lastPNG = '', imageIndex = 0, frame = 0;
    let shown = (spec.screens[0] && spec.screens[0].name) || screen.name;
    const loops = {}, visibleHandlers = [], focusHandlers = [];
    const notify = (name, visible) => {
        component(name).emit('visible', { visible });
        visibleHandlers.forEach((fn) => fn(name, visible));
        focusHandlers.forEach((fn) => fn(name, visible));
    };
    const open = async (name) => {
        if (!(spec.screens || []).some((item) => item.name === name) && !(spec.stateIds && spec.stateIds[name])) throw new Error('Unknown screen ' + name);
        if (name === shown) return;
        const previous = shown;
        shown = name;
        notify(previous, false); notify(shown, true);
        console.log('open', name);
    };
    fs.mkdirSync(path.join(config.dir, 'captures'), { recursive: true });
    const ui = {
        image: (name, canvas) => display.present(name, canvas, softImage),
        _image: async (name, canvas) => {
            const data = Buffer.isBuffer(canvas) ? canvas : canvas.png();
            const file = path.join(config.dir, 'captures', String(imageIndex++) + '.png');
            fs.writeFileSync(file, data);
            lastPNG = file;
        },
        text: async (name, value) => { if (display) display.label(name, value); },
        cells: async (name, rows) => console.log('cells', name, JSON.stringify(rows)),
        rows: async (name, rows) => console.log('rows', name, rows),
        visible: async () => {}, enabled: async () => {}, checked: async () => {},
        onClick: (name, fn) => { handlers[name] = fn; },
        open, close: async (name) => {
            if (name !== shown) return;
            const current = spec.screens.find((item) => item.name === name);
            return open(current && typeof current.parent === 'string' ? current.parent : spec.screens[0].name);
        },
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
    const ctx = {
        ui, settings, spec, dataDir: config.dir, log, display, preview: true, theme,
        canvas: (width, height) => display.canvas(width, height),
        signals: { watch: async (iface) => ({ iface, error: 'preview' }), proxy: async () => { throw new Error('preview'); } },
        controller: { grab(on) { display.grab(on); }, onInput(fn) { display.onCcu = fn; } },
        loop: (name, fps, fn) => { loops[name] = fn; return { stop() {}, kick() {} }; },
    };
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
    state = {
        now: () => clock ? clock.now : Date.now(),
        pause,
        click: async (name) => {
            if (!handlers[name]) {
                throw new Error('Unknown button ' + name + '. Available: ' + Object.keys(handlers).sort().join(', '));
            }
            component(name).emit('action', { row: 0 });
            await invoke(() => handlers[name]({ row: 0 }));
            await pause(300);
        },
        draw: async () => {
            const loopFn = loops[shown];
            if (!loopFn) throw new Error('Screen ' + shown + ' has no render loop; use --click to open a canvas screen');
            await invoke(loopFn);
            if (gpuFrame) {
                if (!display.last) throw new Error('App did not draw a frame');
                gpuFrame(display.last.frame);
            } else if (!lastPNG) throw new Error('App did not produce a PNG frame');
            frame++;
        },
        reply: () => ({ png: lastPNG, frame, now: clock ? clock.now : Date.now() }),
        close: () => { const previous = shown; shown = null; notify(previous, false); if (display.gpu) display.gpu.close(); },
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


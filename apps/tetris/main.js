'use strict';

const crypto = require('crypto');
const mgu = require('./kit/mgu');
const Parked = require('./kit/parked');
const { Game } = require('./game');
const { Storage } = require('./storage');
const { Controls } = require('./controls');
const View = require('./view');

const STEP_MS = 20;
function now() { const time = process.hrtime(); return time[0] * 1000 + time[1] / 1000000; }

mgu.run({
    async start(ctx) {
        const { ui, settings, log } = ctx;
        const storage = new Storage(ctx.dataDir, log), saved = storage.load();
        const parked = Parked.watch(ctx, log);
        let game = saved.game, best = saved.best, going = false, requested = false, stopped = false, captured = false;
        let previous = now(), accumulator = 0, lastSave = now(), gateAt = -Infinity;
        let saveError = false, notice = storage.notice, loop = null, lastRevision = game ? game.revision : -1;
        const labels = {};
        const driving = () => settings.get('parkedOnly') !== false && parked.moving();
        const shown = () => ui.isVisible('GAME') && (!ui.hasFocus || ui.hasFocus('GAME')) && (!ctx.display || !ctx.display.blocked);
        const changed = () => { if (loop) loop.kick(); };
        const label = (name, value) => {
            if (labels[name] !== value) { labels[name] = value; ui.text(name, value); }
        };

        function menu() {
            label('BTN_PLAY', game && !game.over ? 'Continue' : game ? 'Play again' : 'Play');
            const progress = game ? (game.over ? 'Game over' : 'Saved game') + ': ' + game.score + ' points, ' + game.lines + ' lines, level ' + game.level() + '.' : 'Clear rows. Keep the stack below the top.';
            label('MENU_INFO', (driving() ? 'Parked only - choose Play or Continue when parked. ' : '') + progress +
                ' Best: ' + best + '.' + (saveError ? ' Save failed; choose Continue to retry.' : '') + (notice ? ' ' + notice : ''));
            label('BTN_PAUSE', going ? 'Pause / menu' : game && !game.over ? 'Resume' : 'Menu');
        }

        function save() {
            if (!game) return;
            best = Math.max(best, game.score);
            saveError = !storage.save(game, best);
            if (!saveError) lastRevision = game.revision;
            lastSave = now();
            menu(); changed();
        }

        const controls = new Controls(action, (on) => { if (game) game.softDrop = on && going; }, now);

        function pause() {
            requested = false;
            const wasGoing = going;
            going = false; captured = false; accumulator = 0; previous = now();
            controls.enable(false);
            if (ctx.controller) ctx.controller.grab(false);
            if (wasGoing || saveError) save();
            menu(); changed();
        }

        function sync() {
            if (stopped) return;
            if (going && (!shown() || driving() || !game || game.over)) pause();
            if (!going && requested && game && !game.over && shown() && !driving()) {
                going = true; previous = now(); accumulator = 0;
                menu(); changed();
            }
            // Without controller capture, leave knob navigation to the native control bar.
            const capture = !!(going && ctx.controller && ctx.display && ctx.display.active('GAME'));
            if (capture !== captured) {
                captured = capture;
                controls.enable(capture);
                if (ctx.controller) ctx.controller.grab(capture);
            }
        }

        function resume() {
            if (stopped || driving() || !game || game.over) { menu(); changed(); return; }
            notice = '';
            if (saveError) save();
            requested = true;
            if (!ui.isVisible('GAME')) ui.open('GAME').then(sync);
            sync(); changed();
        }

        function newGame() {
            if (stopped) return;
            if (driving()) { menu(); ui.open('MAIN'); return; }
            pause();
            game = new Game(Number(settings.get('startLevel')), crypto.randomBytes(4).readUInt32LE(0));
            notice = ''; best = Math.max(best, game.score);
            save(); resume();
        }

        function newRequest() {
            pause();
            if (driving()) { ui.open('MAIN'); return; }
            if (game && !game.over) ui.open('NEW_GAME');
            else newGame();
        }

        function action(name) {
            sync();
            if (stopped) return;
            if (name === 'menu') { pause(); ui.open('MAIN'); return; }
            if (name === 'resume') { resume(); return; }
            if (name === 'new') { newRequest(); return; }
            if (!going || !game || game.over) return;
            if (name === 'left') game.move(-1);
            else if (name === 'right') game.move(1);
            else if (name === 'rotate') game.rotate(1);
            else if (name === 'ccw') game.rotate(-1);
            else if (name === 'down') { game.down(true); game.fallMs = 0; }
            else if (name === 'drop') game.hardDrop();
            else if (name === 'hold') game.hold();
            best = Math.max(best, game.score);
            if (game.over) pause();
            changed();
        }

        ui.onClick('BTN_PLAY', () => game && !game.over ? resume() : newGame());
        ui.onClick('BTN_NEW', newRequest);
        ui.onClick('BTN_NEW_CONFIRM', newGame);
        ui.onClick('BTN_NEW_CANCEL', () => ui.open('MAIN'));
        ui.onClick('BTN_HELP', () => { pause(); return ui.open('HELP'); });
        ui.onClick('BTN_HELP_BACK', () => ui.open('MAIN'));
        const buttons = {
            BTN_LEFT: 'left', BTN_RIGHT: 'right', BTN_ROTATE: 'rotate', BTN_CCW: 'ccw',
            BTN_DOWN: 'down', BTN_DROP: 'drop', BTN_HOLD: 'hold', BTN_PAUSE: 'menu',
        };
        Object.keys(buttons).forEach((id) => {
            ui.onClick(id, () => {
                if (id === 'BTN_PAUSE' && !going && game && !game.over && !driving()) resume();
                else action(buttons[id]);
            });
            // Native bar controls remain available on renderers without page touch routing.
            if (ctx.hideButton) ctx.hideButton(id);
        });
        if (ctx.onTab) ctx.onTab(() => action('menu'));

        if (ctx.controller && ctx.controller.onInput) ctx.controller.onInput((packet) => {
            gateAt = now(); sync(); controls.raw(packet, 'gate');
        });
        ctx.signals.watch('de.bmw.infotainment.controlelements.FrontCCU', '1', {
            statusRotaryEncoderState: (packet) => {
                if (now() - gateAt > 1000) { sync(); controls.raw(packet, 'signal'); }
            },
        }, log).then((subscription) => {
            if (subscription.error) log.warn('Tetris controller: ' + subscription.error);
        }).catch((error) => log.warn('Tetris controller: ' + error.message));

        if (ui.onVisible) ui.onVisible((name) => {
            if (name === 'GAME') sync();
            if (name === 'MAIN') menu();
        });
        if (ui.onFocus) ui.onFocus((name) => { if (name === 'GAME') sync(); });
        settings.onChange(() => { sync(); menu(); changed(); });
        if (ctx.onLayout) ctx.onLayout(changed);

        // Simulation is independent of drawing, with at most 200 ms of catch-up.
        const timer = setInterval(() => {
            sync();
            const current = now();
            if (!going) { previous = current; return; }
            accumulator += Math.max(0, Math.min(200, current - previous));
            previous = current;
            while (going && accumulator >= STEP_MS) {
                accumulator -= STEP_MS;
                controls.tick(STEP_MS);
                if (going) game.tick(STEP_MS);
                best = Math.max(best, game.score);
                if (game.over) pause();
            }
            if (going && current - lastSave >= 10000 && game.revision !== lastRevision) save();
        }, STEP_MS);
        const menuTimer = setInterval(() => { if (ui.isVisible('MAIN')) menu(); }, 2000);
        loop = ctx.loop('GAME', 12, () => {
            sync();
            const frame = View.draw(ctx.canvas(View.W, View.H), game,
                { going, best, ghost: settings.get('ghost') !== false, driving: driving(), saveError }, action);
            return ui.image('GAME_GFX', frame);
        });

        function shutdown() {
            if (stopped) return;
            stopped = true; requested = false; going = false; captured = false;
            controls.enable(false);
            if (ctx.controller) ctx.controller.grab(false);
            clearInterval(timer); clearInterval(menuTimer);
            if (loop) loop.stop();
            if (game) storage.save(game, Math.max(best, game.score));
        }
        process.on('exit', shutdown);
        process.once('SIGTERM', () => { shutdown(); process.exit(0); });
        process.once('SIGINT', () => { shutdown(); process.exit(0); });
        menu();
        log.info('Tetris app started');
    },
});

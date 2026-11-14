'use strict';

const crypto = require('crypto');
const mgu = require('./kit/mgu');
const Parked = require('./kit/parked');
const { Game, DIRECTIONS } = require('./game');
const { Storage } = require('./storage');
const { Controls } = require('./controls');
const View = require('./view');

const STEP_MS = 20, READY_MS = 1000;
function now() { const time = process.hrtime(); return time[0] * 1000 + time[1] / 1000000; }

mgu.run({
    async start(ctx) {
        const { ui, settings, log } = ctx;
        const storage = new Storage(ctx.dataDir, log), saved = storage.load();
        const parked = Parked.watch(ctx, log);
        let game = saved.game, best = saved.best, going = false, requested = false, stopped = false, captured = false;
        let previous = now(), accumulator = 0, readyMs = 0, lastSave = now(), gateAt = -Infinity;
        let saveError = false, notice = storage.notice, loop = null;
        let lastRevision = game ? game.revision : -1, savedScore = game ? game.score : 0;
        const labels = {};
        const driving = () => settings.get('parkedOnly') !== false && parked.moving();
        const shown = () => ui.isVisible('GAME') && (!ui.hasFocus || ui.hasFocus('GAME')) && (!ctx.display || !ctx.display.blocked);
        const changed = () => { if (loop) loop.kick(); };
        const label = (name, value) => {
            if (labels[name] !== value) { labels[name] = value; ui.text(name, value); }
        };

        function menu() {
            label('BTN_PLAY', game && !game.over ? 'Continue' : game ? 'Play again' : 'Play');
            const progress = game ? (game.won ? 'Board cleared' : game.over ? 'Game over' : 'Saved game') + ': ' +
                game.score + ' points, length ' + game.body.length + ', level ' + game.level() + '.' : 'Eat food, grow, and avoid your body.';
            label('MENU_INFO', (driving() ? 'Parked only - choose Play or Continue when parked. ' : '') + progress +
                ' Best: ' + best + '.' + (saveError ? ' Save failed; progress is still in memory.' : '') + (notice ? ' ' + notice : ''));
            label('BTN_PAUSE', going ? 'Pause / menu' : game && !game.over ? 'Resume' : 'Menu');
        }

        function save() {
            if (!game) return;
            best = Math.max(best, game.score);
            saveError = !storage.save(game, best);
            if (!saveError) { lastRevision = game.revision; savedScore = game.score; }
            lastSave = now();
            menu(); changed();
        }

        const controls = new Controls(action);

        function pause() {
            requested = false;
            const wasGoing = going;
            going = false; captured = false; readyMs = 0; accumulator = 0; previous = now();
            controls.enable(false);
            if (ctx.controller) ctx.controller.grab(false);
            if (wasGoing || saveError) save();
            menu(); changed();
        }

        function sync() {
            if (stopped) return;
            if (going && (!shown() || driving() || !game || game.over)) pause();
            if (!going && requested && game && !game.over && shown() && !driving()) {
                going = true; previous = now(); accumulator = 0; readyMs = READY_MS;
                menu(); changed();
            }
            // Native bar navigation remains available without renderer/controller capture.
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
            game = new Game(settings.get('difficulty'), settings.get('edges'), crypto.randomBytes(4).readUInt32LE(0));
            notice = '';
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
            if (DIRECTIONS.indexOf(name) >= 0) game.turn(name);
            else if (name === 'turnLeft') game.turnRelative(-1);
            else if (name === 'turnRight') game.turnRelative(1);
            changed();
        }

        ui.onClick('BTN_PLAY', () => game && !game.over ? resume() : newGame());
        ui.onClick('BTN_NEW', newRequest);
        ui.onClick('BTN_NEW_CONFIRM', newGame);
        ui.onClick('BTN_NEW_CANCEL', () => ui.open('MAIN'));
        ui.onClick('BTN_HELP', () => { pause(); return ui.open('HELP'); });
        ui.onClick('BTN_HELP_BACK', () => ui.open('MAIN'));
        const buttons = { BTN_UP: 'up', BTN_LEFT: 'left', BTN_DOWN: 'down', BTN_RIGHT: 'right', BTN_PAUSE: 'menu' };
        Object.keys(buttons).forEach((id) => {
            ui.onClick(id, () => {
                if (id === 'BTN_PAUSE' && !going && game && !game.over && !driving()) resume();
                else action(buttons[id]);
            });
            // Draw touch targets on the page; retain native buttons on other rendering paths.
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
            if (subscription.error) log.warn('Snake controller: ' + subscription.error);
        }).catch((error) => log.warn('Snake controller: ' + error.message));

        if (ui.onVisible) ui.onVisible((name) => {
            if (name === 'GAME') sync();
            if (name === 'MAIN') menu();
        });
        if (ui.onFocus) ui.onFocus((name) => { if (name === 'GAME') sync(); });
        settings.onChange(() => { sync(); menu(); changed(); });
        if (ctx.onLayout) ctx.onLayout(changed);

        // Simulation has fixed steps and at most 100 ms of catch-up after a stall.
        const timer = setInterval(() => {
            sync();
            const current = now();
            if (!going) { previous = current; return; }
            accumulator += Math.max(0, Math.min(100, current - previous));
            previous = current;
            while (going && accumulator >= STEP_MS) {
                accumulator -= STEP_MS;
                if (readyMs > 0) readyMs = Math.max(0, readyMs - STEP_MS);
                else game.tick(STEP_MS);
                best = Math.max(best, game.score);
                if (game.over) pause();
            }
            if (going && game.revision !== lastRevision &&
                (current - lastSave >= 5000 || game.score > savedScore && current - lastSave >= 1000)) save();
        }, STEP_MS);
        const menuTimer = setInterval(() => { if (ui.isVisible('MAIN')) menu(); }, 2000);
        loop = ctx.loop('GAME', 12, () => {
            sync();
            const frame = View.draw(ctx.canvas(View.W, View.H), game,
                { going, best, grid: settings.get('grid') !== false, driving: driving(), saveError, ready: readyMs > 0 }, action);
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
        log.info('Snake app started');
    },
});

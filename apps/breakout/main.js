'use strict';

const crypto = require('crypto');
const mgu = require('./kit/mgu');
const Parked = require('./kit/parked');
const { Game, DIFFICULTIES, LEVELS } = require('./game');
const { Storage } = require('./storage');
const { Controls } = require('./controls');
const View = require('./view');

const STEP_MS = 10, READY_MS = 1000;
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
        const labels = {}, enabled = {};
        const driving = () => settings.get('parkedOnly') !== false && parked.moving();
        const shown = () => ui.isVisible('GAME') && (!ui.hasFocus || ui.hasFocus('GAME')) && (!ctx.display || !ctx.display.blocked);
        const changed = () => { if (loop) loop.kick(); };
        const label = (name, value) => {
            if (labels[name] !== value) { labels[name] = value; ui.text(name, value); }
        };
        const enable = (name, value) => {
            value = !!value;
            if (enabled[name] !== value) { enabled[name] = value; ui.enabled(name, value); }
        };

        function menu() {
            label('BTN_PLAY', game ? game.over ? 'View result' : 'Continue' : 'Play');
            const progress = game ? DIFFICULTIES[game.difficulty].title + ' / level ' + game.level + ' of ' + LEVELS.length + ': ' +
                game.score + ' points, ' + game.lives + ' lives, ' + game.remaining() + ' bricks left. ' +
                (game.over ? game.won ? 'All levels cleared.' : 'Game over.' : game.phase === 'cleared' ? 'Next level ready.' :
                    game.phase === 'launch' ? 'Ready to launch.' : 'Ball saved.') : 'Break the bricks and keep the ball above your paddle.';
            label('MENU_INFO', (driving() ? 'Parked only - choose Play or Continue when parked. ' : '') + progress +
                ' Best: ' + best + '.' + (saveError ? ' Save failed; progress is still in memory.' : '') + (notice ? ' ' + notice : ''));
            label('BTN_LAUNCH', game && game.phase === 'cleared' ? 'Next level' : 'Launch');
            label('BTN_PAUSE', going ? 'Pause / menu' : game ? 'Resume' : 'Menu');
            const playing = going && game && !game.over && !driving();
            enable('BTN_LEFT', playing); enable('BTN_RIGHT', playing);
            enable('BTN_LAUNCH', playing && (game.phase === 'launch' || game.phase === 'cleared'));
        }

        function save() {
            if (!game) return;
            best = Math.max(best, game.score);
            saveError = !storage.save(game, best);
            if (!saveError) { lastRevision = game.revision; savedScore = game.score; }
            lastSave = now();
            menu(); changed();
        }

        const controls = new Controls(action, () => settings.get('sensitivity'), now);

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
            if (going && (!shown() || driving() || !game)) pause();
            if (!going && requested && game && shown() && !driving()) {
                going = true; previous = now(); accumulator = 0;
                readyMs = game.phase === 'playing' ? READY_MS : 0;
                menu(); changed();
            }
            const capture = !!(going && game && !game.over && ctx.controller && ctx.display && ctx.display.active('GAME'));
            if (capture !== captured) {
                captured = capture;
                controls.enable(capture);
                if (ctx.controller) ctx.controller.grab(capture);
            }
        }

        function resume() {
            if (stopped || driving() || !game) { menu(); changed(); return; }
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
            game = new Game(settings.get('difficulty'), crypto.randomBytes(4).readUInt32LE(0));
            notice = '';
            save(); resume();
        }

        function newRequest() {
            pause();
            if (driving()) { ui.open('MAIN'); return; }
            if (game && !game.over) ui.open('NEW_GAME');
            else newGame();
        }

        function action(name, value) {
            sync();
            if (stopped) return;
            if (name === 'menu') { pause(); ui.open('MAIN'); return; }
            if (name === 'resume') { resume(); return; }
            if (name === 'new') { newRequest(); return; }
            if (!going || !shown() || driving() || !game || game.over) return;
            if (name === 'left') game.nudge(-64);
            else if (name === 'right') game.nudge(64);
            else if (name === 'nudge' && Number.isFinite(value)) game.nudge(value);
            else if (name === 'position' && Number.isFinite(value)) game.setPaddle(value);
            else if (name === 'launch' && game.launch()) { readyMs = 0; save(); }
            changed();
        }

        ui.onClick('BTN_PLAY', () => game ? resume() : newGame());
        ui.onClick('BTN_NEW', newRequest);
        ui.onClick('BTN_NEW_CONFIRM', newGame);
        ui.onClick('BTN_NEW_CANCEL', () => ui.open('MAIN'));
        ui.onClick('BTN_HELP', () => { pause(); return ui.open('HELP'); });
        ui.onClick('BTN_HELP_BACK', () => ui.open('MAIN'));
        const buttons = { BTN_LEFT: 'left', BTN_RIGHT: 'right', BTN_LAUNCH: 'launch', BTN_RESTART: 'new', BTN_PAUSE: 'menu' };
        Object.keys(buttons).forEach((id) => {
            ui.onClick(id, () => {
                if (id === 'BTN_PAUSE' && !going && game && !driving()) resume();
                else action(buttons[id]);
            });
            // Retain native controls on renderers without page touch routing.
            if (ctx.hideButton) ctx.hideButton(id);
        });
        if (ctx.onTab) ctx.onTab(() => action('menu'));
        if (ctx.onTap) ctx.onTap((x, y) => {
            const position = View.paddleAt(x, y);
            if (position !== null) action('position', position);
        });

        if (ctx.controller && ctx.controller.onInput) ctx.controller.onInput((packet) => {
            gateAt = now(); sync(); controls.raw(packet, 'gate');
        });
        ctx.signals.watch('de.bmw.infotainment.controlelements.FrontCCU', '1', {
            statusRotaryEncoderState: (packet) => {
                if (now() - gateAt > 1000) { sync(); controls.raw(packet, 'signal'); }
            },
        }, log).then((subscription) => {
            if (subscription.error) log.warn('Breakout controller: ' + subscription.error);
        }).catch((error) => log.warn('Breakout controller: ' + error.message));

        if (ui.onVisible) ui.onVisible((name) => {
            if (name === 'GAME') sync();
            if (name === 'MAIN') menu();
        });
        if (ui.onFocus) ui.onFocus((name) => { if (name === 'GAME') sync(); });
        settings.onChange(() => { sync(); menu(); changed(); });
        if (ctx.onLayout) ctx.onLayout(changed);

        // Fixed simulation steps and bounded catch-up keep pause time out of gameplay.
        const timer = setInterval(() => {
            sync();
            const current = now();
            if (!going || !game || game.over) {
                previous = current; accumulator = 0;
                if (going && game && saveError && current - lastSave >= 5000) save();
                return;
            }
            accumulator += Math.max(0, Math.min(100, current - previous));
            previous = current;
            let checkpoint = false;
            while (going && !game.over && accumulator >= STEP_MS) {
                accumulator -= STEP_MS;
                controls.tick(STEP_MS);
                if (!going) break;
                const phase = game.phase, ready = readyMs > 0;
                game.tick(STEP_MS, ready);
                if (ready) readyMs = Math.max(0, readyMs - STEP_MS);
                best = Math.max(best, game.score);
                if (phase !== game.phase) { checkpoint = true; readyMs = 0; accumulator = 0; break; }
            }
            if (checkpoint) { save(); sync(); changed(); }
            else if ((game.revision !== lastRevision || saveError) &&
                (current - lastSave >= 5000 || game.score !== savedScore && current - lastSave >= 1000)) save();
        }, STEP_MS);
        const menuTimer = setInterval(() => { if (ui.isVisible('MAIN')) menu(); }, 2000);
        loop = ctx.loop('GAME', 20, () => {
            sync();
            return ui.image('GAME_GFX', View.draw(ctx.canvas(View.W, View.H), game,
                { going, best, driving: driving(), saveError, ready: readyMs > 0 }, action));
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
        log.info('Breakout app started');
    },
});

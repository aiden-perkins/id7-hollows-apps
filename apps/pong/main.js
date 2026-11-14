'use strict';

const crypto = require('crypto');
const mgu = require('./kit/mgu');
const Parked = require('./kit/parked');
const { Game, DIFFICULTIES } = require('./game');
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
        let saveError = false, notice = storage.notice, loop = null, lastRevision = game ? game.revision : -1;
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
            label('BTN_PLAY', game ? game.over ? 'View match' : 'Continue' : 'Play');
            const progress = game ? DIFFICULTIES[game.difficulty].title + ' / first to ' + game.goal + ': ' +
                game.playerScore + ' - ' + game.cpuScore + '. ' + (game.over ? game.winner === 'player' ? 'You won.' : 'CPU won.' :
                    game.phase === 'serve' ? 'Ready to serve.' : 'Rally saved.') : 'Move the left paddle and score against the computer.';
            label('MENU_INFO', (driving() ? 'Parked only - choose Play or Continue when parked. ' : '') + progress +
                ' Best rally: ' + best + '.' + (saveError ? ' Save failed; progress is still in memory.' : '') + (notice ? ' ' + notice : ''));
            label('BTN_PAUSE', going ? 'Pause / menu' : game ? 'Resume' : 'Menu');
            const playing = going && game && !game.over && !driving();
            enable('BTN_UP', playing); enable('BTN_DOWN', playing);
            enable('BTN_SERVE', playing && game.phase === 'serve');
        }

        function save() {
            if (!game) return;
            best = Math.max(best, game.longest);
            saveError = !storage.save(game, best);
            if (!saveError) lastRevision = game.revision;
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
            game = new Game(settings.get('difficulty'), Number(settings.get('goal')), crypto.randomBytes(4).readUInt32LE(0));
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
            if (name === 'up') game.nudge(-48);
            else if (name === 'down') game.nudge(48);
            else if (name === 'nudge' && Number.isFinite(value)) game.nudge(value);
            else if (name === 'position' && Number.isFinite(value)) game.setPlayer(value);
            else if (name === 'serve' && game.serve()) { readyMs = 0; save(); }
            changed();
        }

        ui.onClick('BTN_PLAY', () => game ? resume() : newGame());
        ui.onClick('BTN_NEW', newRequest);
        ui.onClick('BTN_NEW_CONFIRM', newGame);
        ui.onClick('BTN_NEW_CANCEL', () => ui.open('MAIN'));
        ui.onClick('BTN_HELP', () => { pause(); return ui.open('HELP'); });
        ui.onClick('BTN_HELP_BACK', () => ui.open('MAIN'));
        const buttons = { BTN_UP: 'up', BTN_DOWN: 'down', BTN_SERVE: 'serve', BTN_RESTART: 'new', BTN_PAUSE: 'menu' };
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
            const height = View.paddleAt(x, y);
            if (height !== null) action('position', height);
        });

        if (ctx.controller && ctx.controller.onInput) ctx.controller.onInput((packet) => {
            gateAt = now(); sync(); controls.raw(packet, 'gate');
        });
        ctx.signals.watch('de.bmw.infotainment.controlelements.FrontCCU', '1', {
            statusRotaryEncoderState: (packet) => {
                if (now() - gateAt > 1000) { sync(); controls.raw(packet, 'signal'); }
            },
        }, log).then((subscription) => {
            if (subscription.error) log.warn('Pong controller: ' + subscription.error);
        }).catch((error) => log.warn('Pong controller: ' + error.message));

        if (ui.onVisible) ui.onVisible((name) => {
            if (name === 'GAME') sync();
            if (name === 'MAIN') menu();
        });
        if (ui.onFocus) ui.onFocus((name) => { if (name === 'GAME') sync(); });
        settings.onChange(() => { sync(); menu(); changed(); });
        if (ctx.onLayout) ctx.onLayout(changed);

        // Fixed simulation steps are independent of drawing, with at most 100 ms of catch-up.
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
            let point = false;
            while (going && !game.over && accumulator >= STEP_MS) {
                accumulator -= STEP_MS;
                controls.tick(STEP_MS);
                if (!going) break;
                const score = game.playerScore + game.cpuScore, ready = readyMs > 0;
                game.tick(STEP_MS, ready);
                if (ready) readyMs = Math.max(0, readyMs - STEP_MS);
                best = Math.max(best, game.longest);
                if (score !== game.playerScore + game.cpuScore) {
                    point = true; readyMs = 0; accumulator = 0; break;
                }
            }
            if (point) { save(); sync(); changed(); }
            else if ((game.revision !== lastRevision || saveError) && current - lastSave >= 5000) save();
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
            if (game) storage.save(game, Math.max(best, game.longest));
        }
        process.on('exit', shutdown);
        process.once('SIGTERM', () => { shutdown(); process.exit(0); });
        process.once('SIGINT', () => { shutdown(); process.exit(0); });
        menu();
        log.info('Pong app started');
    },
});

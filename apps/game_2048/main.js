'use strict';

const crypto = require('crypto');
const mgu = require('./kit/mgu');
const Parked = require('./kit/parked');
const { Game, DIRECTIONS } = require('./game');
const { Storage } = require('./storage');
const { Controls } = require('./controls');
const View = require('./view');

const SLIDE_MS = 180;
function now() { const time = process.hrtime(); return time[0] * 1000 + time[1] / 1000000; }

mgu.run({
    async start(ctx) {
        const { ui, settings, log } = ctx;
        const storage = new Storage(ctx.dataDir, log), saved = storage.load();
        const parked = Parked.watch(ctx, log);
        let game = saved.game, best = saved.best, going = false, requested = false, stopped = false, captured = false;
        let animation = null, queued = null, gain = 0, gainUntil = 0, gateAt = -Infinity, lastSave = now();
        let saveError = false, notice = storage.notice, loop = null;
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
            label('BTN_PLAY', game ? game.over ? 'View board' : game.waiting() ? 'View 2048 tile' : 'Continue' : 'Play');
            const progress = game ? (game.waiting() ? '2048 reached' : game.over ? 'Game over' : 'Saved game') + ': ' +
                game.score + ' points, ' + game.moves + ' moves, top tile ' + game.highest() + '.' : 'Slide and merge equal tiles to reach 2048.';
            label('MENU_INFO', (driving() ? 'Parked only - choose Play or Continue when parked. ' : '') + progress +
                ' Best: ' + best + '.' + (saveError ? ' Save failed; progress is still in memory.' : '') + (notice ? ' ' + notice : ''));
            label('BTN_PAUSE', going ? 'Pause / menu' : 'Resume');
            enable('BTN_UNDO', game && game.undoState && !driving());
            enable('BTN_CONTINUE', going && game && game.waiting() && !game.over && !driving());
            ['BTN_UP', 'BTN_LEFT', 'BTN_DOWN', 'BTN_RIGHT'].forEach((id) => enable(id, going && game && game.canPlay() && !driving()));
        }

        function save() {
            if (!game) return;
            best = Math.max(best, game.score);
            saveError = !storage.save(game, best);
            lastSave = now();
            menu(); changed();
        }

        const controls = new Controls(action, changed);

        function pause() {
            requested = false;
            const wasGoing = going;
            going = false; captured = false; animation = null; queued = null; gain = 0;
            controls.enable(false);
            if (ctx.controller) ctx.controller.grab(false);
            if (wasGoing || saveError) save();
            menu(); changed();
        }

        function sync() {
            if (stopped) return;
            if (going && (!shown() || driving() || !game)) pause();
            if (!going && requested && game && shown() && !driving()) {
                going = true;
                menu(); changed();
            }
            // Win/game-over screens use the kit's normal focus navigation for their actions.
            const capture = !!(going && game && game.canPlay() && ctx.controller && ctx.display && ctx.display.active('GAME'));
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
            game = new Game(crypto.randomBytes(4).readUInt32LE(0));
            notice = ''; controls.select('left');
            save(); resume();
        }

        function newRequest() {
            pause();
            if (driving()) { ui.open('MAIN'); return; }
            if (game && !game.over) ui.open('NEW_GAME');
            else newGame();
        }

        function move(heading) {
            if (!going || !game || !game.canPlay()) return;
            controls.select(heading);
            if (animation) {
                if (!queued) queued = heading;
                return;
            }
            if (!game.move(heading)) return;
            gain = game.lastMove.gained; gainUntil = now() + 1200;
            if (settings.get('animations') !== false) animation = { at: now(), move: game.lastMove };
            if (!game.canPlay()) queued = null;
            // Persist committed rules state now; animation is a separate, disposable presentation.
            save(); sync(); changed();
        }

        function action(name) {
            sync();
            if (stopped) return;
            if (name === 'menu') { pause(); ui.open('MAIN'); return; }
            if (name === 'resume') { resume(); return; }
            if (name === 'new') { newRequest(); return; }
            if (!shown() || driving() || !game) return;
            if (name === 'undo') {
                animation = null; queued = null; gain = 0;
                if (game.undo()) { save(); sync(); }
                changed(); return;
            }
            if (name === 'continue') {
                if (going && game.keepPlaying()) { animation = null; queued = null; save(); sync(); changed(); }
                return;
            }
            if (DIRECTIONS.indexOf(name) >= 0) move(name);
        }

        ui.onClick('BTN_PLAY', () => game ? resume() : newGame());
        ui.onClick('BTN_NEW', newRequest);
        ui.onClick('BTN_NEW_CONFIRM', newGame);
        ui.onClick('BTN_NEW_CANCEL', () => ui.open('MAIN'));
        ui.onClick('BTN_HELP', () => { pause(); return ui.open('HELP'); });
        ui.onClick('BTN_HELP_BACK', () => ui.open('MAIN'));
        const buttons = {
            BTN_UP: 'up', BTN_LEFT: 'left', BTN_DOWN: 'down', BTN_RIGHT: 'right',
            BTN_UNDO: 'undo', BTN_CONTINUE: 'continue', BTN_RESTART: 'new', BTN_PAUSE: 'menu',
        };
        Object.keys(buttons).forEach((id) => {
            ui.onClick(id, () => {
                if (id === 'BTN_PAUSE' && !going && game && !driving()) resume();
                else action(buttons[id]);
            });
            // Page touch targets replace these only on renderers that support them.
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
            if (subscription.error) log.warn('2048 controller: ' + subscription.error);
        }).catch((error) => log.warn('2048 controller: ' + error.message));

        if (ui.onVisible) ui.onVisible((name) => {
            if (name === 'GAME') sync();
            if (name === 'MAIN') menu();
        });
        if (ui.onFocus) ui.onFocus((name) => { if (name === 'GAME') sync(); });
        settings.onChange((key) => {
            if (key === 'animations' && settings.get(key) === false) { animation = null; queued = null; }
            sync(); menu(); changed();
        });
        if (ctx.onLayout) ctx.onLayout(changed);

        const timer = setInterval(() => {
            sync();
            const current = now();
            if (animation && current - animation.at >= SLIDE_MS) {
                animation = null;
                const next = queued; queued = null;
                if (next && going && game && game.canPlay()) move(next);
                changed();
            }
            if (gain && current >= gainUntil) { gain = 0; changed(); }
            if (going && saveError && current - lastSave >= 5000) save();
        }, 50);
        const menuTimer = setInterval(() => { if (ui.isVisible('MAIN')) menu(); }, 2000);
        loop = ctx.loop('GAME', 12, () => {
            sync();
            const frame = View.draw(ctx.canvas(View.W, View.H), game, {
                going, best, driving: driving(), saveError, selected: controls.selected, gain,
                animation: animation ? { move: animation.move, progress: Math.max(0, Math.min(1, (now() - animation.at) / SLIDE_MS)) } : null,
            }, action);
            return ui.image('GAME_GFX', frame);
        });

        function shutdown() {
            if (stopped) return;
            stopped = true; requested = false; going = false; captured = false; animation = null; queued = null;
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
        log.info('2048 app started');
    },
});

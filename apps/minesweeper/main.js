'use strict';

const crypto = require('crypto');
const mgu = require('./kit/mgu');
const Parked = require('./kit/parked');
const { Game, PRESETS, DIRECTIONS, MODE_NAMES } = require('./game');
const { Storage } = require('./storage');
const { Controls } = require('./controls');
const View = require('./view');

function now() { const time = process.hrtime(); return time[0] * 1000 + time[1] / 1000000; }

mgu.run({
    async start(ctx) {
        const { ui, settings, log } = ctx;
        const storage = new Storage(ctx.dataDir, log), saved = storage.load();
        const parked = Parked.watch(ctx, log), records = saved.records;
        let game = saved.game, going = false, requested = false, stopped = false, captured = false;
        let clockAt = now(), clockCarry = 0, lastSave = now(), lastEdit = now(), gateAt = -Infinity;
        let dirty = false, saveError = false, recovery = storage.notice, message = '', messageUntil = 0, loop = null;
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
        const tell = (value) => { message = value; messageUntil = now() + 5000; changed(); };

        function advanceClock(at) {
            if (going && game && game.started && !game.over) {
                const elapsed = Math.max(0, at - clockAt) + clockCarry, whole = Math.floor(elapsed);
                clockCarry = elapsed - whole;
                game.advance(whole);
            } else clockCarry = 0;
            clockAt = at;
        }

        function recordWin() {
            if (!game || !game.won || game.recorded) return false;
            const entry = records[game.difficulty];
            entry.wins = Math.min(Number.MAX_SAFE_INTEGER, entry.wins + 1);
            entry.bestMs = entry.bestMs === null ? game.elapsedMs : Math.min(entry.bestMs, game.elapsedMs);
            game.recorded = true; game.revision++;
            return true;
        }

        function menu() {
            label('BTN_PLAY', game ? game.over ? 'View board' : 'Continue' : 'Play');
            const key = game ? game.difficulty : Object.prototype.hasOwnProperty.call(PRESETS, settings.get('difficulty')) ? settings.get('difficulty') : 'beginner';
            const entry = records[key];
            const progress = game ? PRESETS[key].title + ' / ' + (game.won ? 'Cleared' : game.over ? 'Mine hit' : game.started ? 'In progress' : 'Ready') +
                ': ' + game.cleared + '/' + game.safeTotal() + ' safe cells, ' + View.duration(game.elapsedMs) + '.' : 'Reveal safe cells and flag suspected mines.';
            label('MENU_INFO', (driving() ? 'Parked only - choose Play or Continue when parked. ' : '') + progress +
                ' Wins: ' + entry.wins + '. Best: ' + (entry.bestMs === null ? '--' : View.duration(entry.bestMs)) + '.' +
                (saveError ? ' Save failed; progress is still in memory.' : '') + (recovery ? ' ' + recovery : ''));
            label('BTN_MODE', 'Mode: ' + MODE_NAMES[game ? game.mode : 'reveal']);
            label('BTN_FLAG', game && game.flagged[game.cursor] ? 'Unflag' : 'Flag');
            label('BTN_PAUSE', going ? 'Pause / menu' : game ? 'Resume' : 'Menu');
            const playing = going && game && !game.over && !driving();
            ['BTN_UP', 'BTN_LEFT', 'BTN_DOWN', 'BTN_RIGHT', 'BTN_MODE'].forEach((id) => enable(id, playing));
            enable('BTN_REVEAL', playing && !game.revealed[game.cursor] && !game.flagged[game.cursor]);
            enable('BTN_FLAG', playing && !game.revealed[game.cursor] && (game.flagged[game.cursor] || game.flags() < game.mineCount));
            enable('BTN_CHORD', playing && game.canChord(game.cursor));
        }

        function save() {
            if (!game) return;
            advanceClock(now()); recordWin();
            saveError = !storage.save(game, records);
            if (!saveError) dirty = false;
            lastSave = now();
            menu(); changed();
        }

        const controls = new Controls(action, now);

        function pause() {
            advanceClock(now());
            requested = false;
            const wasGoing = going;
            going = false; captured = false; clockCarry = 0; message = '';
            controls.enable(false);
            if (ctx.controller) ctx.controller.grab(false);
            if (wasGoing || dirty || saveError) save();
            menu(); changed();
        }

        function sync() {
            if (stopped) return;
            if (going && (!shown() || driving() || !game)) pause();
            if (!going && requested && game && shown() && !driving()) {
                going = true; clockAt = now(); clockCarry = 0;
                menu(); changed();
            }
            // Finished boards use normal focus navigation for New game and Menu.
            const capture = !!(going && game && !game.over && ctx.controller && ctx.display && ctx.display.active('GAME'));
            if (capture !== captured) {
                captured = capture;
                controls.enable(capture);
                if (ctx.controller) ctx.controller.grab(capture);
            }
        }

        function resume() {
            if (stopped || driving() || !game) { menu(); changed(); return; }
            recovery = '';
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
            recovery = ''; dirty = true;
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
            advanceClock(now());
            if (DIRECTIONS.indexOf(name) >= 0) {
                if (game.move(name)) { dirty = true; lastEdit = now(); message = ''; menu(); changed(); }
                return;
            }
            if (name === 'mode') {
                if (game.cycleMode(Number.isInteger(value) ? value : 1)) { message = ''; dirty = true; save(); }
                return;
            }
            if (name === 'cell') {
                if (!Number.isInteger(value) || value < 0 || value >= game.size) return;
                if (game.select(value)) dirty = true;
                name = 'activate';
            }
            const operation = name === 'activate' ? game.mode : name;
            let applied = false;
            if (operation === 'reveal') applied = game.reveal(game.cursor);
            else if (operation === 'flag') applied = game.flag(game.cursor);
            else if (operation === 'chord') applied = game.chord(game.cursor);
            else return;
            if (applied) { dirty = true; message = ''; save(); sync(); }
            else {
                if (operation === 'reveal') tell(game.flagged[game.cursor] ? 'Unflag this cell before revealing it' : 'This cell is already open');
                else if (operation === 'flag') tell(game.revealed[game.cursor] ? 'Open cells cannot be flagged' : 'All flags are in use; remove one first');
                else tell(!game.revealed[game.cursor] || !game.counts[game.cursor] ? 'Select a revealed number for Open around' :
                    game.neighbors(game.cursor).some((id) => !game.revealed[id] && !game.flagged[id]) ? 'Neighboring flags must match the number' : 'All unflagged neighbors are already open');
                if (dirty) { lastEdit = now(); menu(); }
            }
            changed();
        }

        ui.onClick('BTN_PLAY', () => game ? resume() : newGame());
        ui.onClick('BTN_NEW', newRequest);
        ui.onClick('BTN_NEW_CONFIRM', newGame);
        ui.onClick('BTN_NEW_CANCEL', () => ui.open('MAIN'));
        ui.onClick('BTN_HELP', () => { pause(); return ui.open('HELP'); });
        ui.onClick('BTN_HELP_BACK', () => ui.open('MAIN'));
        const buttons = {
            BTN_UP: 'up', BTN_LEFT: 'left', BTN_DOWN: 'down', BTN_RIGHT: 'right',
            BTN_REVEAL: 'reveal', BTN_FLAG: 'flag', BTN_MODE: 'mode', BTN_CHORD: 'chord', BTN_RESTART: 'new', BTN_PAUSE: 'menu',
        };
        Object.keys(buttons).forEach((id) => {
            ui.onClick(id, () => {
                if (id === 'BTN_PAUSE' && !going && game && !driving()) resume();
                else action(buttons[id]);
            });
            // Native bar controls remain available without page touch routing.
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
            if (subscription.error) log.warn('Minesweeper controller: ' + subscription.error);
        }).catch((error) => log.warn('Minesweeper controller: ' + error.message));

        if (ui.onVisible) ui.onVisible((name) => {
            if (name === 'GAME') sync();
            if (name === 'MAIN') menu();
        });
        if (ui.onFocus) ui.onFocus((name) => { if (name === 'GAME') sync(); });
        settings.onChange(() => { sync(); menu(); changed(); });
        if (ctx.onLayout) ctx.onLayout(changed);

        const timer = setInterval(() => {
            sync(); advanceClock(now()); controls.tick();
            const current = now();
            if (dirty && current - lastEdit >= 800 && (!saveError || current - lastSave >= 5000) ||
                going && game && (game.started && !game.over || saveError) && current - lastSave >= 5000) save();
            if (message && current >= messageUntil) { message = ''; changed(); }
        }, 50);
        const menuTimer = setInterval(() => { if (ui.isVisible('MAIN')) menu(); }, 2000);
        loop = ctx.loop('GAME', 10, () => {
            sync();
            return ui.image('GAME_GFX', View.draw(ctx.canvas(View.W, View.H), game,
                { going, records, driving: driving(), saveError, message }, action));
        });

        function shutdown() {
            if (stopped) return;
            advanceClock(now()); recordWin();
            stopped = true; requested = false; going = false; captured = false;
            controls.enable(false);
            if (ctx.controller) ctx.controller.grab(false);
            clearInterval(timer); clearInterval(menuTimer);
            if (loop) loop.stop();
            if (game) storage.save(game, records);
        }
        process.on('exit', shutdown);
        process.once('SIGTERM', () => { shutdown(); process.exit(0); });
        process.once('SIGINT', () => { shutdown(); process.exit(0); });
        if (recordWin()) save();
        menu();
        log.info('Minesweeper app started');
    },
});

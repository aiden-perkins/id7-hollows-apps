'use strict';

const fs = require('fs');
const path = require('path');
const { Game } = require('./game');

class Storage {
    constructor(directory, log) {
        this.file = path.join(directory, 'pong-save.json');
        this.log = log; this.primaryValid = false; this.notice = '';
    }

    load() {
        let found = false;
        for (const file of [this.file, this.file + '.bak']) {
            try {
                const stat = fs.statSync(file);
                found = true;
                if (stat.size > 65536) throw new Error('Save file is too large');
                const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
                if (!saved || saved.version !== 1 || !Number.isSafeInteger(saved.best) || saved.best < 0) throw new Error('Unsupported save');
                const game = saved.game === null ? null : Game.restore(saved.game);
                if (saved.game !== null && !game) throw new Error('Invalid saved match');
                this.primaryValid = file === this.file;
                if (!this.primaryValid) this.notice = 'Recovered the previous save.';
                return { best: Math.max(saved.best, game ? game.longest : 0), game };
            } catch (error) {
                if (error.code !== 'ENOENT') this.log.warn('Pong save: ' + error.message);
            }
        }
        if (found) this.notice = 'Saved progress could not be loaded. Start a new match.';
        return { best: 0, game: null };
    }

    save(game, best) {
        const temporary = this.file + '.' + process.pid + '.tmp';
        try {
            fs.writeFileSync(temporary, JSON.stringify({ version: 1, best, game: game ? game.snapshot() : null }));
            // Preserve the previous valid checkpoint without replacing a recovered backup with corrupt data.
            if (this.primaryValid) fs.copyFileSync(this.file, this.file + '.bak');
            fs.renameSync(temporary, this.file);
            this.primaryValid = true;
            return true;
        } catch (error) {
            this.log.warn('Pong save failed: ' + error.message);
            try { fs.unlinkSync(temporary); } catch (ignored) { /* no temporary file */ }
            return false;
        }
    }
}

module.exports = { Storage };

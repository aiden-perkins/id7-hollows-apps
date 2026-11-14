'use strict';

const fs = require('fs');
const path = require('path');
const { Game, PRESETS } = require('./game');

function freshRecords() {
    const records = {};
    Object.keys(PRESETS).forEach((key) => { records[key] = { wins: 0, bestMs: null }; });
    return records;
}

function readRecords(saved) {
    if (!saved || typeof saved !== 'object') return null;
    const records = freshRecords();
    for (const key of Object.keys(PRESETS)) {
        const entry = saved[key];
        if (!entry || !Number.isSafeInteger(entry.wins) || entry.wins < 0 ||
            (entry.wins === 0 ? entry.bestMs !== null : !Number.isSafeInteger(entry.bestMs) || entry.bestMs < 0)) return null;
        records[key] = { wins: entry.wins, bestMs: entry.bestMs };
    }
    return records;
}

class Storage {
    constructor(directory, log) {
        this.file = path.join(directory, 'minesweeper-save.json');
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
                if (!saved || saved.version !== 1) throw new Error('Unsupported save');
                const records = readRecords(saved.records);
                const game = saved.game === null ? null : Game.restore(saved.game);
                if (!records || saved.game !== null && !game) throw new Error('Invalid saved game');
                if (game && game.recorded && (!records[game.difficulty].wins || records[game.difficulty].bestMs > game.elapsedMs)) throw new Error('Invalid completion record');
                this.primaryValid = file === this.file;
                if (!this.primaryValid) this.notice = 'Recovered the previous save.';
                return { records, game };
            } catch (error) {
                if (error.code !== 'ENOENT') this.log.warn('Minesweeper save: ' + error.message);
            }
        }
        if (found) this.notice = 'Saved progress could not be loaded. Start a new game.';
        return { records: freshRecords(), game: null };
    }

    save(game, records) {
        const temporary = this.file + '.' + process.pid + '.tmp';
        try {
            fs.writeFileSync(temporary, JSON.stringify({ version: 1, records, game: game ? game.snapshot() : null }));
            // Save the board and completion records together; retain the previous valid checkpoint.
            if (this.primaryValid) fs.copyFileSync(this.file, this.file + '.bak');
            fs.renameSync(temporary, this.file);
            this.primaryValid = true;
            return true;
        } catch (error) {
            this.log.warn('Minesweeper save failed: ' + error.message);
            try { fs.unlinkSync(temporary); } catch (ignored) { /* no temporary file */ }
            return false;
        }
    }
}

module.exports = { Storage };

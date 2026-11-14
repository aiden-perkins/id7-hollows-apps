'use strict';

const COLS = 31, ROWS = 17, COUNT = COLS * ROWS, TUNNEL_ROW = 8;
const DIRECTIONS = ['up', 'right', 'down', 'left'];
const DELTAS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const OPPOSITE = { up: 'down', right: 'left', down: 'up', left: 'right' };
const START = 15 * COLS + 15;
const HOMES = [13, 14, 16, 17].map((x) => TUNNEL_ROW * COLS + x);
const CORNERS = [1 * COLS + 29, 1 * COLS + 1, 15 * COLS + 29, 15 * COLS + 1];
const point = (id) => ({ x: id % COLS, y: Math.floor(id / COLS) });

class Maze {
    constructor(variant) {
        this.title = ['Crossroads', 'Switchbacks', 'Arcades'][variant];
        this.walls = Array(COUNT).fill(1);
        const gaps = [[3, 5, 11, 13], [1, 5, 9, 13], [3, 7, 11, 13]][variant];
        // Each horizontal section reaches an outside vertical corridor; the middle tunnel
        // connects both sides. Every carved floor cell therefore remains reachable.
        for (let y = 1; y < ROWS - 1; y += 2) for (let x = 1; x < COLS - 1; x++) {
            if (x !== 15 || gaps.indexOf(y) < 0) this.walls[y * COLS + x] = 0;
        }
        for (let y = 1; y < ROWS - 1; y++) {
            this.walls[y * COLS + 1] = 0; this.walls[y * COLS + COLS - 2] = 0;
        }
        for (let y = 2; y < ROWS - 1; y += 2) {
            const alternate = (y / 2 + variant) % 2;
            const columns = variant === 2 ? alternate ? [3, 9, 21, 27] : [5, 13, 17, 25] :
                alternate ? [5, 11, 19, 25] : [7, 13, 17, 23];
            columns.forEach((x) => { this.walls[y * COLS + x] = 0; });
        }
        for (let x = 0; x < COLS; x++) this.walls[TUNNEL_ROW * COLS + x] = 0;
        this.floor = [];
        this.walls.forEach((wall, id) => { if (!wall) this.floor.push(id); });
        this.links = this.walls.map((wall, id) => {
            const links = {}, p = point(id);
            DIRECTIONS.forEach((heading) => {
                const d = DELTAS[heading]; let x = p.x + d[0]; const y = p.y + d[1];
                if (y === TUNNEL_ROW && x < 0) x = COLS - 1;
                else if (y === TUNNEL_ROW && x >= COLS) x = 0;
                const next = y * COLS + x;
                links[heading] = !wall && x >= 0 && x < COLS && y >= 0 && y < ROWS && !this.walls[next] ? next : -1;
            });
            return links;
        });
        this.initial = this.walls.map((wall) => wall ? 0 : 1);
        [START].concat(HOMES).forEach((id) => { this.initial[id] = 0; });
        CORNERS.forEach((id) => { this.initial[id] = 2; });
    }

    passable(id) { return Number.isInteger(id) && id >= 0 && id < COUNT && !this.walls[id]; }
    next(id, heading) { return this.passable(id) && DIRECTIONS.indexOf(heading) >= 0 ? this.links[id][heading] : -1; }

    distances(target) {
        const distances = new Int16Array(COUNT); distances.fill(-1);
        if (!this.passable(target)) return distances;
        const queue = [target]; distances[target] = 0;
        for (let i = 0; i < queue.length; i++) {
            const id = queue[i];
            DIRECTIONS.forEach((heading) => {
                const next = this.next(id, heading);
                if (next >= 0 && distances[next] < 0) { distances[next] = distances[id] + 1; queue.push(next); }
            });
        }
        return distances;
    }

    nearest(x, y) {
        let best = this.floor[0], distance = Infinity;
        this.floor.forEach((id) => {
            const p = point(id), candidate = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
            if (candidate < distance) { distance = candidate; best = id; }
        });
        return best;
    }
}

const MAZES = [0, 1, 2].map((variant) => new Maze(variant));

module.exports = { MAZES, COLS, ROWS, COUNT, TUNNEL_ROW, DIRECTIONS, DELTAS, OPPOSITE, START, HOMES, CORNERS, point };

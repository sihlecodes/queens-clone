class QueenCollection {
    constructor() {
        this.clear();
    }

    clear() {
        this.colors = [];
        this.columns = [];
        this.rows = [];
    }

    includes(x, y, color) {
        return this.colors.includes(color) ||
            this.columns.includes(x) ||
            this.rows.includes(y);
    }

    length() {
        return this.colors.length;
    }

    push(x, y, color) {
        this.colors.push(color);
        this.columns.push(x);
        this.rows.push(y);
    }

};

export const Marks = {
    NONE: 0,
    BASIC: 1,
    QUEEN: 2,
};

const old_default_grid =  [
    [2, 2, 2, 11, 11, 11, 11, 11, 11, 11, 11],
    [1, 1, 2, 11, 11, 11, 11, 11, 11, 11, 11],
    [2, 2, 2, 11, 11, 11, 11, 11, 11, 11, 11],
    [2, 11, 11, 11, 10, 10, 10, 11, 6, 6, 11],
    [2, 2, 2, 11, 10, 3, 10, 11, 11, 6, 11],
    [5, 5, 5, 11, 10, 3, 10, 6, 6, 6, 11],
    [5, 11, 11, 11, 10, 3, 10, 6, 9, 9, 9],
    [5, 11, 4, 4, 10, 10, 10, 6, 9, 7, 9],
    [5, 11, 4, 11, 8, 8, 6, 6, 9, 7, 9],
    [5, 11, 4, 11, 11, 8, 8, 6, 9, 7, 9],
    [11, 11, 11, 11, 11, 8, 6, 6, 9, 9, 9],
];

const default_grid  = [
    [11, 11, 11, 11, 11, 11, 11, 11, 11],
    [11, 11, 11, 11, 4, 11, 11, 11, 11],
    [11, 4, 4, 4, 4, 4, 2, 2, 11],
    [11, 11, 8, 8, 4, 2, 2, 11, 11],
    [6, 11, 11, 8, 4, 2, 11, 11, 5],
    [6, 6, 11, 11, 4, 11, 11, 5, 5],
    [3, 6, 6, 11, 11, 11, 7, 1, 5],
    [3, 3, 6, 6, 11, 7, 7, 1, 5],
    [3, 6, 6, 6, 6, 6, 1, 1, 1],
];

export const TILE_SIZE = 48;

export class Board {
    constructor(grid=default_grid) {
        this._marks_grid = [];
        this.grid = grid;

        this.initialize();
    }

    initialize() {
        this._marks = [];

        for (let y = 0; y < this.rows(); y++) {
            this._marks_grid.push([]);

            for (let x = 0; x < this.columns(); x++) {
                this._marks_grid[y].push(Marks.NONE);
            }
        } 
    }
    
    iterate(callback) {
        outer: for (let y = 0; y < this.rows(); y++) {
            for (let x = 0; x < this.columns(); x++) {
                let terminate = callback.bind(this)(x, y, this.get_color(x, y), this.get_mark(x, y));

                if (terminate)
                    break outer;
            }
        }
    }

    check_completion() {
        let queens = new QueenCollection();

        this.iterate(function(x, y, color, mark) {
            if (mark == Marks.QUEEN) {
                if (queens.includes(x, y, color)) {
                    console.log("invalid");
                    return true;
                }

                else {
                    queens.push(x, y, color);

                    if (queens.length() === this.columns()) {
                        console.log("you win");
                        return true;
                    }
                }
            }
        });
    }

    static to_relative_position(globalX, globalY) {
        return {
            x: Math.floor((globalX - 5) / TILE_SIZE),
            y: Math.floor((globalY - 5) / TILE_SIZE),
        };
    }

    static to_global_position(relativeX, relativeY) {
        return {
            x: 5 + relativeX * TILE_SIZE,
            y: 5 + relativeY * TILE_SIZE,
        };
    }

    cycle_mark(x, y) {
        if (!this.within_bounds(x, y))
            return 

        let mark = this._marks_grid[y][x];

        if (!mark)
            mark = 1;
        else {
            const marks = Object.keys(Marks).length;
            mark = (mark << 1) % (1 << (marks - 1));
        }

        this.set_mark(x, y, mark);
    }

    set_mark(x, y, mark) {
        if (this.within_bounds(x, y)) {
            this._marks_grid[y][x] = mark;

            if (mark == Marks.QUEEN) {
                this.check_completion();
            }
        }
    }

    get_mark(x, y) {
        if (!this.within_bounds(x, y))
            return Marks.NONE;

        return this._marks_grid[y][x];
    }

    width() {
        return this.columns() * TILE_SIZE;
    }

    height() {
        return this.rows() * TILE_SIZE;
    }

    get_color(x, y) {
        if (!this.within_bounds(x, y))
            return -1

        return this.grid[y][x];
    }

    rows() {
        return this.grid.length;
    }

    columns() {
        return this.grid[0].length;
    }

    within_bounds(x, y) {
        return x >= 0 && x < this.columns() && y >= 0 && y < this.rows();
    }
}
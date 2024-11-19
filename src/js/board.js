let queens = {
    colors: [],
    columns: [],
    rows: [],

    clear: function () {
        this.colors = [];
        this.columns = [];
        this.rows = [];
    },

    includes: function (x, y, color) {
        return this.colors.includes(color) ||
            this.columns.includes(x) ||
            this.rows.includes(y);
    },

    length: function() {
        return this.colors.length;
    },

    push: function (x, y, color) {
        this.colors.push(color);
        this.columns.push(x);
        this.rows.push(y);
    },

};

export const board = {
    _grid: [
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
    ],

    _marks_grid: [],

    marks: {
        NONE: 0,
        BASIC: 1,
        QUEEN: 2,
    },

    TILE_SIZE: 48,

    init: function() {
        this._marks = [];

        for (let y = 0; y < this.rows(); y++) {
            this._marks_grid.push([]);

            for (let x = 0; x < this.columns(); x++) {
                this._marks_grid[y].push(this.marks.NONE);
            }
        } 
    },
    
    iterate: function(callback) {
        outer: for (let y = 0; y < board.rows(); y++) {
            for (let x = 0; x < board.columns(); x++) {
                let terminate = callback.bind(this)(x, y, this.get_color(x, y), this.get_mark(x, y));

                if (terminate)
                    break outer;
            }
        }
    },

    check_completion: function() {
        queens.clear();

        this.iterate(function(x, y, color, mark) {
            if (mark == this.marks.QUEEN) {
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
    },

    to_relative_int: function(x, y) {
        return x + y * this.columns();
    },

    to_relative_position: function(globalX, globalY) {
        return {
            x: Math.floor((globalX - 5) / this.TILE_SIZE),
            y: Math.floor((globalY - 5) / this.TILE_SIZE),
        };
    },

    to_global_position: function(relativeX, relativeY) {
        return {
            x: 5 + relativeX * this.TILE_SIZE,
            y: 5 + relativeY * this.TILE_SIZE,
        };
    },

    cycle_mark: function(x, y) {
        if (!this.within_bounds(x, y))
            return 

        let mark = this._marks_grid[y][x];

        if (!mark)
            mark = 1;
        else {
            const marks = Object.keys(this.marks).length;
            mark = (mark << 1) % (1 << (marks - 1));
        }

        this.set_mark(x, y, mark);
    },

    set_mark: function(x, y, mark) {
        if (this.within_bounds(x, y)) {
            this._marks_grid[y][x] = mark;

            if (mark == this.marks.QUEEN) {
                this.check_completion();
            }
        }
    },

    get_mark: function(x, y) {
        if (!this.within_bounds(x, y))
            return this.marks.NONE;

        return this._marks_grid[y][x];
    },

    width: function() {
        return this.columns() * TILE_SIZE;
    },

    height: function() {
        return this.rows() * TILE_SIZE;
    },

    get_color: function(x, y) {
        if (!this.within_bounds(x, y))
            return -1

        return this._grid[y][x];
    },

    rows: function() {
        return this._grid.length;
    },

    columns: function() {
        return this._grid[0].length;
    },

    within_bounds: function(x, y) {
        return x >= 0 && x < this.columns() && y >= 0 && y < this.rows();
    }
}
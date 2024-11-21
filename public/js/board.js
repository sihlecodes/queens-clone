import { QueensValidator } from "./validator.js";

export const Marks = {
    NONE: 0,
    BASIC: 1,
    QUEEN: 2,
};


export const TILE_SIZE = 48;

export class Board {
    constructor(layout) {
        this.queens = new QueensValidator();
        this.layout = layout;
        this._marks_grid = [];
        this.initialize_marks_grid();

        this.handlers = {
            on_invalid_queens: undefined,
            on_valid_queens: undefined,
            on_remove_queen: undefined,
        };

        this.queens.handlers.on_valid_queens = (num_queens) => {
            this.handlers.on_valid_queens?.(num_queens);
        };

        this.queens.handlers.on_remove_queen = () => {
            this.handlers.on_remove_queen?.();
        };

        this.queens.handlers.on_invalid_proximity = (coords) => {
            const cells = coords.map(({x, y}) => this.to_relative_int(x, y));
            this.handlers.on_invalid_queens?.(cells);
        }

        this.queens.handlers.on_invalid_color = (x, y) => {
            this.handlers.on_invalid_queens?.(this.get_cells_by_color(x, y));
        };

        this.queens.handlers.on_invalid_column = (column) => {
            this.handlers.on_invalid_queens?.(this.get_cells_by_column(column));
        };

        this.queens.handlers.on_invalid_row = (row) => {
            this.handlers.on_invalid_queens?.(this.get_cells_by_row(row));
        };
    }

    initialize_marks_grid() {
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

    get_cells_by_column(x) {
        const column = new Set();

        for (let y = 0; y < this.rows(); y++)
            column.add(this.to_relative_int(x, y));

        return column;
    }

    get_cells_by_row(y) {
        const row = new Set();

        for (let x = 0; x < this.columns(); x++)
            row.add(this.to_relative_int(x, y));

        return row;
    }

    get_cells_by_color(x, y) {
        const visited = new Set();
        const color = this.get_color(x, y);

        this._get_cells_by_color(x, y, color, visited);

        return visited;
    }

    _get_cells_by_color(x, y, color, visited) {
        if (!this.within_bounds(x, y))
            return;

        const index = this.to_relative_int(x, y);
        const current_color = this.get_color(x, y);

        if (visited.has(index) || current_color !== color)
            return

        visited.add(index);

        this._get_cells_by_color(x+1, y, color, visited);
        this._get_cells_by_color(x-1, y, color, visited);
        this._get_cells_by_color(x, y+1, color, visited);
        this._get_cells_by_color(x, y-1, color, visited);
    }

    to_relative_int(x, y) {
        return x + y * this.columns();
    }

    from_relative_int(v) {
        return {
            x: v % this.columns(),
            y: Math.floor(v / this.columns()),
        }
    }

    static to_relative_position(global_x, global_y) {
        return {
            x: Math.floor((global_x - 5) / TILE_SIZE),
            y: Math.floor((global_y - 5) / TILE_SIZE),
        };
    }

    static to_global_position(relative_x, relative_y) {
        return {
            x: 5 + relative_x * TILE_SIZE,
            y: 5 + relative_y * TILE_SIZE,
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
        if (!this.within_bounds(x, y))
            return;

        const current_mark = this.get_mark(x, y);
        const color = this.get_color(x, y);

        if (mark === Marks.QUEEN) {
            this.queens.push_and_validate(x, y, color);
        }
        else if (mark === Marks.NONE && current_mark === Marks.QUEEN) {
            this.queens.remove_and_revalidate(x, y, color);
        }

        this._marks_grid[y][x] = mark;
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

        return this.layout[y][x];
    }

    rows() {
        return this.layout.length;
    }

    columns() {
        return this.layout[0].length;
    }

    within_bounds(x, y) {
        return x >= 0 && x < this.columns() && y >= 0 && y < this.rows();
    }
}
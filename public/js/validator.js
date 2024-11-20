import { QueenCollection } from "./collections.js";

export class QueensValidator {
    constructor(board) {
        this.board = board;
        this._queens = new QueenCollection();
        this.handlers = {
            on_invalid_surrounding: null,
            on_invalid_color: null,
            on_invalid_column: null,
            on_invalid_row: null,
            on_validity_check: null,
        };
    }

    batch_check_validity() {
        this.handlers.on_validity_check?.();

        for (let i = 0; i < this._queens.length(); i++) {
            const {column, row, color} = this._queens.at(i);

            this.check_validity(this._queens.slice(i+1), column, row, color);
        }
    }

    check_surrounding_cells(queens, x, y) {
        const coords = [{x, y}];

        for (let i = 0; i < queens.length(); i++) {
            const {column, row} = queens.at(i);

            let distance_x = Math.abs(column - x);
            let distance_y = Math.abs(row - y);

            if ((distance_x | distance_y) === 1) {
                coords.push({x: column, y: row});
            }
        }

        if (coords.length > 1)
            this.handlers.on_invalid_surrounding?.(coords);
    }

    check_validity(queens, x, y, color) {
        this.check_surrounding_cells(queens, x, y);

        if (queens.includes_color(color))
            this.handlers.on_invalid_color?.(x, y);

        if (queens.includes_column(x))
            this.handlers.on_invalid_column?.(x);

        if (queens.includes_row(y))
            this.handlers.on_invalid_row?.(y);
    }

    remove_and_ceck_validity(x, y, color) {
        this._queens.remove(x, y, color);
        this.batch_check_validity();
    }

    push_and_check_validity(x, y, color) {
        this.check_validity(this._queens, x, y, color);
        this._queens.push(x, y, color);
    }
}
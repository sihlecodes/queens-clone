import { QueenCollection } from "./collections.js";

export class QueensValidator {
    constructor() {
        this._queens = new QueenCollection();

        this.handlers = {
            on_invalid_proximity: undefined,
            on_invalid_color: undefined,
            on_invalid_column: undefined,
            on_invalid_row: undefined,
            on_remove_queen: undefined,
            on_valid_queens: undefined,
        };
    }

    revalidate() {
        let is_valid = false;

        for (let i = 0; i < this._queens.length(); i++) {
            const {column, row, color} = this._queens.at(i);

            is_valid |= this.validate(this._queens.slice(i+1), column, row, color);
        }

        return is_valid;
    }

    get_nearby_queen_positions(queens, x, y) {
        const coords = [{x, y}];

        for (let i = 0; i < queens.length(); i++) {
            const {column, row} = queens.at(i);

            let distance_x = Math.abs(column - x);
            let distance_y = Math.abs(row - y);

            if ((distance_x | distance_y) === 1) {
                coords.push({x: column, y: row});
            }
        }

        return coords;
    }

    validate(queens, x, y, color) {
        const queen_positions = this.get_nearby_queen_positions(queens, x, y);

        let surrounded = queen_positions.length > 1;
        const includes_color = queens.includes_color(color);
        const includes_column = queens.includes_column(x);
        const includes_row = queens.includes_row(y);
        const is_valid = !(surrounded | includes_color | includes_column | includes_row);

        if (surrounded)
            this.handlers.on_invalid_proximity?.(queen_positions);

        if (includes_color)
            this.handlers.on_invalid_color?.(x, y);

        if (includes_column)
            this.handlers.on_invalid_column?.(x);

        if (includes_row)
            this.handlers.on_invalid_row?.(y);

        return is_valid;
    }

    remove_and_revalidate(x, y, color) {
        this.handlers.on_remove_queen?.();
        this._queens.remove(x, y, color);

        if(this.revalidate())
            this.handlers.on_valid_queens?.(this._queens.length());
    }

    push_and_validate(x, y, color) {
        const is_valid = this.validate(this._queens, x, y, color);

        this._queens.push(x, y, color);

        if (is_valid)
            this.handlers.on_valid_queens?.(this._queens.length());
    }
}
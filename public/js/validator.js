import { QueenCollection } from "./collections.js";

export class QueensValidator {
    constructor() {
        this.queens = new QueenCollection();
        this.is_valid = true;

        this.handlers = {
            on_invalid_proximity: undefined,
            on_invalid_color: undefined,
            on_invalid_column: undefined,
            on_invalid_row: undefined,
            on_remove_queen: undefined,
            on_valid_queens: undefined,
        };
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

    revalidate() {
        let is_valid = true;

        for (let i = 0; i < this.queens.length(); i++) {
            const {column, row, color} = this.queens.at(i);

            is_valid &= this.validate(this.queens.slice(i+1), column, row, color);
        }

        return is_valid;
    }

    validate(queens, x, y, color) {
        const queen_positions = this.get_nearby_queen_positions(queens, x, y);

        const surrounded = queen_positions.length > 1;
        const includes_color = queens.includes_color(color);
        const includes_column = queens.includes_column(x);
        const includes_row = queens.includes_row(y);
        const is_valid = !(surrounded || includes_color || includes_column || includes_row);

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
        this.queens.remove(x, y, color);

        this.is_valid = this.revalidate();

        if (this.is_valid)
            this.handlers.on_valid_queens?.(this.queens.length());
    }

    push_and_validate(x, y, color) {
        this.is_valid &= this.validate(this.queens, x, y, color);
        this.queens.push(x, y, color);

        if (this.is_valid)
            this.handlers.on_valid_queens?.(this.queens.length());
    }
}
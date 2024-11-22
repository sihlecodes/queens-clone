export class QueenCollection {
    constructor(colors = [], columns = [], rows = []) {
        this.colors = colors;
        this.columns = columns;
        this.rows = rows;
    }

    clear() {
        this.colors = [];
        this.columns = [];
        this.rows = [];
    }

    at(index) {
        return {
            color: this.colors[index],
            column: this.columns[index],
            row: this.rows[index],
        }
    }

    slice(start, end) {
        end ??= this.length();

        const colors = this.colors.slice(start, end);
        const columns = this.columns.slice(start, end);
        const rows = this.rows.slice(start, end);

        return new QueenCollection(colors, columns, rows);
    }

    includes_color(color) {
        return this.colors.includes(color);
    }

    includes_column(column) {
        return this.columns.includes(column);
    }

    includes_row(row) {
        return this.rows.includes(row);
    }

    length() {
        return this.colors.length;
    }

    remove(x, y, color) {
        for (let i = 0; i < this.length(); i++)
        {
            if (color === this.colors[i] &&
                x === this.columns[i] &&
                y === this.rows[i])
                    this.remove_at(i);
        }
    }

    remove_at(index) {
        this.colors.splice(index, 1);
        this.columns.splice(index, 1);
        this.rows.splice(index, 1);
    }

    push(x, y, color) {
        this.colors.push(color);
        this.columns.push(x);
        this.rows.push(y);
    }
}
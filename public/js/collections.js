export class QueenCollection {
    constructor(colors = [], columns = [], rows = []) {
        this._colors = colors;
        this._columns = columns;
        this._rows = rows;
    }

    clear() {
        this._colors = [];
        this._columns = [];
        this._rows = [];
    }

    at(index) {
        return {
            color: this._colors[index],
            column: this._columns[index],
            row: this._rows[index],
        }
    }

    slice(start, end) {
        end ??= this.length();

        const colors = this._colors.slice(start, end);
        const columns = this._columns.slice(start, end);
        const rows = this._rows.slice(start, end);

        return new QueenCollection(colors, columns, rows);
    }

    includes_color(color) {
        return this._colors.includes(color);
    }

    includes_column(column) {
        return this._columns.includes(column);
    }

    includes_row(row) {
        return this._rows.includes(row);
    }

    length() {
        return this._colors.length;
    }

    remove(x, y, color) {
        for (let i = 0; i < this.length(); i++)
        {
            if (color === this._colors[i] &&
                x === this._columns[i] &&
                y === this._rows[i])
                    this._remove_at(i);
        }
    }

    _remove_at(index) {
        this._colors.splice(index, 1);
        this._columns.splice(index, 1);
        this._rows.splice(index, 1);
    }

    push(x, y, color) {
        this._colors.push(color);
        this._columns.push(x);
        this._rows.push(y);
    }
}
import { LayeredSVGToCanvasContext } from './adapters.js';
import { Marks } from './board.js';
import { Global } from './game.js';

// as a rather useful side effect
// this also dictates drawing order of layers
const Layers = {
    BOARD: 'board',
   ERRORS: 'errors',
 OUTLINES: 'outlines',
    MARKS: 'marks',
    HOVER: 'hover',
};

function add_line(ctx, start_x, start_y, end_x, end_y) {
    ctx.moveTo(start_x, start_y);
    ctx.lineTo(end_x, end_y);
}

export class Renderer {
    constructor(canvas, board) {
        this.canvas = new LayeredSVGToCanvasContext(canvas);

        // create layers upfront (sets the draw order)
        for (const layer of Object.values(Layers))
            this.canvas.layer(layer);

        this.color_map = Global.theme.color_map;
        this.board = board;

        this.clear_meta_invalid();
        this.styles = Global.theme;
    }

    clear_meta_invalid() {
        this.invalid_marks = [];
        this.invalid_queens = [];
    }

    clear() {
        this.clear_meta_invalid();
        this.canvas.layer(Layers.MARKS).clearRect(0, 0, this.board.width, this.board.height);
        this.canvas.layer(Layers.ERRORS).clearRect(0, 0, this.board.width, this.board.height);
    }

    animate_completion() {
        const marks_ctx = this.canvas.layer(Layers.MARKS);
        let index = 0;

        for (const mark of marks_ctx.get_children()) {
            if (mark.type !== Marks.QUEEN)
                continue;

            const x = mark.getAttribute('x') * 1;
            const y = mark.getAttribute('y') * 1;

            const width = mark.getAttribute('width') * 1;
            const height = mark.getAttribute('height') * 1;

            const centerX = x + width / 2;
            const centerY = y + height / 2;

            mark.style.setProperty('--center-x', `${centerX}px`);
            mark.style.setProperty('--center-y', `${centerY}px`);

            setTimeout(() => mark.classList.add('animate'), 150 * index);
            index++;
        }
    }

    render_mouse_position(x, y) {
        const TILE_SIZE = this.board.get_tile_size();

        if (!this.board.within_bounds(x, y))
            return;

        const global = this.board.to_global_position(x, y);
        const ctx = this.canvas.layer(Layers.HOVER);

        ctx.fillStyle = Global.theme.hover.color;
        ctx.fillRect(global.x, global.y, TILE_SIZE, TILE_SIZE);
    }

    clear_mouse_position() {
        const ctx = this.canvas.layer(Layers.HOVER);
        ctx.clearRect(0, 0, this.board.width, this.board.height);
    }

    render_invalid_cells(cells) {
        const TILE_SIZE = this.board.get_tile_size();
        const { invalid } = this.styles;

        const ctx = this.canvas.layer(Layers.ERRORS);
        const marks_ctx = this.canvas.layer(Layers.MARKS);

        for (const cell of cells) {
            const relative = this.board.from_relative_int(cell);
            const global = this.board.to_global_position(relative.x, relative.y);

            ctx.filter = invalid.mark.filter;
            ctx.fillStyle = invalid.mark.pattern;

            const mark = this.board.get_mark(relative.x, relative.y);

            if (mark === Marks.QUEEN) {
                const queen = marks_ctx.extract(global.x, global.y, TILE_SIZE, TILE_SIZE);

                if (queen) {
                    queen.setAttribute('filter', invalid.queen.filter);
                    this.invalid_queens.push(queen);
                }
            }

            if (!this.invalid_marks.includes(cell)) {
                ctx.fillRect(global.x, global.y, TILE_SIZE, TILE_SIZE);
                this.invalid_marks.push(cell);
            }
        }
    }

    clear_invalid_cells() {
        this.canvas.layer(Layers.ERRORS).clearRect(0, 0, this.board.width, this.board.height);

        for (const queen of this.invalid_queens)
            queen.setAttribute('filter', 'none');

        this.clear_meta_invalid();
    }

    render_mark(x, y) {
        const TILE_SIZE = this.board.get_tile_size();
        const { board } = this;

        const ctx = this.canvas.layer(Layers.MARKS);
        const mark = board.get_mark(x, y);
        const pos = board.to_global_position(x, y);

        let width, height;

        switch (mark) {
            case Marks.NONE:
                ctx.clearRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
                return;

            case Marks.BASIC:
                width = TILE_SIZE * .15;
                height = width;

                const left_x = pos.x + (TILE_SIZE - width) / 2;
                const top_y = pos.y + (TILE_SIZE - height) / 2;
                const bottom_y = top_y + height;
                const right_x = left_x + width;

                ctx.beginPath();
                ctx.lineWidth = 1;

                add_line(ctx, left_x, top_y, right_x, bottom_y);
                add_line(ctx, right_x, top_y, left_x, bottom_y);

                const annotation = ctx.stroke();
                annotation.type = Marks.BASIC;
                break;

            case Marks.QUEEN:
                ctx.clearRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);

                width = TILE_SIZE * .4;
                height = width;

                const x = pos.x + (TILE_SIZE - width) / 2;
                const y = pos.y + (TILE_SIZE - height) / 2;

                const queen = ctx.drawImageFromSource(
                    './images/Queen.svg', x, y, width, height);

                queen.type = Marks.QUEEN;
                break;
        }
    }

    render_board() {
        const { board } = this;
        const { outer, inner } = this.styles.outlines;
        const TILE_SIZE = this.board.get_tile_size();

        let ctx = this.canvas.layer(Layers.BOARD);
        let outlines = this.canvas.layer(Layers.OUTLINES);

        ctx.strokeStyle = inner.separator.color;
        ctx.lineWidth = inner.separator.width;

        outlines.strokeStyle = inner.border.color;
        outlines.lineWidth = inner.border.width;

        board.iterate((x, y, color) => {
            const pos = board.to_global_position(x, y);
            ctx.rect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);

            // draw individual board tiles
            ctx.fillStyle = this.styles.color_map[color];
            ctx.stroke();

            // draw borders between color regions
            let next_color = board.get_color(x + 1, y);

            if (next_color >= 0 && color !== next_color)
                add_line(outlines,
                    pos.x + TILE_SIZE, pos.y,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);

            next_color = board.get_color(x, y + 1);

            if (next_color >= 0 && color !== next_color)
                add_line(outlines,
                    pos.x, pos.y + TILE_SIZE,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);
        });

        outlines.stroke();

        let start = board.to_global_position(0, 0);
        let end = board.to_global_position(board.columns(), board.rows());

        // draw outer border
        outlines.beginPath();
        outlines.strokeStyle = outer.border.color;
        outlines.lineWidth = outer.border.width;

        add_line(outlines, start.x, start.y, end.x, start.y);
        add_line(outlines, end.x, start.y, end.x, end.y);
        add_line(outlines, end.x, end.y, start.x, end.y);
        add_line(outlines, start.x, end.y, start.x, start.y);

        outlines.stroke();
    }
}

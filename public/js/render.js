import { LayeredSVGToCanvasContext } from "./adapters.js";
import { Marks } from "./board.js";
import { Configs } from "./game.js";

const default_color_map = {
    1: "#b7a5dd",
    2: "#a4bef9",
    3: "#e7f297",
    4: "#f1cb9a",
    5: "#e58268",
    6: "#dfdfdf",
    7: "#b7b2a0",
    8: "#bedda7",
    9: "#b1d1d7",
    10: "#99ece9",
    11: "#d1a3bd",
};

// as a rather useful side effect
// this also dictates drawing order of layers
const Layers = {
    BOARD: 'board',
   ERRORS: 'errors',
 OUTLINES: 'outlines',
    MARKS: 'marks',
    HOVER: 'hover',
};

function draw_line(ctx, start_x, start_y, end_x, end_y) {
    ctx.beginPath();
    ctx.moveTo(start_x, start_y);
    ctx.lineTo(end_x, end_y);
    ctx.stroke();
}

export class Renderer {
    constructor(canvas, board, color_map = default_color_map) {
        this.canvas = new LayeredSVGToCanvasContext(canvas);

        // create layers upfront (sets the draw order)
        for (const layer of Object.values(Layers))
            this.canvas.layer(layer);

        this.board = board;
        this.color_map = color_map;
        this.invalid_marks = {};
        this.invalid_queens = [];

        this.styles = {
            outer: {
                border: {
                    width: 4,
                    color: 'black',
                },
            },

            inner: {
                border: {
                    width: 2.5,
                    color: 'black',
                },

                separator: {
                    width: 1,
                    color: '#444',
                },
            },
        };
    }

    clear() {
        this.canvas.layer(Layers.MARKS).clearRect(0, 0, Configs.canvas.width, Configs.canvas.height);
        this.canvas.layer(Layers.ERRORS).clearRect(0, 0, Configs.canvas.width, Configs.canvas.height);
        // this.canvas.layer(Layers.BOARD).clearRect(0, 0, Configs.canvas.width, Configs.canvas.height);
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
        const { TILE_SIZE } = Configs;

        if (!this.board.within_bounds(x, y))
            return;

        const global = this.board.to_global_position(x, y);
        const ctx = this.canvas.layer(Layers.HOVER);

        ctx.fillStyle = '#5554'
        ctx.fillRect(global.x, global.y, TILE_SIZE, TILE_SIZE);
    }

    clear_mouse_position() {
        const ctx = this.canvas.layer(Layers.HOVER);
        ctx.clearRect(0, 0, Configs.canvas.width, Configs.canvas.height);
    }

    render_invalid_cells(cells) {
        const { TILE_SIZE } = Configs;

        const ctx = this.canvas.layer(Layers.ERRORS);
        const marks_ctx = this.canvas.layer(Layers.MARKS);

        for (const cell of cells) {
            const relative = this.board.from_relative_int(cell);
            const global = this.board.to_global_position(relative.x, relative.y);

            ctx.filter = 'url(#invalid_color)';
            ctx.fillStyle = 'url(#invalid_marks)';

            const mark = this.board.get_mark(relative.x, relative.y);

            if (mark === Marks.QUEEN) {
                const queen = marks_ctx.extract(global.x, global.y, TILE_SIZE, TILE_SIZE);

                if (queen) {
                    queen.setAttribute('filter', 'url(#invalid_color');
                    this.invalid_queens.push(queen);
                }
            }

            if (!(cell in this.invalid_marks)) {
                const invalid_mark = ctx.fillRect(global.x, global.y, TILE_SIZE, TILE_SIZE);
                this.invalid_marks[cell] = invalid_mark;
            }
        }
    }

    clear_invalid_cells() {
        const marks = Object.values(this.invalid_marks);

        for (const mark of marks)
            this.canvas.layer(Layers.ERRORS).remove_child(mark);

        for (const queen of this.invalid_queens)
            queen.setAttribute('filter', 'none');

        this.invalid_queens = []
        this.invalid_marks = {}
    }

    render_mark(x, y) {
        const { TILE_SIZE } = Configs;

        const board = this.board;
        const ctx = this.canvas.layer(Layers.MARKS);

        const mark = board.get_mark(x, y);
        const pos = board.to_global_position(x, y);

        ctx.clearRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);

        let width, height;

        switch (mark) {
            case Marks.NONE:
                return;

            case Marks.BASIC:
                ctx.fillStyle = "black";
                ctx.lineWidth = 1;

                width = TILE_SIZE * .15;
                height = width;

                const left_x = pos.x + (TILE_SIZE - width) / 2;
                const top_y = pos.y + (TILE_SIZE - height) / 2;
                const bottom_y = top_y + height;
                const right_x = left_x + width;

                ctx.beginPath();
                ctx.moveTo(left_x, top_y);
                ctx.lineTo(right_x, bottom_y);

                ctx.moveTo(right_x, top_y);
                ctx.lineTo(left_x, bottom_y);

                const annotation = ctx.stroke();
                annotation.type = Marks.BASIC;
                break;

            case Marks.QUEEN:
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
        const { TILE_SIZE } = Configs;

        const board = this.board;
        const {outer, inner} = this.styles;

        let ctx = this.canvas.layer(Layers.BOARD);

        board.iterate((x, y, color) => {
            const pos = board.to_global_position(x, y);

            ctx.strokeStyle = inner.separator.color;
            ctx.fillStyle = this.color_map[color];
            ctx.lineWidth = inner.separator.width;

            ctx.beginPath();
            ctx.rect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
            ctx.stroke();
        });

        ctx = ctx.layer(Layers.OUTLINES);

        board.iterate((x, y, color) => {
            const pos = board.to_global_position(x, y);

            ctx.lineWidth = outer.border.width;
            ctx.strokeStyle = outer.border.color;

            // draw outer border
            if (!board.within_bounds(x + 1, y)) {
                draw_line(ctx,
                    pos.x + TILE_SIZE, pos.y,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);
            }
            else if (!board.within_bounds(x - 1, y)) {
                draw_line(ctx,
                    pos.x, pos.y,
                    pos.x, pos.y + TILE_SIZE);
            }

            if (!board.within_bounds(x, y + 1)) {
                draw_line(ctx,
                    pos.x, pos.y + TILE_SIZE,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);
            }
            else if (!board.within_bounds(x, y - 1)) {
                draw_line(ctx,
                    pos.x, pos.y,
                    pos.x + TILE_SIZE, pos.y);
            }

            ctx.lineWidth = inner.border.width;
            ctx.strokeStyle = inner.border.color;

            // draw borders between color regions
            if (color != board.get_color(x + 1, y) && board.within_bounds(x + 1, y)) {
                draw_line(ctx,
                    pos.x + TILE_SIZE, pos.y,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);
            }

            if (color != board.get_color(x, y + 1) && board.within_bounds(x, y + 1)) {
                draw_line(ctx,
                    pos.x, pos.y + TILE_SIZE,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);
            }
        });
    }
}
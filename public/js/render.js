import { LayeredSVGToCanvasContext } from "./adapters.js";
import { Marks, TILE_SIZE } from "./board.js";

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

function drawLine(ctx, startX, startY, endX, endY) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}

export class Renderer {
    constructor(canvas, board, color_map = default_color_map) {
        this.canvas = new LayeredSVGToCanvasContext(canvas);
        this.board = board;
        this.color_map = color_map;
        this.invalid_marks = {};
        this.invalid_queens = [];
    }

    animate_completion() {
        const marks_ctx = this.canvas.layer('marks');
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
        if (!this.board.within_bounds(x, y))
            return;

        const global = this.board.to_global_position(x, y);
        const ctx = this.canvas.layer('mouse');

        ctx.fillStyle = '#5554'
        ctx.fillRect(global.x, global.y, TILE_SIZE, TILE_SIZE);
    }

    clear_mouse_position(x, y) {
        if (!this.board.within_bounds(x, y))
            return;

        const global = this.board.to_global_position(x, y);
        const ctx = this.canvas.layer('mouse');

        ctx.clearRect(global.x, global.y, TILE_SIZE, TILE_SIZE);
    }

    render_invalid_cells(cells) {
        const ctx = this.canvas.layer('errors');
        const marks_ctx = this.canvas.layer('marks');

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
            this.canvas.layer('errors').remove_child(mark);

        for (const queen of this.invalid_queens)
            queen.setAttribute('filter', 'none');

        this.invalid_queens = []
        this.invalid_marks = {}
    }

    render_mark(x, y) {
        const board = this.board;
        const ctx = this.canvas.layer('marks');

        const mark = board.get_mark(x, y);
        const pos = board.to_global_position(x, y);

        ctx.clearRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);

        switch (mark) {
            case Marks.NONE:
                return;

            case Marks.BASIC:
                ctx.fillStyle = "black";
                ctx.lineWidth = 1;

                var width = TILE_SIZE / 5;
                var height = TILE_SIZE / 5;

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
                var width = TILE_SIZE / 2;
                var height = TILE_SIZE / 2;

                const queen = ctx.drawImageFromSource('./images/Queen.svg',
                    pos.x + (TILE_SIZE - width) / 2,
                    pos.y + (TILE_SIZE - height) / 2,
                    width, height);

                queen.type = Marks.QUEEN;
                break;
        }

    }

    render_board() {
        let board = this.board;
        let ctx = this.canvas.layer('board');

        board.iterate((x, y, color) => {
            const pos = board.to_global_position(x, y);

            ctx.strokeStyle = "gray";
            ctx.fillStyle = this.color_map[color];
            ctx.lineWidth = 0.5;

            ctx.beginPath();
            ctx.rect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
            ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
            ctx.stroke();
        });

        board.iterate((x, y, color) => {
            const pos = board.to_global_position(x, y);

            ctx.lineWidth = 3;
            ctx.strokeStyle = "black";

            if (!board.within_bounds(x + 1, y)) {
                drawLine(ctx,
                    pos.x + TILE_SIZE, pos.y,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);
            }
            else if (!board.within_bounds(x - 1, y)) {
                drawLine(ctx,
                    pos.x, pos.y,
                    pos.x, pos.y + TILE_SIZE);
            }

            if (!board.within_bounds(x, y + 1)) {
                drawLine(ctx,
                    pos.x, pos.y + TILE_SIZE,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);
            }
            else if (!board.within_bounds(x, y - 1)) {
                drawLine(ctx,
                    pos.x, pos.y,
                    pos.x + TILE_SIZE, pos.y);
            }

            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";

            if (color != board.get_color(x + 1, y)) {
                drawLine(ctx,
                    pos.x + TILE_SIZE, pos.y,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);
            }

            if (color != board.get_color(x, y + 1)) {
                drawLine(ctx,
                    pos.x, pos.y + TILE_SIZE,
                    pos.x + TILE_SIZE, pos.y + TILE_SIZE);
            }
        });
    }
}
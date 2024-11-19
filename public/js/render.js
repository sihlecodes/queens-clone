import { SVGToCanvasContext } from "./adapters.js";
import { Board, Marks, TILE_SIZE } from "./board.js";

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
    constructor(board_canvas, marks_canvas, board, color_map = default_color_map) {
        this.board_canvas = board_canvas;
        this.marks_canvas = marks_canvas;
        this.board = board;
        this.color_map = color_map;
    }

    render_mark(x, y) {
        const board = this.board;
        const ctx = new SVGToCanvasContext(this.marks_canvas);

        const mark = board.get_mark(x, y);
        const pos = Board.to_global_position(x, y);

        ctx.clearRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);

        switch (mark) {
            case Marks.NONE:
                return;

            case Marks.BASIC:
                ctx.fillStyle = "black";
                ctx.lineWidth = 1;

                var width = TILE_SIZE / 4;
                var height = TILE_SIZE / 4;

                const leftX = pos.x + (TILE_SIZE - width) / 2;
                const topY = pos.y + (TILE_SIZE - height) / 2;
                const rightX = leftX + width;

                ctx.beginPath();
                ctx.moveTo(leftX, topY);
                ctx.lineTo(leftX + width, topY + height);

                ctx.moveTo(rightX, topY);
                ctx.lineTo(leftX, topY + height);
                ctx.stroke();
                break;

            case Marks.QUEEN:
                var width = TILE_SIZE / 2;
                var height = TILE_SIZE / 2;

                ctx.drawImageFromSource('./images/Queen.svg',
                    pos.x + (TILE_SIZE - width) / 2,
                    pos.y + (TILE_SIZE - height) / 2,
                    width, height);
                break;
        }

    }

    render_board() {
        let board = this.board;
        let ctx = new SVGToCanvasContext(this.board_canvas);

        board.iterate((x, y, color) => {
            const pos = Board.to_global_position(x, y);

            ctx.strokeStyle = "gray";
            ctx.fillStyle = this.color_map[color];
            ctx.lineWidth = 0.5;

            ctx.beginPath();
            ctx.rect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
            ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
            ctx.stroke();
        });

        board.iterate((x, y, color) => {
            const pos = Board.to_global_position(x, y);

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
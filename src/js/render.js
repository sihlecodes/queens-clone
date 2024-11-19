export const color_map = {
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

export function render_mark(target, board, x, y) {
    let ctx = target.getContext("2d");

    const mark = board.get_mark(x, y)
    const pos = board.to_global_position(x, y);

    ctx.clearRect(pos.x, pos.y, board.TILE_SIZE, board.TILE_SIZE);

    switch (mark) {
        case board.marks.NONE:
            return;

        case board.marks.BASIC:
            ctx.fillStyle = "black";
            ctx.lineWidth = 1;

            var width = board.TILE_SIZE / 4;
            var height = board.TILE_SIZE / 4;

            const leftX = pos.x + (board.TILE_SIZE - width) / 2;
            const topY = pos.y + (board.TILE_SIZE - height) / 2;
            const rightX = leftX + width;

            ctx.beginPath();
            ctx.moveTo(leftX, topY);
            ctx.lineTo(leftX + width, topY + height);

            ctx.moveTo(rightX, topY);
            ctx.lineTo(leftX, topY + height);
            ctx.stroke();
            break;

        case board.marks.QUEEN:
            var width = board.TILE_SIZE / 2;
            var height = board.TILE_SIZE / 2;
            let image = document.getElementById("queen");
            ctx.drawImage(image,
                pos.x + (board.TILE_SIZE - width) / 2,
                pos.y + (board.TILE_SIZE - height) / 2,
                width, height);
            break;
    }

}

export function render(target, board, color_map) {
    let ctx = target.getContext("2d");

    board.iterate((x, y, color) => {
        const pos = board.to_global_position(x, y);

        ctx.strokeStyle = "gray";
        ctx.fillStyle = color_map[color];
        ctx.lineWidth = 0.5;

        ctx.beginPath();
        ctx.rect(pos.x, pos.y, board.TILE_SIZE, board.TILE_SIZE)
        ctx.fillRect(pos.x, pos.y, board.TILE_SIZE, board.TILE_SIZE);
        ctx.stroke()
    });

    board.iterate((x, y, color) => {
        const pos = board.to_global_position(x, y);

        ctx.lineWidth = 3;
        ctx.strokeStyle = "black";

        if (!board.within_bounds(x + 1, y)) {
            drawLine(ctx,
                pos.x + board.TILE_SIZE, pos.y,
                pos.x + board.TILE_SIZE, pos.y + board.TILE_SIZE);
        }
        else if (!board.within_bounds(x - 1, y)) {
            drawLine(ctx,
                pos.x, pos.y,
                pos.x, pos.y + board.TILE_SIZE);
        }

        if (!board.within_bounds(x, y + 1)) {
            drawLine(ctx,
                pos.x, pos.y + board.TILE_SIZE,
                pos.x + board.TILE_SIZE, pos.y + board.TILE_SIZE);
        }
        else if (!board.within_bounds(x, y - 1)) {
            drawLine(ctx,
                pos.x, pos.y,
                pos.x + board.TILE_SIZE, pos.y);
        }

        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";

        if (color != board.get_color(x + 1, y)) {
            drawLine(ctx,
                pos.x + board.TILE_SIZE, pos.y,
                pos.x + board.TILE_SIZE, pos.y + board.TILE_SIZE);
        }

        if (color != board.get_color(x, y + 1)) {
            drawLine(ctx,
                pos.x, pos.y + board.TILE_SIZE,
                pos.x + board.TILE_SIZE, pos.y + board.TILE_SIZE);
        }

    });
}
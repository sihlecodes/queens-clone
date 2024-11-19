import { render, render_mark, color_map } from './render.js';
import { board } from './board.js';

const States = {
    NOP: 0,
    MARKING: 1,
    CLEARING_MARK: 2,
    CLEARING_QUEEN: 4,
    DRAGGING: 8,

    overlap: function(state, other) {
        return (state & other) === other;
    }
}

let state = States.NOP

const Game = {
    start: function() {
        const board_canvas = document.getElementById("board_canvas");
        const marks_canvas = document.getElementById("marks_canvas");

        board.init();
        // board.set_mark(0, 0, board.marks.QUEEN);
        // render_mark(marks_canvas, board, 0, 0);

        render(board_canvas, board, color_map);
        this.handle_input(marks_canvas, board);
    },

    handle_input: function(element, board) {
        element.addEventListener("mousedown", function(e) {
            const {x, y} = board.to_relative_position(e.offsetX, e.offsetY);
            const mark = board.get_mark(x, y);

            switch (mark) {
                case board.marks.NONE:
                    state = States.MARKING;
                    break;
                case board.marks.BASIC:
                    state = States.CLEARING_MARK;
                    break;
                default:
                    state = States.CLEARING_QUEEN;
                    break;
            }
        });

        element.addEventListener("dblclick", function(e) {
            const {x, y} = board.to_relative_position(e.offsetX, e.offsetY);

            board.set_mark(x, y, board.marks.QUEEN);
            render_mark(element, board, x, y);

            state = States.NOP;
        });

        element.addEventListener("mouseleave", function(e) {
            state = States.NOP;
        });

        element.addEventListener("mouseup", function(e) {
            const {x, y} = board.to_relative_position(e.offsetX, e.offsetY);

            if (States.overlap(state, States.DRAGGING)) {
                state = States.NOP;
                return;
            }

            switch (state) {
                case States.CLEARING_MARK:
                case States.CLEARING_QUEEN:
                    board.cycle_mark(x, y);
                    break;

                case States.MARKING:
                    board.set_mark(x, y, board.marks.BASIC);
                    break;
            }

            render_mark(element, board, x, y);
            state = States.NOP;
        });

        element.addEventListener("mousemove", function(e) {
            const {x, y} = board.to_relative_position(e.offsetX, e.offsetY);

            if (state === States.NOP)
                return;

            state |= States.DRAGGING;

            if (!board.get_mark(x, y) && States.overlap(state, States.MARKING)) {
                board.set_mark(x, y, board.marks.BASIC);
            }
            else if (States.overlap(state, States.CLEARING_MARK)) {
                if (board.get_mark(x, y) !== board.marks.QUEEN)
                    board.set_mark(x, y, board.marks.NONE);
            }

            if (state != States.NOP)
                render_mark(element, board, x, y);
        });
    },

    debug: function(text) {
        const debug = document.getElementById("debug");
        debug.innerText = text;
    }
}

Game.start();
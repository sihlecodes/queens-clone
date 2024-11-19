import { render, render_mark, color_map } from './render.js';
import { board } from './board.js';

const States = {
    NOP: 0,
    MARKING: 1,
    CLEARING: 2,
    DRAGGING: 4,

    overlap: function(state, other) {
        return (state & other) === other;
    }
}

let state = States.NOP;

const board_canvas = document.getElementById('board_canvas');
const marks_canvas = document.getElementById('marks_canvas');

let InputHandler = {
    state: States.NOP,
    _event: '',

    change: function(state) {
        this.state = state;
    },

    prev: {x: 0, y: 0},

    handle: function (name, event) {
        let rect = marks_canvas.getBoundingClientRect();
        let event_x = event.clientX - rect.left;
        let event_y = event.clientY - rect.top;

        const {x, y} = board.to_relative_position(event_x, event_y);
        const mark = board.get_mark(x, y);

        switch (name) {
            case 'mousedown':
                switch (mark) {
                    case board.marks.NONE:
                        this.change(States.MARKING);
                        break;
                    case board.marks.BASIC:
                        this.change(States.CLEARING);
                        break;
                    default:
                        this.change(States.NOP);
                        break;
                }

                this.prev = {x: event_x, y: event_y};
                console.log('set ' + `(${this.prev.x}, ${this.prev.y})`);
                break;
            case 'mousemove':
                console.log('check ' + `(${event_x}, ${event_y})`);
                if (this.prev.x === event_x && this.prev.y === event_y)
                    break;

                if (mark === board.marks.QUEEN)
                    break;

                switch (this.state) {
                    case States.CLEARING:
                        board.set_mark(x, y, board.marks.NONE);
                        break;
                    case States.MARKING:
                        board.set_mark(x, y, board.marks.BASIC);
                        break;
                }

                render_mark(marks_canvas, board, x, y);
                break;
            case 'mouseup':
                this.change(States.NOP);

                if (this.prev.x !== event_x && this.prev.y !== event_y)
                    break;

                board.cycle_mark(x, y);
                render_mark(marks_canvas, board, x, y);
                break;
            case 'mouseleave':
                this.change(States.NOP);
                break;
        }
    },
};


const Game = {
    start: function () {
        board.init();

        render(board_canvas, board, color_map);
        this.handle_input(marks_canvas, board);
    },

    handle_input: function (element, board) {
        element.addEventListener('mousedown', function (e) {
            InputHandler.handle('mousedown', e);
        });

        element.addEventListener('touchstart', function (e) {
            InputHandler.handle('mousedown', e.touches[0])
        });
        element.addEventListener('touchmove', function(e) {
            InputHandler.handle('mousemove', e.touches[0])
        });

        element.addEventListener('touchend', function (e) {
            InputHandler.handle('mouseup', e)
        });
        element.addEventListener('mouseleave', function (e) {
            InputHandler.handle('mouseleave', e);
        });
        element.addEventListener('mouseup', function (e) {
            InputHandler.handle('mouseup', e);
        });
        element.addEventListener('mousemove', function (e) {
            InputHandler.handle('mousemove', e);
        });
    },

    debug: function (text) {
        const debug = document.getElementById('debug');
        debug.innerText = text;
    }
}

Game.start();
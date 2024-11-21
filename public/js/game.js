import { Renderer } from './render.js';
import { Board, Marks } from './board.js';
import { StateMachine } from './input_handler.js';
import { default_layout } from './assets.js';

const Game = {
    start: function () {
        const canvas = document.getElementById('svg-canvas');
        const board = new Board(default_layout);
        const renderer = new Renderer(canvas, board);
        const state = new StateMachine();

        board.handlers.on_queens_check = function() {
            renderer.clear_invalid();
        }

        board.handlers.on_invalid_queens = function(cells) {
            renderer.render_invalid(cells);
        }

        board.handlers.on_win = function() {
            console.log('you win!');
        }

        state.handlers.on_clear = function(x, y) {
            board.set_mark(x, y, Marks.NONE);
            renderer.render_mark(x, y);
        };

        state.handlers.on_mark = function(x, y) {
            board.set_mark(x, y, Marks.BASIC);
            renderer.render_mark(x, y);
        };

        state.handlers.on_toggle = function(x, y) {
            board.cycle_mark(x, y);
            renderer.render_mark(x, y);
        };

        renderer.render_board();

        this.register_events(board, canvas, state);
    },

    register_events: function(board, element, state) {
        element.add_event_listener = function(name, tr) {
            this.addEventListener(name, function(e) {
                let event = tr(e);
                let rect = this.getBoundingClientRect();

                const global = {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                }

                const relative = Board.to_relative_position(global.x, global.y);
                const mark = board.get_mark(relative.x, relative.y);

                state.handle(name, global, relative, mark);
            });
        }

        const nop = (e) => e;
        const first_touch = (e) => e.touches[0];

        element.add_event_listener('mousedown', nop);
        element.add_event_listener('mousemove', nop);
        element.add_event_listener('mouseup', nop);
        element.add_event_listener('mouseleave', nop);
        element.add_event_listener('touchstart', first_touch);
        element.add_event_listener('touchmove', first_touch);
        element.add_event_listener('touchend', nop);
    },
}

Game.start();
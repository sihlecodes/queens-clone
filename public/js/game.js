import { Renderer } from './render.js';
import { Board, Marks } from './board.js';
import { InputStateHandler } from './input_handler.js';
import { default_layout } from './assets.js';

export const Configs = {
    TILE_SIZE: undefined,
    RENDER_OFFSET: 5,
}

const Game = {
    start: function () {
        this.canvas = document.getElementById('canvas');
        this.board = new Board(default_layout);
        this.renderer = new Renderer(this.canvas, this.board);
        this.input = new InputStateHandler();

        const canvas = this.canvas;
        const board = this.board;
        const renderer = this.renderer;
        const input = this.input;

        const smallest = Math.min(canvas.clientWidth, canvas.clientHeight);
        Configs.TILE_SIZE = (smallest - Configs.RENDER_OFFSET * 2) / board.columns();

        board.handlers.on_remove_queen = () => {
            renderer.clear_invalid_cells();
        };

        board.handlers.on_invalid_queens = (cells) => {
            renderer.render_invalid_cells(cells);
        };

        board.handlers.on_valid_queens = (num_queens) => {
            const win_condition = Math.min(board.columns(), board.rows());

            if (num_queens === win_condition) {
                console.log('you win!');
                renderer.animate_completion();
            }
        };

        board.handlers.on_mark_applied = (x, y) => {
            renderer.render_mark(x, y);
        }

        input.handlers.on_hover_changing = (x, y) => {
            renderer.clear_mouse_position(x, y);
        };

        input.handlers.on_hover_changed = (x, y) => {
            renderer.render_mouse_position(x, y);
        };

        input.handlers.on_clear = (x, y) => {
            board.set_mark(x, y, Marks.NONE);
        };

        input.handlers.on_mark = (x, y) => {
            board.set_mark(x, y, Marks.BASIC);
        };

        input.handlers.on_toggle = (x, y) => {
            board.cycle_mark(x, y);
        };

        renderer.render_board();

        this.register_mouse_events(board, canvas, input);
        this.register_button_actions();
    },

    register_button_actions: function() {
        const btn_clear = document.getElementById('btn-clear');
        const btn_new = document.getElementById('btn-new');

        btn_clear.onclick = () => this.clear();
    },

    register_mouse_events: function(board, element, input_handler) {
        element.add_event_listener = function(name, tr) {
            this.addEventListener(name, function(e) {
                let event = tr(e);
                let rect = this.getBoundingClientRect();

                const global_pos = {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                }

                const relative_pos = board.to_relative_position(global_pos.x, global_pos.y);
                const mark = board.get_mark(relative_pos.x, relative_pos.y);

                input_handler.handle(name, global_pos, relative_pos, mark);
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

    clear: function() {
        console.log('clear');

        // this.renderer.
    }
}

Game.start();
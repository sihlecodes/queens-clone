import { Renderer } from './render.js';
import { Board, Marks } from './board.js';
import { InputStateHandler } from './input_handler.js';
import { Configuaration } from './configure.js';

// Undefined properties are populated during runtime
export const Global = {
    TILE_SIZE: undefined,
    ...Configuaration,
};

class Game {
    start() {
        this.canvas = document.getElementById('canvas');

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.board = new Board(Global.map);
        this.renderer = new Renderer(this.canvas, this.board, width, height);
        this.input = new InputStateHandler();
        this.reset();

        const { canvas, board, renderer, input } = this;

        Global.TILE_SIZE = (Math.min(width, height) - Global.RENDER_OFFSET * 2) / board.columns();

        board.handlers.on_remove_queen = () => {
            renderer.clear_invalid_cells();
        };

        board.handlers.on_invalid_queens = (cells) => {
            renderer.render_invalid_cells(cells);
        };

        board.handlers.on_valid_queens = (num_queens) => {
            const win_condition = Math.min(board.columns(), board.rows());

            if (num_queens === win_condition) {
                clearInterval(this.timer);
                this.completed = true;

                renderer.clear_mouse_position();
                renderer.animate_completion();
                input.disable();

                console.log('you win!');
            }
        };

        board.handlers.on_mark_applied = (x, y) => {
            renderer.render_mark(x, y);
        }

        input.handlers.on_first_click = () => {
            this.timer = setInterval(() => {
                this.time++;
                this.update_elapsed_time()
            }, 1000);
        }

        input.handlers.on_hover_changing = () => {
            renderer.clear_mouse_position();
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
    }

    register_button_actions() {
        const btn_clear = document.getElementById('btn-clear');
        const btn_new = document.getElementById('btn-new');

        btn_clear.onclick = () => this.clear();
    }

    register_mouse_events(board, element, input_handler) {
        element.add_event_listener = function(name, tr) {
            this.addEventListener(name, function(e) {
                e.preventDefault();

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
    }

    update_elapsed_time() {
        const mins = Math.floor(this.time / 60);
        const secs = this.time % 60;

        const time = document.getElementById('time');
        time.innerText = `${mins}:${String(secs).padStart(2, '0')}`;
    }

    clear() {
        this.board.clear();
        this.renderer.clear();
        this.input.enable();

        if (this.completed)
            this.reset();
    }

    reset() {
        this.time = 0;
        this.update_elapsed_time(); // set the ui to 0:00

        this.completed = false;
        this.timer = undefined;
        this.input.reset();
    }
}

new Game().start();

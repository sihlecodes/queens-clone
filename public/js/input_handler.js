import { Board, Marks } from './board.js'

const States = {
    NOP: 0,
    MARKING: 1,
    CLEARING: 2,
    DRAGGING: 4,
}

export class InputStateHandler {
    constructor() {
        this.reset();

        this.handlers = {
            on_clear: undefined,
            on_mark: undefined,
            on_toggle: undefined,
            on_hover_changing: undefined,
            on_hover_changed: undefined,
            on_first_click: undefined,
        }
    }

    reset() {
        this.state = States.NOP;
        this.previous_global_pos = {x: 0, y: 0};
        this.mouse_moved = false;
        this.first_click = false;
        this.disabled = false;
    }

     enable() { this.disabled = false; }
    disable() { this.disabled = true; }

    handle(name, global_pos, relative_pos, mark) {
        if (this.disabled)
            return;

        switch (name) {
            case 'touchstart':
            case 'mousedown':
                this.handle_mouse_down(global_pos, mark);
                // console.log('set ' + `(${this.previous_mouse_position.x}, ${this.previous_mouse_position.y})`);
                break;


            case 'mousemove':
                this.handle_hover(relative_pos);

            case 'touchmove':
                this.handle_mouse_move(name, global_pos, relative_pos, mark);
                break;

            case 'touchend':
            case 'mouseup':
                this.handle_mouse_up(relative_pos);
                break;

            case 'mouseleave':
                this.state = States.NOP;
                this.handle_hover(relative_pos);
                break;
        }
    }

    get_next_state(mark) {
        switch (mark) {
            case Marks.NONE:
                return States.MARKING;

            case Marks.BASIC:
                return States.CLEARING;

            default:
                return States.NOP;
        }
    }

    handle_mouse_down(global, mark) {
        if (!this.first_click) {
            this.handlers.on_first_click?.();
            this.first_click = true;
        }

        this.state = this.get_next_state(mark);
        this.previous_global_pos = global;
        this.mouse_moved = false;
    }

    handle_hover(relative_pos) {
        const previous_relative_pos = Board.to_relative_position(
            this.previous_global_pos.x, this.previous_global_pos.y);

        if (relative_pos.x !== previous_relative_pos.x ||
            relative_pos.y !== previous_relative_pos.y) {
                this.handlers.on_hover_changing?.(previous_relative_pos.x,previous_relative_pos.y);
                this.handlers.on_hover_changed?.(relative_pos.x, relative_pos.y);
        }
    }

    handle_drag_action(relative_pos) {
        switch (this.state) {
            case States.CLEARING:
                this.handlers.on_clear?.(relative_pos.x, relative_pos.y);
                break;

            case States.MARKING:
                this.handlers.on_mark?.(relative_pos.x, relative_pos.y);
                break;
        }
    }

    handle_mouse_move(name, global_pos, relative_pos, mark) {
        if (this.previous_global_pos.x === global_pos.x &&
            this.previous_global_pos.y === global_pos.y && !this.mouse_moved)
                return;

        if (!this.mouse_moved && name === 'touchmove') {
            const initial_relative_pos = Board.to_relative_position(
                this.previous_global_pos.x, this.previous_global_pos.y);

            this.handle_drag_action(initial_relative_pos);
        }

        this.previous_global_pos = global_pos;

        if (mark === Marks.QUEEN)
            return;

        this.handle_drag_action(relative_pos);
        this.mouse_moved = true;
    }

    handle_mouse_up(relative_pos) {
        this.state = States.NOP;

        if(!this.mouse_moved)
            this.handlers.on_toggle?.(relative_pos.x, relative_pos.y);
    }
}

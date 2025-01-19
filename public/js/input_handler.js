import { Marks } from './board.js'

const States = {
    NOOP: 0,
    MARKING: 1,
    CLEARING: 2,
}

const DRAG_IGNORE_RADIUS = 8;

export class InputStateHandler {
    constructor(board) {
        this.board = board;
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
        this.state = States.NOOP;
        this.previous_relative_pos = {x: 0, y: 0};

        this.starting_pos = {
            global:   {x: 0, y: 0},
            relative: {x: 0, y: 0},
        };

        this.first_clicked = false;
        this.mouse_moved = false;
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
                this.handle_mouse_down(global_pos, relative_pos, mark);
                break;

            case 'mousemove':
                this.handle_hover(relative_pos);

            case 'touchmove':
                this.handle_mouse_move(global_pos, relative_pos, mark);
                break;

            case 'touchend':
            case 'mouseup':
                this.handle_mouse_up(relative_pos);
                break;

            case 'mouseleave':
                this.state = States.NOOP;
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
                return States.NOOP;
        }
    }

    handle_mouse_down(global_pos, relative_pos, mark) {
        if (!this.first_clicked) {
            this.handlers.on_first_click?.();
            this.first_clicked = true;
        }

        this.state = this.get_next_state(mark);

        this.starting_pos = {
            global: global_pos,
            relative: relative_pos,
        }

        this.mouse_moved = false;
    }

    handle_hover(relative_pos) {
        if (relative_pos.x !== this.previous_relative_pos.x ||
            relative_pos.y !== this.previous_relative_pos.y) {
                this.handlers.on_hover_changing?.(this.previous_relative_pos);
                this.handlers.on_hover_changed?.(relative_pos);
        }

        this.previous_relative_pos = relative_pos;
    }

    handle_drag_action(relative_pos) {
        switch (this.state) {
            case States.CLEARING:
                this.handlers.on_clear?.(relative_pos);
                break;

            case States.MARKING:
                this.handlers.on_mark?.(relative_pos);
                break;
        }
    }

    handle_mouse_move(global_pos, relative_pos, mark) {
        if (this.state === States.NOOP)
            return;

        if (!this.mouse_moved) {
            const dx = this.starting_pos.global.x - global_pos.x;
            const dy = this.starting_pos.global.y - global_pos.y;

            if ((dx * dx + dy * dy) < Math.pow(DRAG_IGNORE_RADIUS, 2) &&
                this.starting_pos.relative.x === relative_pos.x &&
                this.starting_pos.relative.y === relative_pos.y)
                return;
        }

        if (!this.mouse_moved) {
            this.handle_drag_action(this.starting_pos.relative);
            this.mouse_moved = true;
        }

        if (mark === Marks.QUEEN)
            return;

        this.handle_drag_action(relative_pos);
    }

    handle_mouse_up(relative_pos) {
        this.state = States.NOOP;

        if(!this.mouse_moved)
            this.handlers.on_toggle?.(relative_pos);
    }
}

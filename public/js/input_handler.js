import { Board, Marks } from './board.js'

const States = {
    NOP: 0,
    MARKING: 1,
    CLEARING: 2,
    DRAGGING: 4,
}

export class StateMachine {
    constructor() {
        this.state = States.NOP;
        this.previous_global = {x: 0, y: 0};

        this.handlers = {
            on_clear: undefined,
            on_mark: undefined,
            on_toggle: undefined,
            on_hover_changing: undefined,
            on_hover_changed: undefined,
        }

        this.start = null;
    }

    handle(name, global, relative, mark) {
        switch (name) {
            case 'touchstart':
            case 'mousedown':
                switch (mark) {
                    case Marks.NONE:
                        this.state = States.MARKING;
                        break;
                    case Marks.BASIC:
                        this.state = States.CLEARING;
                        break;
                    default:
                        this.state = States.NOP;
                        break;
                }

                this.starting_global = this.previous_global = global
                // console.log('set ' + `(${this.previous_mouse_position.x}, ${this.previous_mouse_position.y})`);
                break;

            case 'mousemove':
                const previous_relative = Board.to_relative_position(this.previous_global.x, this.previous_global.y);

                if (relative.x !== previous_relative.x || relative.y !== previous_relative.y) {
                    this.handlers.on_hover_changing?.(previous_relative.x, previous_relative.y);
                    this.handlers.on_hover_changed?.(relative.x, relative.y);
                }

            case 'touchmove':
                // console.log('check ' + `(${global.x}, ${global.y})`);
                if (this.previous_global.x === global.x &&
                    this.previous_global.y === global.y)
                    break;

                this.previous_global = global;

                if (mark === Marks.QUEEN)
                    break;

                switch (this.state) {
                    case States.CLEARING:
                        this.handlers.on_clear?.(relative.x, relative.y);
                        break;
                    case States.MARKING:
                        this.handlers.on_mark?.(relative.x, relative.y);
                        break;
                }
                break;

            case 'touchend':
            case 'mouseup':
                this.state = States.NOP;

                if (this.starting_global.x !== global.x &&
                    this.starting_global.y !== global.y)
                    break;

                this.handlers.on_toggle?.(relative.x, relative.y);
                break;

            case 'mouseleave':
                this.state = States.NOP;
                break;
        }
    }
}
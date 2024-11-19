import { Marks } from './board.js'

const States = {
    NOP: 0,
    MARKING: 1,
    CLEARING: 2,
    DRAGGING: 4,
}

export class StateMachine {
    constructor() {
        this.state = States.NOP;
        this.previous_mouse_position = {x: 0, y: 0};

        this.handlers = {
            on_clear: null,
            on_mark: null,
            on_toggle: null,
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

                this.previous_mouse_position = global
                console.log('set ' + `(${this.previous_mouse_position.x}, ${this.previous_mouse_position.y})`);
                break;

            case 'touchmove':
            case 'mousemove':
                console.log('check ' + `(${global.x}, ${global.y})`);
                if (this.previous_mouse_position.x === global.x &&
                    this.previous_mouse_position.y === global.y)
                    break;

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

                if (this.previous_mouse_position.x !== global.x &&
                    this.previous_mouse_position.y !== global.y)
                    break;

                this.handlers.on_toggle?.(relative.x, relative.y);
                break;

            case 'mouseleave':
                this.state = States.NOP;
                break;
        }
    }
}
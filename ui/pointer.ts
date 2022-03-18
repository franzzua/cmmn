import {bind, EventListener, Fn} from "@cmmn/core";
import {Cell} from "cellx";
import {useCustomHandler} from "@cmmn/uhtml";
import {BoundRectListener} from "./boundRectListener";

useCustomHandler((node, name) => {
    if (name == "ondrag") {
        const pointer = new PointerListener(node);
        let lastListener = null;
        return ([listener, options, unsubscr]) => {
            if (lastListener !== listener) {
                unsubscr(pointer.on('drag', listener));
                lastListener = listener;
            }
        }
    }
});

export type RelativePointerEvent = { event: PointerEvent, point: IPoint };

export type PointerEvents = {
    move: RelativePointerEvent,
    down: RelativePointerEvent,
    up: RelativePointerEvent,
    enter: RelativePointerEvent,
    leave: RelativePointerEvent,
    click: RelativePointerEvent,
    dblclick: RelativePointerEvent,
    directClick: RelativePointerEvent
    drag: RelativePointerEvent & {
        shift: IPoint;
        start: IPoint;
        isStart?: boolean;
        isEnd?: boolean;
    }
};

export class PointerListener extends EventListener<PointerEvents> {

    constructor(public root: HTMLElement | SVGElement | Document) {
        super(root);
    }

    private rectWatcher = BoundRectListener.GetInstance(this.root);

    public get Rect() {
        return this.rectWatcher.Rect;
    }

    public getRelativePoint(event: MouseEvent): IPoint {
        const rect = this.rectWatcher.Rect;
        return {
            X: event.pageX - rect.left,
            Y: event.pageY - rect.top
        }
    }

    private _position: Cell<RelativePointerEvent>;

    public get Position(): RelativePointerEvent {
        if (this._position)
            return this._position.get();
        this._position = new Cell(null);
        this.on('move', e => this._position.set(e));
        this.on('enter', e => this._position.set(e));
        this.on('leave', e => this._position.set(null));
        return this._position.get();
    }

    @bind
    private async dragListener(downEvent: RelativePointerEvent) {
        let isStarted = false;

        if (downEvent.event.target !== this.root)
            return;
        const moveListener = event => {
            const shift = {
                X: event.event.movementX,
                Y: event.event.movementY
            };
            if (shift.X == 0 && shift.Y == 0)
                return;
            if (!isStarted){
                (this.root as HTMLElement).setPointerCapture(downEvent.event.pointerId);
                this.emit('drag', {
                    ...downEvent,
                    shift: undefined,
                    start: downEvent.point,
                    isStart: true,
                });
            }
            this.emit('drag', {
                ...event,
                shift,
                start: downEvent.point
            });
        };
        this.on('move', moveListener)
        this.once('up', event => {
            this.off('move', moveListener);
            (this.root as HTMLElement).releasePointerCapture(downEvent.event.pointerId);
            this.emit('drag', {
                ...event,
                shift: undefined,
                start: downEvent.point,
                isEnd: true,
            });
        });
    }

    @bind
    private async directClickListener(downEvent: RelativePointerEvent) {
        const upEvent = await this.onceAsync('up');
        if (upEvent.event.timeStamp - downEvent.event.timeStamp > 400)
            return;
        if (upEvent.event.x - downEvent.event.x > 1)
            return;
        if (upEvent.event.y - downEvent.event.y > 1)
            return;
        this.emit('directClick', upEvent);
    }

    private emitters = {
        move: event => this.emit('move', {event, point: this.getRelativePoint(event)}),
        down: event => this.emit('down', {event, point: this.getRelativePoint(event)}),
        up: event => this.emit('up', {event, point: this.getRelativePoint(event)}),
        enter: event => this.emit('enter', {event, point: this.getRelativePoint(event)}),
        leave: event => this.emit('leave', {event, point: this.getRelativePoint(event)}),
        click: event => this.emit('click', {event, point: this.getRelativePoint(event)}),
        dblclick: event => this.emit('dblclick', {event, point: this.getRelativePoint(event)}),
        directClick: this.directClickListener,
        drag: this.dragListener,
    }

    protected subscribe(eventName: keyof PointerEvents) {
        switch (eventName) {
            case 'enter':
            case 'leave':
            case 'down':
            case 'up':
            case 'move':
                this.root.addEventListener('pointer' + eventName, this.emitters[eventName]);
                break;
            case 'click':
                this.root.addEventListener('mouseClick', this.emitters[eventName]);
                break;
            case "dblclick":
                this.root.addEventListener('dblclick', this.emitters[eventName]);
                break;
            case "drag":
                this.on('down', this.dragListener)
                break;
            case 'directClick':
                this.on('up', Fn.I);
                this.on('down', this.directClickListener)
                break;
        }
    }

    protected unsubscribe(eventName: keyof PointerEvents) {
        switch (eventName) {
            case 'enter':
            case 'leave':
            case 'down':
            case 'up':
            case 'move':
                this.root.removeEventListener('pointer' + eventName, this.emitters[eventName]);
                break;
            case 'click':
                this.root.removeEventListener('mouseClick', this.emitters[eventName]);
                break;
            case "dblclick":
                this.root.removeEventListener('dblclick', this.emitters[eventName]);
                break;
            case 'directClick':
                this.off('up', Fn.I);
                this.off('down', this.directClickListener);
                break;
            case "drag":
                this.off('down', this.dragListener);
                break;
        }
    }
}

export const Pointer = new PointerListener(document);


export type IPoint = {
    X: number;
    Y: number;
}
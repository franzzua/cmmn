import {bind, EventListener, Fn} from "@cmmn/core";
import {Cell} from "cellx";

export type RelativePointerEvent = {event: PointerEvent, point: IPoint};

export type PointerEvents = {
    move: RelativePointerEvent,
    down: RelativePointerEvent,
    up: RelativePointerEvent,
    enter: RelativePointerEvent,
    leave: RelativePointerEvent,
    click: RelativePointerEvent,
    dblclick: RelativePointerEvent,
    directClick: RelativePointerEvent
};

export class PointerListener extends EventListener<PointerEvents> {

    constructor(private root: HTMLElement | SVGElement | Document) {
        super(root);
    }

    private getLeftTop(){
        if ('getBoundingClientRect' in this.root)
            return this.root.getBoundingClientRect();
        return {left: 0, top: 0};
    }

    public getRelativePoint(event: MouseEvent): IPoint{
        const rect = this.getLeftTop()
        return  {
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
        }
    }
}

export const Pointer = new PointerListener(document);


export type IPoint = {
    X: number;
    Y: number;
}
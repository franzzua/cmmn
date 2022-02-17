import {bind, EventEmitter, Fn} from "@cmmn/core";
import {Cell} from "cellx";

export type PointerEvents = {
    move: PointerEvent,
    down: PointerEvent,
    up: PointerEvent,
    enter: PointerEvent,
    leave: PointerEvent,
    click: PointerEvent,
    dblClick: PointerEvent,
    directClick: PointerEvent
};

export class PointerEmitter extends EventEmitter<PointerEvents> {

    constructor(private root: HTMLElement | Document) {
        super();
    }

    public on<TEventName extends keyof PointerEvents>(eventName, listener: (data: PointerEvents[TEventName]) => void) {
        const unsubscr = super.on(eventName, listener);
        if (this.listeners.get(eventName).size == 1) {
            this.subscribe(eventName);
        }
        return unsubscr;
    }

    public off<TEventName extends keyof PointerEvents>(eventName, listener: (data: PointerEvents[TEventName]) => void) {
        super.off(eventName, listener);
        if (this.listeners.get(eventName).size == 0) {
            this.unsubscribe(eventName);
        }
    }

    private _position: Cell<PointerEvent>;

    public get Position(): PointerEvent {
        if (this._position)
            return this._position.get();
        this._position = new Cell(null);
        this.on('move', e => this._position.set(e));
        this.on('enter', e => this._position.set(e));
        this.on('leave', e => this._position.set(null));
        return this._position.get();
    }

    public get PositionPoint(): { X: number; Y: number; } {
        if (!this.Position) return null;
        return {
            X: this.Position.x,
            Y: this.Position.y
        };
    }

    @bind
    private async directClickListener(downEvent: PointerEvent) {
        const upEvent = await this.onceAsync('up');
        if (upEvent.timeStamp - downEvent.timeStamp > 400)
            return;
        if (upEvent.x - downEvent.x > 1)
            return;
        if (upEvent.y - downEvent.y > 1)
            return;
        this.emit('directClick', upEvent);
    }

    private emitters = {
        move: event => this.emit('move', event),
        down: event => this.emit('down', event),
        up: event => this.emit('up', event),
        enter: event => this.emit('enter', event),
        leave: event => this.emit('leave', event),
        click: event => this.emit('click', event),
        dblClick: event => this.emit('dblClick', event),
        directClick: this.directClickListener,
    }

    private subscribe(eventName: keyof PointerEvents) {
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
            case "dblClick":
                this.root.addEventListener('dblclick', this.emitters[eventName]);
                break;
            case 'directClick':
                this.on('up', Fn.I);
                this.on('down', this.directClickListener)
                break;
        }
    }

    private unsubscribe(eventName: keyof PointerEvents) {
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
            case "dblClick":
                this.root.removeEventListener('dblclick', this.emitters[eventName]);
                break;
            case 'directClick':
                this.off('up', Fn.I);
                this.off('down', this.directClickListener);
                break;
        }
    }
}

export const Pointer = new PointerEmitter(document);

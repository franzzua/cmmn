import {StoppableEventEmitter} from "./stoppableEventEmitter";

export class EventListener<TEvents extends {
    [key in string]: any | void;
}> extends StoppableEventEmitter<TEvents> {

    constructor(private target: Omit<EventTarget, "dispatchEvent">) {
        super();
    }

    private _emitters: {
        [key in keyof TEvents]?: Function
    } = {}

    protected subscribe(eventName: keyof TEvents) {
        if (!this._emitters[eventName])
            this._emitters[eventName] = data => this.emit(eventName, data);
        this.target.addEventListener(eventName as string, this._emitters[eventName] as any);
    }

    protected unsubscribe(eventName: keyof TEvents) {
        this.target.removeEventListener(eventName as string, this._emitters[eventName] as any);
    }

}
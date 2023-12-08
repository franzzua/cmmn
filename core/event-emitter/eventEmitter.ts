import {EventEmitterBase} from "./eventEmitterBase";
import {getOrAdd} from "../helpers/map";
import {removeAll} from "../helpers/Array";
import {DefaultListenerOptions, EventListenerOptions} from "./common";

export class EventEmitter<TEvents extends {
    [key in string]: any | void;
}> extends EventEmitterBase<TEvents> {

    protected listeners = new Map<keyof TEvents, Array<{
        listener: (data, stop?) => void,
        options: EventListenerOptions
    }>>();

    public on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void,
                                                options: EventListenerOptions = DefaultListenerOptions) {
        const arr = getOrAdd(this.listeners, eventName, () => {
            this.subscribe(eventName);
            return [];
        });
        arr.push({listener, options: options});
        arr.sort((a, b) => b.options.Priority - a.options.Priority);
        return () => this.off(eventName, listener);
    }

    public off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void) {
        const set = getOrAdd(this.listeners, eventName, () => []);
        removeAll(set, x => x.listener === listener);
        if (set.length == 0) {
            this.listeners.delete(eventName);
            this.unsubscribe(eventName);
        }
    }

    protected subscribe(eventName: keyof TEvents) {
    }

    protected unsubscribe(eventName: keyof TEvents) {
    }

    public emit<TEventName extends keyof TEvents>(eventName: TEventName, data?: TEvents[TEventName]) {
        let arr = this.listeners.get(eventName);
        if (!arr)
            return;
        arr.slice().forEach(x => x.listener(data));
    }

    public dispose() {
        for (let [key, value] of this.listeners) {
            for (let listener of value) {
                this.off(key, listener.listener);
            }
        }
    }
}
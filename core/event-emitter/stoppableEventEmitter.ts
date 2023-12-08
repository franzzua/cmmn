import {EventEmitter} from "./eventEmitter";
import {DefaultListenerOptions, EventListenerOptions} from "./common";
import {orderBy} from "../helpers/Array";

export class StoppableEventEmitter<TEvents extends {
    [key in string]: any | void;
}> extends EventEmitter<TEvents> {
    public on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName], stop?: Function) => void,
                                                options: EventListenerOptions = DefaultListenerOptions) {
        return super.on(eventName, listener, options);
    }
    public off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName], stop?: Function) => void) {
        return super.off(eventName, listener);
    }

    public emit<TEventName extends keyof TEvents>(eventName: TEventName, data?: TEvents[TEventName]) {
        const arr = this.listeners.get(eventName);
        if (!arr)
            return;
        let isStopped = false;
        const ordered = orderBy(arr, x => x.options.Priority, true);
        const stopAction = () => isStopped = true;
        for (let i = 0; i < ordered.length; i++) {
            if (isStopped)
                return;
            ordered[i].listener(data, stopAction);
        }
    }
}
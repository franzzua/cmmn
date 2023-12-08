import {EventEmitterBase} from "./eventEmitterBase";

import {DefaultListenerOptions, EventListenerOptions} from "./common";

export class MergeListener<TEvents extends {
    [key in string]: any | void;
}> extends EventEmitterBase<TEvents> {
    constructor(private emitters: EventEmitterBase<TEvents>[]) {
        super();
    }

    on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void, options: EventListenerOptions = DefaultListenerOptions): () => void {
        const unsubscrs = this.emitters.map(x => x.on(eventName, listener, options));
        return () => unsubscrs.forEach(f => f());
    }

    off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void): void {
        this.emitters.map(x => x.off(eventName, listener));
    }

}
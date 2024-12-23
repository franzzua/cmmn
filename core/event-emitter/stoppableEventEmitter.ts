import {EventEmitter, SubscriptionOptions} from "./eventEmitter";

export class StoppableEventEmitter<TEvents extends {
    [key in string]: any | void;
}> extends EventEmitter<TEvents> {
    public on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName], stop?: Function) => void,
                                                options: SubscriptionOptions = {}) {
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
        const stopAction = () => isStopped = true;
        for (let i = 0; i < arr.length; i++) {
            if (isStopped)
                return;
            arr[i].listener(data, stopAction);
        }
    }
}
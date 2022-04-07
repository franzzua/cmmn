import {bind} from "bind-decorator";

export abstract class EventListenerBase<TEvents extends {
    [key in string]: any | void;
}> {
    public abstract on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void, options?: EventListenerOptions): () => void;

    public abstract off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void, options?: EventListenerOptions): void;

    public once<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void
                                                  , options: EventListenerOptions = DefaultListenerOptions) {
        const onceListener = data => {
            listener(data);
            this.off(eventName, onceListener, options);
        };
        this.on(eventName, onceListener, options);
        return () => this.off(eventName, onceListener, options);
    }

    public onceAsync<TEventName extends keyof TEvents>(eventName: TEventName, options: EventListenerOptions = DefaultListenerOptions): Promise<TEvents[TEventName]> {
        return new Promise(resolve => this.once(eventName, resolve, options));
    }
}

export type EventListenerOptions = {
    Priority: number,
}
const DefaultListenerOptions: EventListenerOptions = {
    Priority: 0
}

export type StoppableEvent<T> = T & {
    stop();
}

export class EventEmitter<TEvents extends {
    [key in string]: any | void;
}> extends EventListenerBase<TEvents> {

    protected listeners = new Map<keyof TEvents, Array<{ listener: (data, stop?) => void, options: EventListenerOptions }>>();

    public on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName], stop?: Function) => void,
                                                options: EventListenerOptions = DefaultListenerOptions) {
        const arr = this.listeners.getOrAdd(eventName, () => {
            this.subscribe(eventName);
            return [];
        });
        arr.push({listener, options: options});
        arr.sort((a, b) => b.options.Priority - a.options.Priority);
        return () => this.off(eventName, listener);
    }

    public off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName], stop?: Function) => void) {
        const set = this.listeners.getOrAdd(eventName, () => []);
        set.removeAll(x => x.listener === listener);
        if (set.length == 0) {
            this.listeners.delete(eventName);
            this.unsubscribe(eventName);
        }
    }

    protected subscribe(eventName: keyof TEvents) {
    }

    protected unsubscribe(eventName: keyof TEvents) {
    }

    @bind
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

    public static fromEventTarget<TEvents extends {
        [key: string]: any
    }>(target: EventTarget): EventEmitter<TEvents> {
        return new EventListener(target);
    }

    public static Merge<T>(...emitters: EventListenerBase<T>[]): EventListenerBase<T> {
        return new MergeListener(emitters);

    }

}

export class MergeListener<TEvents extends {
    [key in string]: any | void;
}> extends EventListenerBase<TEvents> {
    constructor(private emitters: EventListenerBase<TEvents>[]) {
        super();
    }

    on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void, options: EventListenerOptions = DefaultListenerOptions): () => void {
        const unsubscrs = this.emitters.map(x => x.on(eventName, listener, options));
        return () => unsubscrs.forEach(f => f());
    }

    off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void, options: EventListenerOptions = DefaultListenerOptions): void {
        this.emitters.map(x => x.off(eventName, listener, options));
    }

}

export class EventListener<TEvents extends {
    [key in string]: any | void;
}> extends EventEmitter<TEvents> {

    constructor(private target: EventTarget) {
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

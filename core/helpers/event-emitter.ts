import {bind} from "bind-decorator";

export abstract class EventListenerBase<TEvents extends {
    [key in string]: any | void;
}> {
    public abstract on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void): () => void;

    public abstract off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void): void;

    public once<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void) {
        const onceListener = data => {
            listener(data);
            this.off(eventName, onceListener);
        };
        this.on(eventName, onceListener);
        return () => this.off(eventName, onceListener);
    }

    public onceAsync<TEventName extends keyof TEvents>(eventName: TEventName): Promise<TEvents[TEventName]> {
        return new Promise(resolve => this.once(eventName, resolve));
    }
}

export type EventListenerOptions = {
    Priority: number,
}
const DefaultListenerOptions: EventListenerOptions = {
    Priority: Number.NEGATIVE_INFINITY
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
        this.listeners.getOrAdd(eventName, () => {
            this.subscribe(eventName);
            return [];
        }).push({listener, options: options});
        return () => this.off(eventName, listener);
    }

    public off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName], stop?: Function) => void) {
        const set = this.listeners.getOrAdd(eventName, () => []);
        if (set.length == 1) {
            this.listeners.delete(eventName);
            this.unsubscribe(eventName);
        } else {
            set.removeAll(x => x.listener === listener);
        }
    }

    protected subscribe(eventName: keyof TEvents) {
    }

    protected unsubscribe(eventName: keyof TEvents) {
    }

    @bind
    public emit<TEventName extends keyof TEvents>(eventName: TEventName, data?: TEvents[TEventName]) {
        let isStopped = false;
        for (const cb of (this.listeners.get(eventName) ?? []).orderBy(x => x.options.Priority, true)) {
            if (isStopped)
                return;
            cb.listener(data, () => isStopped = true);
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

    on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void): () => void {
        const unsubscrs = this.emitters.map(x => x.on(eventName, listener));
        return () => unsubscrs.forEach(f => f());
    }

    off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void): void {
        this.emitters.map(x => x.off(eventName, listener));
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

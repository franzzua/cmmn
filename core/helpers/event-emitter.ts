import {bind} from "bind-decorator";

export type EventListenerOptions = {
    Priority: number,
}
const DefaultListenerOptions: EventListenerOptions = {
    Priority: 0
}

export type StoppableEvent<T> = T & {
    stop();
}


export abstract class EventEmitterBase<TEvents extends {
    [key in string]: any | void;
}> {
    public abstract on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void, ...rest): () => void;

    public abstract off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void): void;

    public once<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void, ...rest) {
        const onceListener = data => {
            listener(data);
            this.off(eventName, onceListener);
        };
        this.on(eventName, onceListener, ...rest);
        return () => this.off(eventName, onceListener);
    }

    public onceAsync<TEventName extends keyof TEvents>(eventName: TEventName, ...rest): Promise<TEvents[TEventName]> {
        return new Promise(resolve => this.once(eventName, resolve, ...rest));
    }
}

export class EventEmitter<TEvents extends {
    [key in string]: any | void;
}> extends EventEmitterBase<TEvents> {

    protected listeners = new Map<keyof TEvents, Array<{ listener: (data, stop?) => void, options: EventListenerOptions }>>();

    public on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void,
                                                options: EventListenerOptions = DefaultListenerOptions) {
        const arr = this.listeners.getOrAdd(eventName, () => {
            this.subscribe(eventName);
            return [];
        });
        arr.push({listener, options: options});
        arr.sort((a, b) => b.options.Priority - a.options.Priority);
        return () => this.off(eventName, listener);
    }

    public off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void) {
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
        let arr = this.listeners.get(eventName);
        if (!arr)
            return;
        arr.slice().forEach(x => x.listener(data));
    }

    public static fromEventTarget<TEvents extends {
        [key: string]: any
    }>(target: EventTarget): EventEmitter<TEvents> {
        return new EventListener(target);
    }

    public static Merge<T>(...emitters: EventEmitterBase<T>[]): EventEmitterBase<T> {
        return new MergeListener(emitters);
    }

    public dispose(){
        for (let [key, value] of this.listeners) {
            for (let listener of value) {
                this.off(key, listener.listener);
            }
        }
    }
}

export class StoppableEventEmitter<TEvents extends {
    [key in string]: any | void;
}> extends EventEmitter<TEvents>{
    public on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName], stop?: Function) => void,
                                                options: EventListenerOptions = DefaultListenerOptions) {
        return super.on(eventName, listener, options);
    }

    public off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName], stop?: Function) => void) {
        return super.off(eventName, listener);
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
}

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

export class EventListener<TEvents extends {
    [key in string]: any | void;
}> extends StoppableEventEmitter<TEvents> {

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

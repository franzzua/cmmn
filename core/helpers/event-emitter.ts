import { bind } from "bind-decorator";

export class EventEmitter<TEvents extends {
    [key in string]: any | void;
}> {
    protected listeners = new Map<keyof TEvents, Set<Function>>();

    public on<TEventName extends keyof TEvents>(eventName, listener: (data: TEvents[TEventName]) => void) {
        this.listeners.getOrAdd(eventName, () => new Set()).add(listener);
        return () => this.off(eventName, listener);
    }

    public off<TEventName extends keyof TEvents>(eventName, listener: (data: TEvents[TEventName]) => void) {
        this.listeners.getOrAdd(eventName, () => new Set()).delete(listener);
    }

    public once<TEventName extends keyof TEvents>(eventName, listener: (data: TEvents[TEventName]) => void) {
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

    @bind
    public emit<TEventName extends keyof TEvents>(eventName: TEventName, data: TEvents[TEventName]) {
        this.listeners.get(eventName)?.forEach(cb => cb(data));
    }

    public static fromEventTarget<TEvents extends {
        [key: string]: any
    }>(target: EventTarget): EventEmitter<TEvents>{
        return new EventListener(target);
    }

}

export class EventListener<TEvents extends {
    [key in string]: any | void;
}> extends EventEmitter<TEvents> {

    constructor(private target: EventTarget) {
        super();
    }


    public on<TEventName extends keyof TEvents>(eventName, listener: (data: TEvents[TEventName]) => void) {
        const unsubscr = super.on(eventName, listener);
        if (this.listeners.get(eventName).size == 1) {
            this.subscribe(eventName);
        }
        return unsubscr;
    }

    public off<TEventName extends keyof TEvents>(eventName, listener: (data: TEvents[TEventName]) => void) {
        super.off(eventName, listener);
        if (this.listeners.get(eventName).size == 0) {
            this.unsubscribe(eventName);
        }
    }

    private _emitters: {
        [key in keyof TEvents]?: Function
    } = {

    }

    protected subscribe(eventName: keyof TEvents) {
        if (!this._emitters[eventName])
            this._emitters[eventName] = data => this.emit(eventName, data);
        this.target.addEventListener(eventName as string, this._emitters[eventName] as any);
    }

    protected unsubscribe(eventName: keyof TEvents) {
        this.target.removeEventListener(eventName as string, this._emitters[eventName] as any);
    }
}

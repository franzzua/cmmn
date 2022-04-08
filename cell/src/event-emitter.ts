
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

    protected listeners = new Map<keyof TEvents, Set<(data) => void>>();

    public on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void) {
        let set = this.listeners.get(eventName);
        if (!set){
            set = new Set();
            this.listeners.set(eventName, set);
            this.subscribe(eventName);
        }
        set.add(listener);
        return () => this.off(eventName, listener);
    }

    public off<TEventName extends keyof TEvents>(eventName?: TEventName, listener?: (data: TEvents[TEventName]) => void) {
        if (!eventName){
            for (let eventName of this.listeners.keys()) {
                this.unsubscribe(eventName);
            }
            this.listeners.clear();
        }
        const set = this.listeners.get(eventName);
        if (!set)
            return;
        set.delete(listener);
        if (set.size == 0) {
            this.listeners.delete(eventName);
            this.unsubscribe(eventName);
        }
    }

    protected subscribe(eventName: keyof TEvents) {
    }

    protected unsubscribe(eventName: keyof TEvents) {
    }

    public emit<TEventName extends keyof TEvents>(eventName: TEventName, data?: TEvents[TEventName]) {
        const arr = this.listeners.get(eventName);
        if (!arr)
            return;
        for (let listener of arr) {
            listener(data);
        }
    }

}
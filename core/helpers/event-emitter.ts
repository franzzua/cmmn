export class EventEmitter<TEvents extends {
    [key in string]: any | void;
}> {
    protected listeners = new Map<keyof TEvents, Set<Function>>();

    public on<TEventName extends keyof TEvents>(eventName, listener: (data: TEvents[TEventName]) => void) {
        this.listeners.getOrAdd(eventName, () => new Set()).add(listener);
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
    }

    public onceAsync<TEventName extends keyof TEvents>(eventName: TEventName): Promise<TEvents[TEventName]> {
        return new Promise(resolve => this.once(eventName, resolve));
    }

    public emit<TEventName extends keyof TEvents>(eventName: TEventName, data: TEvents[TEventName]) {
        this.listeners.get(eventName)?.forEach(cb => cb(data));
    }
}

export abstract class EventEmitterBase<TEvents extends {
    [key in string]: any | void;
} = {}> {
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
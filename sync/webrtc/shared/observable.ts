export class EventEmitter<T extends {
    [event: string]: any;
} = {}> {

    private listeners = new Map<keyof T, Set<Function>>();

    public on<TEventName extends keyof T>(event: TEventName, listener: (data: T[TEventName]) => void | any) {
        this.listeners.getOrAdd(event, () => new Set()).add(listener);
    }

    public once<TEventName extends keyof T>(event: TEventName, listener: (data: T[TEventName]) => void | any) {
        const onceListener = data => {
            this.off(event, onceListener);
            listener(data);
        }
        return this.on(event, onceListener);
    }

    public off<TEventName extends keyof T>(event: TEventName, listener: (data: T[TEventName]) => void | any) {
        this.listeners.get(event)?.delete(listener);
    }


    public emit<TEventName extends keyof T>(event: TEventName, data?: T[TEventName]) {
        this.listeners.get(event)?.forEach(listener => listener(data));
    }

    public dispose() {
        this.listeners.clear();
    }
}
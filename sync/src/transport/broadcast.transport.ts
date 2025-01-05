import {Transport, TransportChannel} from "./transport";
import {EventEmitter, EventEmitterBase, singleton} from "@cmmn/core";

declare const BroadcastChannel: EventTarget & (new(name: string) => typeof BroadcastChannel) & {
    postMessage(message: any): void;
    close(): void;
};

export abstract class DOMTransport<T extends Record<string, any>> extends EventEmitterBase<T> implements Transport<T> {

    private channels: {
        [TKey in keyof T]?: EventTargetTransportChannel<T[TKey]>
    } = {};

    protected abstract getTransport(name: keyof T): EventTargetTransport;

    public getChannel<TKey extends keyof T>(channel: TKey): TransportChannel<T[TKey]> {
        return this.channels[channel] ??= new EventTargetTransportChannel<T>(
            () => this.getTransport(channel)
        );
    }

    on<TEventName extends keyof T>(eventName: TEventName, listener: (data: T[TEventName]) => void, ...rest): () => void {
        return this.getChannel(eventName).on('message', listener);
    }

    off<TEventName extends keyof T>(eventName: TEventName, listener: (data: T[TEventName]) => void) {
        this.getChannel(eventName).off('message', listener);
    }

    broadcast<TKey extends keyof T>(channel: TKey, message: T[TKey]): void {
        this.getChannel(channel).broadcast(message);
    }

}

@singleton()
export class BroadcastTransport<T extends Record<string, any>> extends DOMTransport<T> {

    protected getTransport(name: keyof T): EventTargetTransport{
        return new BroadcastChannel(name as string);
    }

}


export type EventTargetTransport = EventTarget & {
    postMessage(message: any): void;
    close(): void;
};


export class EventTargetTransportChannel<T> extends EventEmitter<{
    message: T
}> implements TransportChannel<T> {

    private target: EventTargetTransport | undefined;

    private create(): EventTargetTransport {
        const result = this.factory();
        result.addEventListener('close', () => {
            this.target = undefined;
            if (this.listeners.get('message')?.length) {
                this.subscribe('message');
            }
        });
        return result;
    }

    private get instance() {
        return this.target ??= this.create();
    }

    constructor(private factory: () => EventTargetTransport) {
        super();
    }

    broadcast(message: T) {
        this.instance.postMessage(message);
    }

    protected subscribe(eventName: keyof { message: T }) {
        super.subscribe(eventName);
        this.instance.addEventListener('message', this.listener);
    }

    protected unsubscribe(eventName: keyof { message: T }) {
        super.subscribe(eventName);
        this[Symbol.dispose]();
    }

    private listener = (event: Event) => {
        this.emit('message', (event as any).data)
    }

    [Symbol.dispose]() {
        if (!this.target) return;
        this.target.removeEventListener('message', this.listener);
        this.target.close();
        this.target = undefined;
    }
}
import {Transport} from "./transport";
import {singleton} from "@cmmn/core";

declare const BroadcastChannel: EventTarget & (new(name: string) => typeof BroadcastChannel) & {
    postMessage(message: any): void;
    close(): void;
};
@singleton()
export class BroadcastTransport<T> extends Transport<T> {

    private channels: Record<string, typeof BroadcastChannel> = {};
    private _listeners: Record<string, (e: Event) => void> = {};

    constructor() {
        super();
    }
    private getOrCreate(channel: string) {
        return this.channels[channel] ??= new BroadcastChannel(channel);
    }

    send(channel: string, message: T): void {
        this.getOrCreate(channel).postMessage(message);
        this.emit(channel, message);
    }

    protected subscribe(channel: string) {
        this.getOrCreate(channel).addEventListener('message', this._listeners[channel] = (e) => {
            this.emit(channel, (e as any as MessageEvent).data);
        });
    }

    protected unsubscribe(channel: string) {
        if (!this._listeners[channel]) return;
        this.getOrCreate(channel).removeEventListener('message', this._listeners[channel]);
        this.getOrCreate(channel).close();
        delete this.channels[channel];
        delete this._listeners[channel];
    }

}
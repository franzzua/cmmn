import {WorkerMessage, WorkerMessageSerialized, WorkerMessageType} from "../shared/types";
import {deserialize, EventEmitter, ResolvablePromise, serialize} from "@cmmn/core";
import {Transferable} from "./transferable";


/**
 *  @param target
 *    For Main-thread execution context:
 *      Worker | Window | SharedWorker | ServiceWorkerContainer
 *
 *    For OtherSide-thread execution context, usually this is reference inside 'self' variable:
 *      DedicatedWorkerGlobalScope | WindowProxy | SharedWorkerGlobalScope | ServiceWorkerGlobalScope
 */
export class BaseStream extends EventEmitter<{
    message: WorkerMessage["data"]
}> {
    private useBinary = true;
    private performanceDiff = 0;
    public Connected = new ResolvablePromise<void>();

    constructor(private target: Worker | typeof globalThis | Window) {
        super();

        // only for performance measurement
        this.Connected.then(() => this.target.postMessage({
            origin: performance.timeOrigin
        } as WorkerMessage));

        this.target.addEventListener('message', this.onMessage);
        this.target.addEventListener('messageerror', this.onMessageError);

        if (!(this.target instanceof Worker))
            this.Connected.resolve();
    }

    onMessage(event: MessageEvent<WorkerMessage | WorkerMessageSerialized>) {
        if (event.data.origin) {
            this.performanceDiff = -performance.timeOrigin + event.data.origin;
            return;
        }
        // if ('buffer' in event.data) {
        //     this.SharedArrayBuffers.set(event.data.id, event.data.buffer);
        //     return;
        // }
        // const buffer = this.SharedArrayBuffers.get(event.data.data.bufferId);
        // try {
        const message = this.useBinary
            ? Transferable.Join<WorkerMessage["data"]>(deserialize(event.data.data as Uint8Array), event.data.transferables)
            : event.data.data as WorkerMessage["data"];
        // const sendTime = performance.now() - event.data.start - this.performanceDiff;
        // console.log('send time:', sendTime, message);
        // if (sendTime > 50){
        //     console.warn(message);
        // }
        // console.log(event.data.data, message);
        if (message.type === WorkerMessageType.Connected)
            this.Connected.resolve();
        else
            this.emit('message', message);
        // } catch (e) {
        //     console.error(e);
        //     console.log('error', event.data.data, uint8);
        // }
    }

    onMessageError(event) {
        console.error(`BaseStream ${this.target}. Error receiving from "messageerror" listener:`, event);
    }


    // public SharedArrayBuffers = new Map<string, SharedArrayBuffer>();
    // public ArrayBuffers = new Map<ArrayBuffer, string>();

    public async send(message: WorkerMessage["data"]) {
        await this.Connected;
        const start = performance.now();
        const transferables = Transferable.Split(message);
        const data = this.useBinary ? serialize(message) : message;
        // console.log('send:', message);
        // const info = {
        //     length: data.byteLength,
        //     offset: data.byteOffset,
        //     bufferId: undefined
        // };
        // if (!this.ArrayBuffers.has(data.buffer)) {
        //     const shared = new SharedArrayBuffer(data.buffer.byteLength);
        //     info.offset = 0;
        //     info.length = data.length;
        //     const id = Fn.ulid();
        //     this.ArrayBuffers.set(data.buffer, id);
        //     this.SharedArrayBuffers.set(id, shared);
        //     this.target.postMessage({id: id, buffer: shared}, {});
        // }
        // info.bufferId = this.ArrayBuffers.get(data.buffer);
        // const shared = this.SharedArrayBuffers.get(info.bufferId);
        // const source = new Uint8Array(data.buffer, info.offset, info.length);
        // const target = new Uint8Array(shared, info.offset, info.length);
        // for (let index = info.offset; index < info.length; index++){
        //     Atomics.store(target, index, source[index]);
        // }
        // console.log(info, message, source);

        try {
            this.target.postMessage({
                data, transferables, start
            } as WorkerMessage, {
                transfer: transferables
            });
        } catch (err) {
            const about = `BaseStream ${this.target}`;
            switch (err.name) {
                case 'DataCloneError':
                    // debugger;
                    console.error(`${about}. Could not clone`, err.message, message);
                    break;
                default:
                    console.error(`${about}. Failed to postMessage`, err, message);
            }
        }
    }

    dispose() {
        this.target.removeEventListener('message', this.onMessage);
        this.target.removeEventListener('messageerror', this.onMessageError);
        super.dispose();
    }

}

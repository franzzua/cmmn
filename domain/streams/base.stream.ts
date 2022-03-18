import {WorkerMessage, WorkerMessageSerialized, WorkerMessageType} from "../shared/types";
import {deserialize, EventEmitter, Fn, ResolvablePromise, serialize} from "@cmmn/core";
import {Transferable} from "./transferable";

export class BaseStream extends EventEmitter<{
    message: WorkerMessage["data"]
}> {

    constructor(private target: Worker | typeof globalThis) {
        super();
        this.target.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
            // if ('buffer' in event.data) {
            //     this.SharedArrayBuffers.set(event.data.id, event.data.buffer);
            //     return;
            // }
            // const buffer = this.SharedArrayBuffers.get(event.data.data.bufferId);
            // try {
            const message = event.data.data;//Transferable.Join(deserialize(event.data.data), event.data.transferables) as WorkerMessage["data"];
            // console.log(event.data.data, message);
            if (message.type === WorkerMessageType.Connected)
                this.Connected.resolve();
            else
                this.emit('message', message);
            // } catch (e) {
            //     console.error(e);
            //     console.log('error', event.data.data, uint8);
            // }
        });
        if (!(this.target instanceof Worker))
            this.Connected.resolve();
    }

    public Connected = new ResolvablePromise<void>();

    // public SharedArrayBuffers = new Map<string, SharedArrayBuffer>();
    // public ArrayBuffers = new Map<ArrayBuffer, string>();

    public async send(message: WorkerMessage["data"]) {
        const transferables = Transferable.Extract(message);
        await this.Connected;
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
                data: message, transferables
            } as WorkerMessage, {
                transfer: transferables
            });
        } catch (err) {
            switch (err.name) {
                case 'DataCloneError':
                    // debugger;
                    console.log('could not clone', err.message, message);
                    break;
            }
        }
    }
}
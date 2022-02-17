import {cell, deserialize, Fn, serialize} from "@cmmn/core";
import {Cell, cellx} from "cellx";

import {Stream} from "./stream";
import {Action, ModelPath, WorkerMessage, WorkerMessageType} from "../shared/types";

export class WorkerStream extends Stream {
    constructor(private workerUrl: string) {
        super();
        this.$messages.subscribe((err, evt) => {
            const message = evt.data.value.data as WorkerMessage;
            if (message.type !== WorkerMessageType.State)
                return;
            const cell = this.models.getOrAdd(this.pathToStr(message.path), x => new Cell(undefined));
            const state = deserialize(message.state);
            // console.log(this.pathToStr(message), state);
            cell.set(state);
        })
    }

    private pathToStr(path: ModelPath) {
        return path.join(':');
    }

    private _worker: Worker;
    public Connected = new Promise<void>(resolve => {
        this.Worker.addEventListener('message', (msg: MessageEvent<WorkerMessage>) => {
            if (msg.data.type === WorkerMessageType.Connected) {
                resolve();
            }
        })
    })

    protected get Worker() {
        return this._worker ?? (this._worker = new Worker(this.workerUrl));
    }

    private $messages = cell.fromEvent<MessageEvent<WorkerMessage>>(this.Worker, "message");
    private models = new Map<string, Cell>();


    async Invoke(action: Action) {
        const actionId = Fn.ulid();
        this.postMessage({type: WorkerMessageType.Action, ...action, actionId, args: action.args.map(serialize)});
        return new Promise((resolve, reject) => this.$messages.subscribe((err, evt) => {
            const message = evt.data.value.data as WorkerMessage;
            if (message.type !== WorkerMessageType.Response)
                return;
            if (message.actionId !== actionId)
                return;
            if (message.error)
                reject(deserialize(message.error));
            else
                resolve(deserialize(message.response));
        }))
    }

    getCell<T>(path: ModelPath) {
        const cell = this.models.getOrAdd(this.pathToStr(path), x => {
            this.postMessage({
                type: WorkerMessageType.Subscribe,
                path,
            });
            return new Cell<T>(undefined as any);
        });
        return cellx<T>(() => cell.get(), {
            put: (_: any, state: T) => {
                cell.set(state);
                this.postMessage({
                    type: WorkerMessageType.State,
                    path,
                    state: serialize(state)
                });
            }
        })
    }

    private postMessage(msg: WorkerMessage) {
        this.Connected.then(() => {
            try {
                this.Worker.postMessage(msg);
            } catch (err) {
                switch (err.name) {
                    case 'DataCloneError':
                        debugger;
                        console.log('could not clone', msg);
                        break;
                }
            }
        });
    }
}


import {Fn} from "@cmmn/core";
import {Cell, cellx} from "cellx";
import {Stream} from "./stream";
import {Action, ModelPath, WorkerMessage, WorkerMessageType} from "../shared/types";
import {BaseStream} from "./base.stream";


export class WorkerStream extends Stream {
    constructor(private workerUrl: string) {
        super();
        this.BaseStream.on('message', message => {
            if (message.type !== WorkerMessageType.State)
                return;
            const cell = this.models.getOrAdd(this.pathToStr(message.path), x => new Cell(undefined));
            // console.log(this.pathToStr(message), state);
            cell.set(message.state);
        })
    }

    private pathToStr(path: ModelPath) {
        return path.join(':');
    }

    private _baseStream: BaseStream;

    protected get BaseStream() {
        return this._baseStream ?? (this._baseStream = new BaseStream(new Worker(this.workerUrl)));
    }

    private models = new Map<string, Cell>();

    async Invoke(action: Action) {
        const actionId = Fn.ulid();
        this.postMessage({type: WorkerMessageType.Action, ...action, actionId});
        return new Promise((resolve, reject) => this.BaseStream.on('message', message => {
            if (message.type !== WorkerMessageType.Response)
                return;
            if (message.actionId !== actionId)
                return;
            if (message.error)
                reject(message.error);
            else
                resolve(message.response);
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
                    state
                });
            }
        })
    }

    private postMessage(msg: WorkerMessage["data"]) {
        this.BaseStream.send(msg);
    }
}


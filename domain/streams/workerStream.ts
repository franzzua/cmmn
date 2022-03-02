import {Fn} from "@cmmn/core";
import {Cell, cellx, EventEmitter} from "cellx";
import {Stream} from "./stream";
import {Action, ModelPath, WorkerMessage, WorkerMessageType} from "../shared/types";
import {BaseStream} from "./base.stream";


export class WorkerStream extends Stream {
    constructor(private workerUrl: string) {
        super();
        this.BaseStream.on('message', message => {
            if (message.type !== WorkerMessageType.State)
                return;
            const cell = this.models.get(this.pathToStr(message.path));
            // console.log(this.pathToStr(message), state);
            cell.setVersion(message.version, message.state);
        })
    }

    private pathToStr(path: ModelPath) {
        return path.join(':');
    }

    private _baseStream: BaseStream;

    protected get BaseStream() {
        return this._baseStream ?? (this._baseStream = new BaseStream(new Worker(this.workerUrl)));
    }

    private models = new Map<string, VersionState<any>>();

    async Invoke(action: Action) {
        const actionId = Fn.ulid();
        const model = this.models.get(this.pathToStr(action.path));
        model.up();
        this.postMessage({
            type: WorkerMessageType.Action,
            ...action,
            version: model.Version,
            actionId
        });
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
            return new VersionState<T>();
        });

        return cellx<T>(() => cell.get(), {
            put: (_: any, state: T) => {
                cell.set(state);
                cell.up();
                this.postMessage({
                    type: WorkerMessageType.State,
                    path,
                    state,
                    version: cell.Version,
                });
            }
        })
    }

    private postMessage(msg: WorkerMessage["data"]) {
        this.BaseStream.send(msg);
    }
}

export class VersionState<T> extends Cell<T> {
    private states = new Map<string, T>();

    public Version: string;

    constructor() {
        super(undefined);
    }

    public up() {
        this.Version = Fn.ulid();
        this.states.set(this.Version, this._value);
    }

    setVersion(version: string, state: T) {
        if (!this.states.has(version)){
            super.set(state);
        }
        const existed = this.states.get(version);
        this.states.delete(version);
        if (Fn.compare(state, existed))
            return;
        if (!this.states.size) {
            super.set(state);
            return;
        }
        this.applyDiff(existed, state);
    }

    private applyDiff(oldValue: T, newValue: T): any{
        // TODO: implement
    }
}
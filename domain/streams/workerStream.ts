import {Fn, ResolvablePromise} from "@cmmn/core";
import {BaseCell} from "@cmmn/cell";
import {Stream} from "./stream";
import {Action, ModelPath, WorkerMessage, WorkerMessageType} from "../shared/types";
import {BaseStream} from "./base.stream";
import {VersionState} from "./versionState";


export class WorkerStream extends Stream {

    constructor(private workerUrl: string) {
        super();
        this.BaseStream.on('message', message => {
            if (message.type == WorkerMessageType.Response) {
                const promise = this.responses.get(message.actionId);
                this.responses.delete(message.actionId);
                if (message.error)
                    promise?.reject(message.error);
                else
                    promise?.resolve(message.response);
                return;
            }
            if (message.type !== WorkerMessageType.State)
                return;
            const cell = this.models.get(this.pathToStr(message.path));
            // console.log(this.pathToStr(message), state);
            cell.setRemote(message.version, message.state);
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
    private responses = new Map<string, ResolvablePromise<void>>();

    async Invoke(action: Action) {
        const actionId = Fn.ulid();
        const version = this.models.get(this.pathToStr(action.path)).localVersion;
        this.postMessage({
            type: WorkerMessageType.Action,
            ...action,
            version: action.version,
            actionId
        });
        return this.responses.getOrAdd(actionId, () => new ResolvablePromise());
    }

    getCell<T>(path: ModelPath) {
        const cell = this.models.getOrAdd(this.pathToStr(path), x => {
            this.postMessage({
                type: WorkerMessageType.Subscribe,
                path,
            });
            return new VersionState();
        });
        // cell.on('change', ({value})=>{
        //     this.postMessage({
        //         type: WorkerMessageType.State,
        //         path,
        //         state: value,
        //         version: null,
        //     });
        // })
        return cell;
    }

    private postMessage(msg: WorkerMessage["data"]) {
        this.BaseStream.send(msg);
    }
}


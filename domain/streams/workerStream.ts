import {Fn, Lazy, ResolvablePromise} from "@cmmn/core";
import {Stream} from "./stream";
import {Action, ModelPath, WorkerMessage, WorkerMessageType} from "../shared/types";
import {BaseStream} from "./base.stream";
import {VersionState} from "./versionState";

/**
 * Stream находится на стороне Main-thread и связан с воркером.
 * Со стороны Worker-thread работает WorkerEntry.
 */
export class WorkerStream extends Stream {

    private models = new Map<string, VersionState<any>>();
    private responses = new Map<string, ResolvablePromise<void>>();

    constructor(protected target: Worker | Window) {
        super();
        this.BaseStream.on('message', message => {
            if (message.type == WorkerMessageType.Response) {
                const promise = this.responses.get(message.actionId);
                if (!promise) {
                    console.error('Response not found', message);
                    throw new Error('WorkerStream');
                }
                this.responses.delete(message.actionId);
                if (message.error)
                    promise.reject(message.error);
                else
                    promise.resolve(message.response);
                return;
            }
            if (message.type !== WorkerMessageType.State)
                return;
            const cell = this.models.get(this.pathToStr(message.path));
            // console.log(this.pathToStr(message), state);
            cell.setRemote(message.version, message.state);
        })
    }

    @Lazy
    protected get BaseStream() {
        return new BaseStream(this.target);
    }

    private postMessage(msg: WorkerMessage['data']) {
        this.BaseStream.send(msg);
    }

    private pathToStr(path: ModelPath) {
        return path.join(':');
    }


    // @log((self,args: [Action], result) => ({
    //     message: [...args[0].path, args[0].action].join(':'),
    //     result
    // }))
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
            return new VersionState({
                onExternal: state => this.postMessage({
                    type: WorkerMessageType.State,
                    path, state, version: null,
                })
            });
        });
        // cell.on('change', ({value})=>{
        //
        // })
        return cell;
    }

}


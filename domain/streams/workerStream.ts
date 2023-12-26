import {Fn, getOrAdd, Lazy, ResolvablePromise} from '@cmmn/core';
import {Action, ModelPath, WorkerMessage, WorkerMessageType} from '../shared/types.js';
import {VersionState} from './versionState.js';
import {BaseStream} from './base.stream.js';
import {Stream} from './stream.js';
import {Cell} from "@cmmn/cell";

/**
 * Находится на стороне Main-thread.
 */
export class WorkerStream extends Stream {

    private models = new Map<string, VersionState<any>>();
    private responses = new Map<string, ResolvablePromise<void>>();

    constructor(protected target: Worker | Window | MessagePort) {
        super();
        this.BaseStream.on('message', message => {
            if (message.type === WorkerMessageType.Response) {
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
            if (message.type === WorkerMessageType.Disconnect) {
                this.onDisconnect();
                return;
            }
            if (message.type !== WorkerMessageType.State) {
                return;
            }
            const cell = this.models.get(this.pathToStr(message.path));
            // console.log(this.pathToStr(message), state);
            cell.setRemote(message.version, message.state);
        })
    }

    @Lazy
    protected get BaseStream() {
        return new BaseStream(this.target);
    }

    protected postMessage(msg: WorkerMessage['data']) {
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
        return getOrAdd(this.responses, actionId, () => new ResolvablePromise());
    }

    getCell<T>(path: ModelPath) {
        return getOrAdd(this.models, this.pathToStr(path), x => {
            this.postMessage({
                type: WorkerMessageType.Subscribe,
                path,
            });
            const vs = new VersionState();
            Cell.OnChange(() => vs.localState, e => this.postMessage({
                type: WorkerMessageType.State,
                path, state: e.value, version: vs.localVersion,
            }))
            return vs;
        });
    }

    protected onDisconnect() {

    }

}


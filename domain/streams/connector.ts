import {BaseStream} from "./base.stream";
import type {Model, ModelLike} from "../worker";
import {ModelAction, ModelPath, WorkerAction, WorkerMessage, WorkerMessageType} from "../shared/types";
import {EventEmitter, Fn} from "@cmmn/core";
import {BaseCell, Cell} from "@cmmn/cell";
import {Locator} from "../shared/locator";

/**
 * Работает на стороне Worker-thread.
 */
export class Connector<TEvents extends {
    disconnect: void;
} = { disconnect: void }> extends EventEmitter<TEvents> {
    constructor(protected baseStream: BaseStream,
                protected locator: Locator) {
        super();
        this.baseStream.on('message', message => {
            switch (message.type) {
                case WorkerMessageType.Subscribe:
                    const path = message.path;
                    const x = this.getModel(path);
                    if (!x)
                        throw new Error(`Model not found at path ${path.join(':')}`)
                    this.onDispose = x.cell.on('change', ({value}) => {
                        // model.$version = Fn.ulid();
                        this.postMessage({
                            path,
                            type: WorkerMessageType.State,
                            state: value,
                            version: x.version
                        });
                    });
                    const state = x.model.State;
                    this.postMessage({
                        path,
                        type: WorkerMessageType.State,
                        version: x.version,
                        state
                    });
                    break;
                case WorkerMessageType.State: {
                    const x = this.getModel(message.path);
                    x.model.State = message.state
                    x.version = message.version;
                    break;
                }
                case WorkerMessageType.Action: {
                    const x = this.getModel<any, any>(message.path);
                    this.Action(x.model, message).then(response => {
                        return ({response: (response)});
                    })
                        .catch(error => {
                            console.error(error);
                            return ({error: ('domain error')});
                        })
                        .then(responseOrError => {
                            x.version = message.version;
                            this.postMessage({
                                type: WorkerMessageType.Response,
                                actionId: message.actionId,
                                version: message.version,
                                ...responseOrError
                            });
                        });
                    break;
                }
            }
        })
    }


    private Action(model: ModelLike<any, any>, action: WorkerAction) {
        try {
            return (model.Actions ?? model)[action.action](...action.args);
        } catch (e) {
            console.log('failed action:', model, action.action, action.args);
            throw e;
        }
    }

    private postMessage(message: WorkerMessage["data"]) {
        this.baseStream.send(message);
    }

    private cache = new Map<string, ModelCell<any, any>>();

    private getModel<TState, TActions extends ModelAction>(path: ModelPath): ModelCell<TState, TActions> {
        return  this.cache.getOrAdd(path.join(':'), () => {
            const model = this.locator.get<TState, TActions>(path);
            const cell = new Cell<TState>(() => model.State, {
                // put: state => model.State = state
            });
            return {
                model, cell, version: Fn.ulid()
            }
        });
    }

    private toDispose: Function[] = [];

    protected set onDispose(value) {
        this.toDispose.push(value);
    }

    public dispose() {
        this.emit('disconnect');
        this.baseStream.dispose();
        this.toDispose.forEach(f => f());
        super.dispose();
    }
}

type ModelCell<TState, TActions extends ModelAction> = {
    model: ModelLike<TState, TActions>;
    cell: BaseCell<TState>;
    version: string;
}

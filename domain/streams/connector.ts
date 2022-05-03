import {BaseStream} from "./base.stream";
import type {ModelProxy} from "../modelProxy";
import type {Model} from "../worker";
import {ModelAction, ModelPath, WorkerAction, WorkerMessage, WorkerMessageType} from "../shared/types";
import {EventEmitter} from "@cmmn/core";

export class Connector<TEvents extends {
    disconnect: void;
} = {disconnect: void}> extends EventEmitter<TEvents>{
    constructor(protected baseStream: BaseStream,
                protected model: ModelProxy<any> | Model<any>) {
        super();
        this.postMessage({
            type: WorkerMessageType.Connected,
        });
        this.baseStream.on('message', message => {
            switch (message.type) {
                case WorkerMessageType.Subscribe:
                    const path = message.path;
                    const model = this.getModel(path);
                    if (!model)
                        throw new Error(`Model not found at path ${path.join(':')}`)
                    this.onDispose = model.$state.on('change', ({value}) => {
                        // model.$version = Fn.ulid();
                        this.postMessage({
                            path,
                            type: WorkerMessageType.State,
                            state: value,
                            version: model.$version
                        });
                    });
                    const state = model.State;
                    this.postMessage({
                        path,
                        type: WorkerMessageType.State,
                        version: model.$version,
                        state
                    });
                    break;
                case WorkerMessageType.State: {
                    const model = this.getModel(message.path);
                    model.$remoteSetter = true;
                    model.$state.set(message.state);
                    model.$version = message.version;
                    model.$remoteSetter = false;
                    break;
                }
                case WorkerMessageType.Action: {
                    const model = this.getModel<any, any>(message.path);
                    this.Action(model, message).then(response => {
                        return ({response: (response)});
                    })
                        .catch(error => {
                            console.error(error);
                            return ({error: ('domain error')});
                        })
                        .then(responseOrError => {
                            model.$version = message.version;
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


    private Action(model: Model<any>, action: WorkerAction) {
        try {
            return model.Actions[action.action](...action.args);
        } catch (e) {
            console.log('failed action:', model, action.action, action.args);
            throw e;
        }
    }

    private postMessage(message: WorkerMessage["data"]) {
        this.baseStream.send(message);
    }

    private getModel<TState, TActions extends ModelAction>(path: ModelPath): Model<TState, TActions> {
        return this.model.QueryModel<TState, TActions>(path);
    }

    private toDispose: Function[] = [];

    protected set onDispose(value){
        this.toDispose.push(value);
    }

    public dispose(){
        this.emit('disconnect');
        this.baseStream.dispose();
        this.toDispose.forEach(f => f());
        super.dispose();
    }
}
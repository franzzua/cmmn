import {IFactory} from "../shared/factory";
import {AsyncQueue, Fn, Injectable} from "@cmmn/core";
import {ModelAction, ModelPath, WorkerAction, WorkerMessage, WorkerMessageType} from "../shared/types";
import {Model} from "./model";
import {BaseStream} from "../streams/base.stream";

@Injectable()
export class WorkerEntry {

    private baseStream = new BaseStream(self);

    constructor(private factory: IFactory) {
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
                    model.$state.on('change', state => {
                        model.$version = Fn.ulid();
                        this.postMessage({
                            path,
                            type: WorkerMessageType.State,
                            state: state,
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
                            this.postMessage({
                                type: WorkerMessageType.Response,
                                actionId: message.actionId,
                                version: model.$version,
                                ...responseOrError
                            });
                        });
                    break;
                }
            }
        })
    }


    private Action(model: Model<any>, action: WorkerAction) {
        return model.Actions[action.action](...action.args);
    }

    private postMessage(message: WorkerMessage["data"]) {
        this.baseStream.send(message);
    }

    private getModel<TState, TActions extends ModelAction>(path: ModelPath): Model<TState, TActions> {
        return this.factory.GetModel<TState, TActions>(path);
    }
}



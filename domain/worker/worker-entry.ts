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
                    model.$state.subscribe((err, evt) => {
                        model.$version = Fn.ulid();
                        const state = evt.data.value;
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
                    model.$state(message.state);
                    model.$version = message.version;
                    break;
                }
                case WorkerMessageType.Action:
                    this.Action(message);

                    break;
            }
        })
    }

    private asyncQueue = new AsyncQueue();

    private Action(action: WorkerAction) {
        const model = this.getModel<any, any>(action.path);
        const result = this.asyncQueue.Invoke(() => {
            model.$version = action.version;
            return model.Actions[action.action](...action.args);
        });
        result.then(response => {
            return ({response: (response)});
        })
            .catch(error => {
                console.error(error);
                return ({error: ('domain error')});
            })
            .then(responseOrError => {
                this.postMessage({
                    type: WorkerMessageType.Response,
                    actionId: action.actionId,
                    version: model.$version,
                    ...responseOrError
                });
            });
    }

    private postMessage(message: WorkerMessage["data"]) {
        this.baseStream.send(message);
    }

    private getModel<TState, TActions extends ModelAction>(path: ModelPath): Model<TState, TActions> {
        return this.factory.GetModel<TState, TActions>(path);
    }
}



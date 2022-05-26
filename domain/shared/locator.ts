import {ModelAction, ModelLike, ModelPath} from "./types";

export abstract class Locator {

    abstract get<TState, TActions extends ModelAction>(path: ModelPath, modelType?: {
        new(...args): { State: TState; Actions: TActions }
    }): ModelLike<TState, TActions>;
}


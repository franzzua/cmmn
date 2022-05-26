import {ModelAction, ModelLike, ModelPath} from "../shared/types";

export abstract class Locator {

    public abstract get<TState, TActions extends ModelAction>(path: ModelPath): ModelLike<TState, TActions>;
}
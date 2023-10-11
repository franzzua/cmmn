import {Container, Injectable} from "@cmmn/core";
import {Stream} from "../streams/stream.js";
import {ModelAction, ModelLike, ModelPath} from "../shared/types.js";
import {ModelProxy} from "./modelProxy.js";
import {Locator} from "../shared/locator.js";

@Injectable()
export class EntityLocator implements Locator {
    constructor(private stream: Stream, private container: Container) {
    }

    private cache = new Map<string, ModelLike<any, any>>();

    public get<TState, TActions extends ModelAction>(path: ModelPath, modelType: {
        new(...args): ModelLike<TState, TActions>;
    } = ModelProxy): ModelLike<TState, TActions> {
        return this.cache.getOrAdd(path.join(':'), () => {
            const subStream = this.stream.getSubStream(path);
            return this.container.get<ModelLike<TState, TActions>>(modelType, [
                {provide: Stream, useValue: subStream},
                {provide: Locator, useValue: this.getSubLocator(path)}
            ]);
        });
    }

    protected getSubLocator(path: ModelPath) {
        return new SubLocator(this, path)
    }
}

export class SubLocator implements Locator {
    constructor(public rootLocator: EntityLocator, public path: ModelPath) {
    }

    get<TState, TActions extends ModelAction>(path: ModelPath, modelType: {
        new(...args): { State: TState; Actions: TActions }
    }): ModelLike<TState, TActions> {

        /**
         * Может так оказаться, что запрашиваемая модель находится
         * по пути относительно НЕ this.path этого SubLocator'а.
         * Например, такие запросы могут приходить из Child-окна в Parent-окно.
         */
        let isOutside = this.path.length === 0;
        if (!isOutside) {
            isOutside = (
                path.length >= this.path.length
                && this.path.every((x, i) => x === path[i])
            );
        }
        return this.rootLocator.get(
            isOutside ? path : this.path.concat(path),
            modelType
        );
    }

}

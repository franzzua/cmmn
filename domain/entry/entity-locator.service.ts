import {Container, Injectable} from "@cmmn/core";
import {Stream} from "../streams/stream";
import {ModelAction, ModelLike, ModelPath} from "../shared/types";
import {ModelProxy} from "./modelProxy";
import {Locator} from "../shared/locator";

@Injectable()
export class EntityLocator implements Locator {
    constructor(private stream: Stream, private container: Container) {
    }

    private cache = new Map<string, { State; Actions; }>();

    public get<TState, TActions extends ModelAction>(path: ModelPath, modelType: {
        new(...args): { State: TState, Actions: TActions };
    } = ModelProxy): ModelLike<TState, TActions> {
        return this.cache.getOrAdd(path.join(':'), () => {
            const subStream = this.stream.getSubStream(path);
            return this.container.withProviders(
                {provide: Stream, useValue: subStream},
                {provide: Locator, useValue: this.getSubLocator(path)}
            )
                .get<ModelLike<TState, TActions>>(modelType);
        });
    }

    protected getSubLocator(path: ModelPath) {
        return new SubLocator(this, path)
    }
}
export class SubLocator implements Locator {
    constructor(private locator: EntityLocator, private path: ModelPath) {

    }

    private cache: Map<string, { State; Actions }>;

    get<TState, TActions extends ModelAction>(path: ModelPath, modelType: {
        new(...args): { State: TState; Actions: TActions }
    }): ModelLike<TState, TActions> {
        return this.locator.get(this.path.concat(path), modelType);
    }

}
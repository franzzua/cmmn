import {ModelAction, ModelLike, ModelPath} from "../shared/types";
import {Stream} from "../streams/stream";
import {Container, Injectable} from "@cmmn/core";

@Injectable()
export class EntityLocator {
    constructor(private stream: Stream, private container: Container) {
    }

    private cache = new Map<string, { State; Actions; }>();

    public get<TState, TActions extends ModelAction>(path: ModelPath, modelType: {
        new(stream: Stream): { State: TState, Actions: TActions };
    }): ModelLike<TState, TActions> {
        return this.cache.getOrAdd(path.join(':'), () => {
            const subStream = this.stream.getSubStream(path);
            return this.container.withProviders({provide: Stream, useValue: subStream})
                .get<ModelLike<TState, TActions>>(modelType);
        });
    }

}
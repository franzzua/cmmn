import {Stream} from "./streams/stream";
import {ModelKey} from "./shared/types";
import {ModelProxy} from "./entry/modelProxy";

export class ModelMap<TModelProxy extends ModelProxy<TState, TActions>, TState = any, TActions extends {} = {}> {
    constructor(private stream: Stream,
                private getKeys: () => ModelKey[],
                private factory: (key: ModelKey) => TModelProxy) {
    }

    private cache = new Map<ModelKey, TModelProxy>()

    get(id: ModelKey): TModelProxy {
        return this.getOrAdd(id, this.factory);
    }

    public getOrAdd(key: string | number, factory: (key: (string | number)) => ModelProxy<any, any>): TModelProxy {
        if (this.cache.has(key))
            return this.cache.get(key)!;
        const newItem = factory(key) as TModelProxy;
        this.cache.set(key, newItem);
        return newItem;
    }

    public* entries(): IterableIterator<[ModelKey, TModelProxy]> {
        for (let key of this.keys()) {
            yield [key, this.get(key)];
        }
    }
    public* values(): IterableIterator<TModelProxy> {
        for (let key of this.keys()) {
            yield this.get(key);
        }
    }

    public* keys(): IterableIterator<ModelKey> {
        const keys = this.getKeys();
        if (!keys)
            return;
        for (let key of keys) {
            yield key;
        }
    }

}

export {};
declare global {


    interface ReadonlyMap<K, V> {
        map<U>(selector: (value: V, key?: K) => U): Map<K, U>;

        cast<U>(): Map<K, U>;
    }
    interface Map<K, V> extends ReadonlyMap<K, V>{
        getOrAdd(key: K, factory: (key?: K) => V): V;
    }
}
function *getMapSelectorIterator<K,V,U>(map: Map<K,V>, selector: (value: V, key?: K) => U): Iterable<[K, U]>{
    for (let [key, value] of map.entries()) {
        yield [key, selector(value, key)];
    }
}

Map.prototype.cast = function () {
    return this;
};
Map.prototype.map = function (selector) {
    return new Map(getMapSelectorIterator(this, selector));
};

Map.prototype.getOrAdd = function (key, factory) {
    const existed = this.get(key);
    if (existed) return existed;
    const newItem = factory(key);
    this.set(key, newItem);
    return newItem;
};

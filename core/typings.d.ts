declare module "*.less";
declare interface ReadonlyArray<T> {
    filter(callbackfn: (value: T, index: number) => boolean): Array<T>;

    max(fn?: (item: T) => any): T;

    min(fn?: (item: T) => any): T;

    maxVal<U>(fn: (item: T, index: number) => U): U;

    minVal<U>(fn: (item: T, index: number) => U): U;

    range(min: number, max: number, step?: number): Array<number>;

    sum(): T;

    average(): T;

    distinct(selector?: (t: T) => any): Array<T>;

    orderBy(selector: (t: T) => (string | number), descending?: boolean): Array<T>;

    groupBy<K>(selector: (t: T) => K): Map<K, Array<T>>;
}

declare interface Array<T> extends ReadonlyArray<T> {
    remove(item: T): boolean;

    removeAll(test: (item: T) => boolean): Array<T>;
}

declare interface ReadonlyMap<K, V> {
    map<U>(selector: (value: V, key?: K) => U): Map<K, U>;

    cast<U>(): Map<K, U>;
}

declare interface Map<K, V> extends ReadonlyMap<K, V> {
    getOrAdd(key: K, factory: (key?: K) => V): V;
}

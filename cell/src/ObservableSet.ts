import {EventEmitter} from "@cmmn/core";

export class ObservableSet<T> extends EventEmitter<{
    change: {value: Set<T>; add?: T[]; delete?: T[];}
}> implements Set<T>{
    private readonly base: Set<T>;
    constructor(values?: readonly T[] | Iterable<T> | null) {
        super();
        this.base = new Set(values);
    }

    add(value: T): this {
        const has = this.base.has(value);
        this.base.add(value);
        !has && this.emit('change', {value: this.base, add: [value]})
        return  this;
    }
    clear(): void {
        const old = Array.from(this.base);
        this.base.clear();
        this.emit('change', {value: this.base, delete: old});
    }
    delete(value: T): boolean {
        const res = this.base.delete(value);
        res && this.emit('change', {value: this.base, delete: [value]});
        return res;
    }
    forEach(callbackFn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
        this.base.forEach(callbackFn, thisArg);
    }
    has(value: T): boolean {
        return this.base.has(value);
    }
    get size(): number { return  this.base.size; }
    entries(): IterableIterator<[T, T]> {
        return this.base.entries();
    }
    keys(): IterableIterator<T> {
        return this.base.keys();
    }
    values(): IterableIterator<T> {
        return this.base.values();
    }
    [Symbol.iterator](): IterableIterator<T> {
        return this.base[Symbol.iterator]();
    }
    [Symbol.toStringTag]: string = 'ObservableSet';
    toString(){
        return '('+ [...this.base].join(',')+')';
    }
}

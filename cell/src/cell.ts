import {BaseCell} from "./baseCell";

export type ICellOptions<T, TKey = T> = {
    compare?: (a: TKey, b: TKey) => boolean;
    compareKey?: (value: T) => TKey;
    filter?: (a: T) => boolean;
    put?: (a: T) => void
}


export class Cell<T = any, TKey = T> extends BaseCell<T>{
    constructor(value: T | (() => T), protected options: ICellOptions<T, TKey> = {}) {
        super(value);
    }

    public get(){
        const value = super.get();
        if (!this.options.filter || this.options.filter(value))
            return value;
        throw new Error('Current cell value is forbidden by filter');
    }

    protected compare(newValue: T, oldValue: T): boolean {
        if (!this.options.compare)
            return newValue === oldValue;
        if (!this.options.compareKey)
            return this.options.compare(newValue as any as TKey, oldValue as any as TKey);
        return this.options.compare(this.options.compareKey(newValue), this.options.compareKey(oldValue));
    }

    protected notifyChange(value: T, oldValue: T) {
        if (this.options.filter && !this.options.filter(value))
            return;
        super.notifyChange(value, oldValue);
        this.options.put && this.options.put(value);
    }
}
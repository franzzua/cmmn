import {BaseCell} from "./baseCell";

export type ICellOptions<T, TKey = T> = {
    compare?: (a: TKey, b: TKey) => boolean;
    compareKey?: (value: T) => TKey;
    filter?: (a: T) => boolean;
    put?: (a: T) => void;
    startValue?: T;
}

export class Cell<T = any, TKey = T> extends BaseCell<T> {
    constructor(value: T | (() => T), protected options: ICellOptions<T, TKey> = {}) {
        super(value);
        if (options.startValue) {
            this.update(options.startValue);
        }
    }

    public changeOptions(options: ICellOptions<T, TKey>) {
        if (this.options === options)
            return;
        this.options = options;
        if (options.filter && !options.filter(this.value)) {
            this.setError(new CellFilterError(this.value, options.filter, this))
        }
    }

    public get() {
        const value = super.get();
        if (!this.options.filter || this.options.filter(value))
            return value;
        throw new CellFilterError(this.value, this.options.filter, this);
    }

    protected compare(newValue: T, oldValue: T): boolean {
        if (newValue === oldValue)
            return true;
        if (!newValue && oldValue || newValue && !oldValue)
            return false;
        if (!this.options.compare)
            return false;
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

    public static OnChange<T, TKey>(pull: () => T, options: ICellOptions<T, TKey>, listener: (event: { value: T, oldValue: T }) => void): Function;
    public static OnChange<T>(pull: () => T, listener: (event: { value: T, oldValue: T }) => void): Function;
    public static OnChange<T, TKey>(pull: () => T, options: any, listener?: (event: { value: T, oldValue: T }) => void): Function {
        if (typeof options === "function") {
            listener = options;
            options = {};
        }
        return new Cell(pull, options).on('change', listener);
    }

    public static MergeCells<T>(...pulls: (() => T)[]): Cell<T> {
        const cell = new Cell<T>(null);
        for (let pull of pulls) {
            Cell.OnChange(pull, x => cell.set(x.value));
        }
        return cell;
    }
}

export class CellFilterError<T> extends Error {
    constructor(public value: T,
                public filter: (x: T) => void,
                public cell: Cell<T, any>) {
        super(`Cell have not accepted value: ${value}`);
    }
}

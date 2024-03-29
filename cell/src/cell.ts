import {BaseCell} from './baseCell.js';

export type ICellOptions<T, TKey = T> = {
    compare?: (a: TKey, b: TKey) => boolean;
    compareKey?: (value: T) => TKey;
    filter?: (a: T) => boolean;
    tap?: (a: T) => void;
    onExternal?: (a: T) => void;
    startValue?: T;
}

export class Cell<T = any, TKey = T> extends BaseCell<T> {
    constructor(value: T | (() => T),
                protected options: ICellOptions<T, TKey> = {}) {
        super(value);
        if (options.startValue !== undefined) {
            this.update(options.startValue);
        }
        if (this.value !== undefined) { // !function || options.startValue !== undefined
            this.handleFilterError(this.value);
            if (options.startValue === undefined) { // startValue -> update -> tap
                this.options.tap && this.options.tap(this.value);
            }
        }
    }

    public setInternal(value: T) {
        if (this.handleFilterError(value)) {
            return;
        }
        super.setInternal(value);
    }

    public set(value: T) {
        super.set(value);
        this.options.onExternal && this.options.onExternal(value);
    }

    protected update(value: T, error?: Error) {
        super.update(value, error);
        this.options.tap && this.options.tap(value);
    }

    public changeOptions(options: ICellOptions<T, TKey>) {
        if (this.options === options)
            return;
        this.options = options;
        this.handleFilterError(this.value);
    }

    private handleFilterError(value: T): boolean {
        if (this.options.filter && !this.options.filter(value)) {
            this.setError(new CellFilterError(value, this.options.filter, this));
            return true;
        }
        return false;
    }

    protected compare(value: T): boolean {
        const oldValue = this.value;
        if (Object.is(value, oldValue))
            return true;
        if (!value && oldValue || value && !oldValue)
            return false;
        if (!this.options.compare)
            return false;
        if (!this.options.compareKey)
            return this.options.compare(value as any as TKey, oldValue as any as TKey);
        return this.options.compare(this.options.compareKey(value), this.options.compareKey(oldValue));
    }

    public static OnChange<T, TKey>(pull: () => T, options: ICellOptions<T, TKey>, listener: (event: { value: T, oldValue: T }) => void): Function;
    public static OnChange<T>(pull: () => T, listener: (event: { value: T, oldValue: T }) => void): Function;
    public static OnChange<T, TKey>(pull: () => T, options: any, listener?: (event: { value: T, oldValue: T }) => void): Function {
        if (typeof options === 'function') {
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

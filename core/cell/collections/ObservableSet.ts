import {EventEmitter} from "../../event-emitter";
import {BaseCell} from "../base-cell";

export class ObservableSet<T> extends Set<T> {
    private ee = new EventEmitter<{
        change: {value: Set<T>; add?: T[]; delete?: T[];}
    }>()
    on = this.ee.on.bind(this.ee);

    constructor(values?: readonly T[] | Iterable<T> | null) {
        super(values);
    }

    add(value: T): this {
        const has = super.has(value);
        if (has) return this;
        super.add(value);
        this.ee?.emit('change', {value: this, add: [value]})
        return this;
    }
    clear(): void {
        const old = Array.from(this);
        super.clear();
        this.ee.emit('change', {value: this, delete: old});
    }
    delete(value: T): boolean {
        const res = super.delete(value);
        res && this.ee.emit('change', {value: this, delete: [value]});
        return res;
    }
    toString(){
        return `(${[...this.values()].join(',')})`
    }
}
BaseCell.likeCells.add(ObservableSet);
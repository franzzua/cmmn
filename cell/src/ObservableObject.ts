import {compare, DeepPartial, EventEmitter, Fn} from "@cmmn/core";
import {ICellOptions} from "./cell";
import {CellDecorator, getCell} from "./decorators";

export class ObservableObject<T> extends EventEmitter<{
    change: { oldValue: T, value: T, keys?: Array<string> }
}> {
    constructor(private value: Readonly<T>) {
        super();
    }

    public get Value() {
        return this.value;
    }

    public Set(value: T) {
        this.emit("change",{
            oldValue: this.value,
            value,
            keys: Object.keys(value)
        });
        this.value = value;
    }

    public Diff(diff: DeepPartial<T>) {
        const oldValue = this.value;
        const keys = Object.keys(diff).filter(x => !compare(diff[x], oldValue[x]));
        if (keys.length === 0)
            return;
        const value = Fn.deepAssign(this.value, diff);
        this.emit("change",{
            oldValue, value, keys
        });
    }
}



export const cellObject: CellDecorator = ((options: ICellOptions<any>, prop?, descr?) => {
    if (prop !== undefined) {
        return cellObject(null)(options, prop, descr);
    }
    return function cellDecorator(target, prop, descr) {
        const descriptor = {
            get() {
                const cell = getCell<ObservableObject<any>>(this, prop, descr, options, new ObservableObject<any>(null));
                return cell.get().Value;
            },
            set(value) {
                const cell = getCell<ObservableObject<any>>(this, prop, descr, options, new ObservableObject<any>(null));
                cell.get().Set(value);
            },
            configurable: true
        };
        return descriptor;
    }
}) as CellDecorator;
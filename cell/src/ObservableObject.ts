import {compare, DeepPartial, EventEmitter, Fn} from "@cmmn/core";

export class ObservableObject<T> extends EventEmitter<{
    change: { oldValue: T, value: T, keys?: Array<(keyof T) & string> }
}> {
    constructor(private value: Readonly<T>) {
        super();
    }

    public get Value() {
        return this.value;
    }

    public Set(value: T) {
        this.emitChange({
            oldValue: this.value,
            value,
        });
        this.value = value;
    }

    public Diff(diff: DeepPartial<T>) {
        const oldValue = this.value;
        const keys = Object.keys(diff).filter(x => !compare(diff[x], oldValue[x]));
        if (keys.length === 0)
            return;
        const value = Fn.deepAssign(this.value, diff);
        this.emitChange({
            oldValue, value, keys
        });
    }


    public emitChange(data) {
        this.emit('change', data)
    }
}

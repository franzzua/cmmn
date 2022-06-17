import {Map as YMap} from "yjs";
import {EventEmitter} from "@cmmn/core";

export class ObservableYMap<TValue> extends EventEmitter<{
    change: { oldValue: TValue, value: TValue, key: string, type: 'add' | 'delete' | 'update' },
}> {
    constructor(private yMap: YMap<TValue>) {
        super();
    }

    public subscribe() {
        this.yMap.observe((event, transaction) => {
            // if (event.transaction.local)
            //     return;
            for (let [id, change] of event.changes.keys) {
                switch (change.action) {
                    case "add":
                        this.emitChange('add', id, this.yMap.get(id), change.oldValue)
                        break;
                    case "delete":
                        this.emitChange('delete', id, null, change.oldValue)
                        break;
                    case "update":
                        this.emitChange('update', id, this.yMap.get(id), change.oldValue)
                        break;
                }
            }
        });
    }

    get size(): number {
        return this.yMap.size;
    }

    clear(): this {
        this.yMap.clear();
        return this;
    }

    private emitChange(type: 'add' | 'update' | 'delete', key, value, prev) {
        super.emit('change', {
            type,
            key,
            oldValue: prev,
            value
        });
    }

    has(key: string) {
        return this.yMap.has(key);
    }

    get(key: string) {
        return this.yMap.get(key);
    }

    delete(key: string): boolean {
        const has = this.yMap.has(key);
        const prev = this.yMap.get(key);
        this.yMap.delete(key);
        this.emitChange('delete', key, null, prev);
        return has;
    }

    set(key: string, value: TValue) {
        const has = this.yMap.has(key);
        const prev = this.yMap.get(key);
        this.yMap.set(key, value);
        this.emitChange(has ? 'update' : 'add', key, value, prev);
        return this;
    }

    forEach(cb: (value: TValue, key: string, map: this) => void) {
        for (let x of this.yMap) {
            cb(x[1], x[0], this);
        }
    }

    keys() {
        return this.yMap.keys();
    }

    values(): IterableIterator<TValue> {
        return this.yMap.values();
    }

    entries(): IterableIterator<[string, TValue]> {
        return this.yMap.entries();
    }

    [Symbol.iterator] = () => {
        return this.entries();
    }

    toMap(): Map<string, TValue> {
        return new Map(this.entries());
    }

}


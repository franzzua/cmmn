import {Map as YMap} from "yjs";
import {EventEmitter} from "@cmmn/cell";
import {ObservableList, ObservableMap} from "@cmmn/cell";
import {Fn} from "@cmmn/core";

export class ObservableYMap<TValue> extends ObservableMap<string, TValue>{
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

    _entries: Map<string, TValue>;

    get size(): number {
        return this.yMap.size;
    }

    clear(): this {
        this.yMap.clear();
        return this;
    }

    equals(that: any): boolean {
        if (!(that instanceof ObservableMap) ||
            !(that instanceof ObservableYMap)) {
            return false;
        }
        if (this.size != that.size) {
            return false;
        }
        for (let [key, value] of this) {
            const thisValue = this.get(key);
            const thatValue = that.get(key);
            if (!Fn.compare(thisValue, thatValue))
                return false;
        }
        return true;
    }

    clone(deep?: boolean): ObservableMap<string, TValue> {
        throw new Error("Method not implemented.");
    }

    absorbFrom(that: any): boolean {
        throw new Error("Method not implemented.");
    }

    toData<I = any>(): Record<string, I> {
        throw new Error("Method not implemented.");
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
        this.yMap.delete(key);
        return has;
    }

    set(key: string, value: TValue) {
        this.yMap.set(key, value);
        return this;
    }

    forEach(cb: (value: TValue, key: string, map: this) => void, context?: any) {
        for (let x of this.yMap) {
            cb.call(context, x[1], x[0], this);
        }
    }

    keys() {
        return this.yMap.keys();
    }

    values() {
        return this.yMap.values();
    }

    entries() {
        return this.yMap.entries();
    }

    [Symbol.iterator] = () => {
        return this.entries();
    }

}


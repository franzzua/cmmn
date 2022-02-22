import {Map as YMap} from "yjs";
import {EventEmitter, TListener} from "cellx";
import {ObservableList, ObservableMap, TObservableMapValueEquals} from "cellx-collections";
import {Fn} from "@cmmn/core";

export class ObservableYMap<TValue> extends EventEmitter
    implements ObservableMap<string, TValue> {
    constructor(private yMap: YMap<TValue>) {
        super();
    }
    public subscribe() {
        this.yMap.observe((event, transaction) => {
            if (event.transaction.local)
                return;
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
        this.emit({
            type: 'change',
            target: this,
            data: {

            }
        });
    }

    _entries: Map<string, TValue>;

    get size(): number {
        return this.yMap.size;
    }

    _valueEquals: TObservableMapValueEquals<TValue>;
    get valueEquals(): TObservableMapValueEquals<TValue> {
        throw new Error("Method not implemented.");
    }

    onChange(listener: TListener<EventEmitter>, context?: any): this {
        return this.on(ObservableMap.EVENT_CHANGE, listener, context);
    }

    offChange(listener: TListener<EventEmitter>, context?: any): this {
        return this.off(ObservableMap.EVENT_CHANGE, listener, context);
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
        super.emit(ObservableMap.EVENT_CHANGE, {
            subtype: type,
            key,
            prevValue: prev,
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

    public toList(id: (x: TValue) => string): ObservableList<TValue> {
        const list = new ObservableList(Array.from(this.values()));
        list.onChange(e => {
            switch (e.data.subtype) {
                case "add":
                case "update":
                    this.set(id(e.data.value), e.data.value);
                    break;
                case "delete":
                    this.delete(id(e.data.value));
                    break;
            }
        });
        this.onChange(e => {
            switch (e.data.subtype) {
                case "add":
                    list.add(e.data.value);
                    break;
                case "delete":
                    list.remove(e.data.value);
                    break;
                case "update":
                    list.set(list.indexOf(e.data.oldValue), e.data.value);
                    break;
            }
        });
        return list;
    }

}


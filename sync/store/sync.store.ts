import {Doc, Map as YMap} from "yjs";
import {ObservableMap} from "cellx-collections";
import {DocAdapter} from "../webrtc/client/doc-adapter";
import {Awareness} from "y-protocols/awareness";
import {EventEmitter} from "cellx";

export class SyncStore<TEntity> {
    private doc = new Doc();
    public adapter = new DocAdapter(this.doc, new Awareness(this.doc));

    private items = this.doc.getMap<TEntity>('items');

    constructor() {
    }

    public Items = new ObservableYMap<TEntity>(this.items);

}

export class ObservableYMap<TValue> extends EventEmitter  implements Iterable<[string, TValue]>{
    constructor(private yMap: YMap<TValue>) {
        super();
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
    delete(key: string) {
        return this.yMap.delete(key);
    }

    set(key: string, value: TValue) {
        return this.yMap.set(key, value);
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

    [Symbol.iterator](): Iterator<[string, TValue], any, undefined> {
        return this.entries();
    }


}
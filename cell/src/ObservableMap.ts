import {EventEmitter} from "./event-emitter";

export class ObservableMap<K, V> extends EventEmitter<{
    change: { oldValue: V, value: V, key: K, type: 'add' | 'delete' | 'update' },
    // add: { key: K, value: V },
    // delete: { key: K },
    // update: { key: K, oldValue: V, value: V },
}> {
    private map = new Map<K, V>();

    keys() {
        return this.map.keys()
    };

    entries() {
        return this.map.entries()
    };

    values() {
        return this.map.values()
    };

    set(key: K, value: V) {
        const old = this.map.get(key);
        const has = this.map.has(key);
        this.map.set(key, value);
        this.emit('change', {oldValue: old, value, key, type: has ? 'update' : 'add'})
    };


    get(key: K) {
        return this.map.get(key)
    };

    has(key: K) {
        return this.map.has(key)
    };

    delete(key: K) {
        const has = this.map.has(key);
        if (!has)
            return;
        const old = this.map.get(key);
        this.map.delete(key)
        this.emit('change', {oldValue: old, value: undefined, key, type: 'delete'})
    };

    mergeFrom<U>(map: Map<K, U>, create: (value: U) => V, update: (item: V, value: U) => void){
        for (let existed of this.map.keys()) {
            if (!map.has(existed))
                this.map.delete(existed);
        }
        for (let [key, value] of map.entries()) {
            if (this.map.has(key))
                update(this.map.get(key), value);
            else
                this.map.set(key, create(value));
        }
    }
}


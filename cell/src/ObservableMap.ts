import {EventEmitter} from "@cmmn/core";

export class ObservableMap<K, V> extends EventEmitter<{
    change: { oldValue: V, value: V, key: K, type: 'add' | 'delete' | 'update' } | { value: Map<K, V> },
    // add: { key: K, value: V },
    // delete: { key: K },
    // update: { key: K, oldValue: V, value: V },
}> {
    private map = new Map<K, V>();

    keys() {
        return this.map.keys()
    }

    toMap(): ReadonlyMap<K, V> {
        return this.map;
    }

    toArray(): ReadonlyArray<V> {
        return Array.from(this.map.values());
    }

    entries() {
        return this.map.entries()
    }

    values() {
        return this.map.values()
    }

    get(key: K) {
        return this.map.get(key)
    }

    has(key: K) {
        return this.map.has(key)
    }

    set(key: K, value: V) {
        const old = this.map.get(key);
        const has = this.map.has(key);
        this.map.set(key, value);
        this.emitChange({oldValue: old, value, key, type: has ? 'update' : 'add'})
    }

    delete(key: K) {
        const has = this.map.has(key);
        if (!has)
            return;
        const old = this.map.get(key);
        this.map.delete(key);
        this.emitChange({oldValue: old, value: undefined, key, type: 'delete'});
    }

    mergeFrom<U>(map: Map<K, U>, create: (value: U) => V, update?: (item: V, value: U) => void, onDelete?: (item: V) => void) {
        for (let [existed, value] of this.map.entries()) {
            if (!map.has(existed)) {
                this.map.delete(existed);
                onDelete && onDelete(value);
            }
        }
        for (let [key, value] of map.entries()) {
            if (this.map.has(key))
                update && update(this.map.get(key), value);
            else
                this.map.set(key, create(value));
        }
        this.emit('change', {
            value: this.map
        })
    }


    emitChange(data) {
        this.emit('change', data)
    }
}


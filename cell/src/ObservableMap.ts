import {EventEmitter} from "./event-emitter";

export class ObservableMap<K, V> extends EventEmitter<{
    change: { oldValue: V, value: V, key: K, type: 'add' | 'delete' | 'update' },
    add: { key: K, value: V },
    delete: { key: K },
    update: { key: K, oldValue: V, value: V },
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
        return this.map.set(key, value)
    };


    get(key: K) {
        return this.map.get(key)
    };
    has(key: K) {
        return this.map.has(key)
    };

    delete(key: K) {
        return this.map.delete(key)
    };
}


const DefaultListenerOptions = {
    Priority: 0
};
export class EventEmitterBase {
    once(eventName, listener, ...rest) {
        const onceListener = data => {
            listener(data);
            this.off(eventName, onceListener);
        };
        this.on(eventName, onceListener, ...rest);
        return () => this.off(eventName, onceListener);
    }
    onceAsync(eventName, ...rest) {
        return new Promise(resolve => this.once(eventName, resolve, ...rest));
    }
}
export class EventEmitter extends EventEmitterBase {
    constructor() {
        super(...arguments);
        this.listeners = new Map();
    }
    on(eventName, listener, options = DefaultListenerOptions) {
        const arr = this.listeners.getOrAdd(eventName, () => {
            this.subscribe(eventName);
            return [];
        });
        arr.push({ listener, options: options });
        arr.sort((a, b) => b.options.Priority - a.options.Priority);
        return () => this.off(eventName, listener);
    }
    off(eventName, listener) {
        const set = this.listeners.getOrAdd(eventName, () => []);
        set.removeAll(x => x.listener === listener);
        if (set.length == 0) {
            this.listeners.delete(eventName);
            this.unsubscribe(eventName);
        }
    }
    subscribe(eventName) {
    }
    unsubscribe(eventName) {
    }
    emit = (eventName, data) => {
        let arr = this.listeners.get(eventName);
        if (!arr)
            return;
        arr.slice().forEach(x => x.listener(data));
    }
    static fromEventTarget(target) {
        return new EventListener(target);
    }
    static Merge(...emitters) {
        return new MergeListener(emitters);
    }
    dispose() {
        for (let [key, value] of this.listeners) {
            for (let listener of value) {
                this.off(key, listener.listener);
            }
        }
    }
}
/**
 * Сравнивает на равенство два значения.
 * Поддерживается проверка объектов: встроенное сравнение объектов(метод 'equals'), array, Set, Map, любой object.
 *
 * Ограничения для: array, Set, Map.
 * Корректное сравнение можно ожидать:
 *   - если массивы были предварительно отсортированы;
 *   - если Set содержит только примитивы;
 *   - если ключи Map состоят только из примитивов.
 */
export function compare(a, b) {
    if (typeof a !== "object" || a === null)
        return Object.is(a, b); // a{undefined | null | boolean | number | bigint | string | symbol | function} and b{any}
    if (typeof b !== "object" || b === null)
        return false; // a{object} and b{undefined | null | boolean | number | bigint | string | symbol | function}
    // здесь и a и b это объекты
    if (a === b)
        return true;
    if (a.equals && b.equals)
        return a.equals(b);
    const aIsArr = Array.isArray(a);
    const bIsArr = Array.isArray(b);
    if (aIsArr && bIsArr)
        return compareArrays(a, b);
    else if (aIsArr || bIsArr)
        return false;
    const aIsSet = a instanceof Set;
    const bIsSet = b instanceof Set;
    if (aIsSet && bIsSet)
        return compareSets(a, b);
    else if (aIsSet || bIsSet)
        return false;
    const aIsMap = a instanceof Map;
    const bIsMap = b instanceof Map;
    if (aIsMap && bIsMap)
        return compareMaps(a, b);
    else if (aIsMap || bIsMap)
        return false;
    return compareObjects(a, b);
}
function compareArrays(a, b) {
    return a.length === b.length &&
        a.every((x, i) => compare(x, b[i]));
}
function compareSets(a, b) {
    if (a.size !== b.size)
        return false;
    for (let x of a) {
        if (!b.has(x))
            return false;
    }
    return true;
}
function compareMaps(a, b) {
    if (a.size !== b.size)
        return false;
    for (let key of a.keys()) {
        if (!b.has(key))
            return false;
        if (!compare(a.get(key), b.get(key)))
            return false;
    }
    return true;
}
function compareObjects(a, b) {
    for (let key in a) {
        if (!(key in b))
            return false;
        if (!compare(a[key], b[key]))
            return false;
    }
    for (let key in b) {
        if (!(key in a))
            return false;
    }
    return true;
}


Map.prototype.getOrAdd = function (key, factory) {
    const existed = this.get(key);
    if (existed) return existed;
    const newItem = factory(key);
    this.set(key, newItem);
    return newItem;
};

Array.prototype.removeAll = function (test) {
    if (!test) {
        this.length = 0;
        return this;
    }
    let left = 0;
    let right = this.length - 1;
    while (left <= right) {
        if (test(this[left])) {
            const temp = this[right];
            this[right] = left;
            this[left] = temp;
            right--;
        } else {
            left++;
        }
    }
    this.length = right + 1;
    return this;
};

Array.prototype.distinct = function(selector) {
    if (selector) {
        const map = this.reduce((map, cur) => {
            map.set(selector(cur), cur);
            return map;
        }, new Map());
        return Array.from(map.values());
    }
    return Array.from(new Set(this))
}

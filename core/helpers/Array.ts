import {Fn} from "./Fn";

export {};

declare global {
    interface ReadonlyArray<T> {
        filter(callbackfn: (value: T, index: number) => boolean): Array<T>;

        max(fn?: (item: T) => any): T;

        min(fn?: (item: T) => any): T;

        maxVal<U>(fn: (item: T, index: number) => U): U;

        minVal<U>(fn: (item: T, index: number) => U): U;

        range(min: number, max: number, step?: number): Array<number>;

        sum(): T;

        average(): T;

        distinct(selector?: (t: T) => any): Array<T>;

        orderBy(selector: (t: T) => (string | number), descending?: boolean): Array<T>;

        groupBy<K>(selector: (t: T) => K): Map<K, Array<T>>;
    }

    interface Array<T> extends ReadonlyArray<T> {
        remove(item: T): boolean;

        removeAll(test: (item: T) => boolean): Array<T>;
    }

}


Array.prototype.groupBy = function <T, K>(selector: (t: T) => K) {
    return this.reduce((result: Map<K, Array<T>>, item: T) => {
        const key = selector(item);
        if (result.has(key))
            result.get(key)!.push(item);
        else
            result.set(key, [item]);
        return result;
    }, new Map());
};


Array.prototype.orderBy = function <T>(selector: (t: T) => (string | number) = Fn.I as any, descending = false) {
    return [...this].sort((a, b) => ((selector(a) > selector(b)) ? 1 : -1) * (descending ? -1 : 1));
};

Array.prototype.distinct = function <T, U = any>(selector?: (t: T) => U) {
    if (selector) {
        const map = this.reduce((map: Map<U, T>, cur: T) => {
            map.set(selector(cur), cur);
            return map;
        }, new Map<U, T>());
        return Array.from(map.values());
    }
    return Array.from(new (<any>Set)(this)) as Array<T>;
};

Array.prototype.range = function (min, max, step) {
    if (!step) step = 1;
    for (let i = min; i < max; i += step) {
        this.push(i);
    }
    return this;
};
Array.prototype.sum = function (this: Array<number>): number {
    if (this.length == 0) return 0;
    return this.reduce((a, b) => a + b, 0);
};
Array.prototype.average = function () {
    return this.sum() / this.length;
};
Array.prototype.remove = function (item) {
    const index = this.indexOf(item);
    if (index == -1) return false;
    this.splice(index, 1);
    return true;
};
Array.prototype.removeAll = function (test: (item: any) => boolean) {
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
Array.prototype.maxVal = function <T, U>(this: Array<T>, fn: (x: T, index: number) => U): U {
    if (this.length == 0)
        return null;
    let current = this[0];
    let currentVal = fn ? fn(current, 0) : current;
    this.forEach((item, i) => {
        if (current == null) {
            current = item;
            currentVal = fn ? fn(item, i) : item;
            return;
        }
        const val = fn ? fn(item, i) : item;
        if (val > currentVal) {
            current = item;
            currentVal = val;
        }
    });
    return currentVal as U;
};
Array.prototype.max = function (this: Array<number>, fn) {
    if (this.length == 0)
        return null;
    let current = this[0];
    let currentVal = fn ? fn(current) : +current;
    this.forEach(item => {
        if (current == null) {
            current = item;
            return;
        }
        const val = fn ? fn(item) : +item;
        if (val > currentVal) {
            current = item;
            currentVal = val;
        }
    });
    return current;
};
Array.prototype.minVal = function <T, U>(this: Array<T>, fn: (x: T, index: number) => U): U {
    if (this.length == 0)
        return null;
    let current = this[0];
    let currentVal = fn ? fn(current, 0) : current;
    this.forEach((item, i) => {
        if (current == null) {
            current = item;
            currentVal = fn ? fn(item, i) : item;
            return;
        }
        const val = fn ? fn(item, i) : item;
        if (val < currentVal) {
            current = item;
            currentVal = val;
        }
    });
    return currentVal as U;
};
Array.prototype.min = function (this: Array<number>, fn) {
    if (this.length == 0)
        return null;
    let current = this[0];
    let currentVal = fn ? fn(current) : current;
    this.forEach(item => {
        if (current == null) {
            current = item;
            return;
        }
        const val = fn ? fn(item) : item;
        if (val < currentVal) {
            current = item;
            currentVal = val;
        }
    });
    return current;
};

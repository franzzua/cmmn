import {Fn} from "./Fn";

export function groupBy<T, K>(array: Array<T>, selector: (t: T) => K) {
    return array.reduce((result: Map<K, Array<T>>, item: T) => {
        const key = selector(item);
        if (result.has(key))
            result.get(key)!.push(item);
        else
            result.set(key, [item]);
        return result;
    }, new Map());
}

export function orderBy<T>(array: Iterable<T>, selector: (t: T) => (string | number) = Fn.I as any, descending = false) {
    return [...array].sort((a, b) => ((selector(a) > selector(b)) ? 1 : -1) * (descending ? -1 : 1));
}

export function distinct<T, U = any>(array: Array<T>, selector?: (t: T) => U) {
    if (selector) {
        const map = array.reduce((map: Map<U, T>, cur: T) => {
            map.set(selector(cur), cur);
            return map;
        }, new Map<U, T>());
        return Array.from(map.values());
    }
    return Array.from(new (<any>Set)(array)) as Array<T>;
}

export function sum(array: Array<number>): number {
    if (array.length == 0) return 0;
    return array.reduce((a, b) => a + b, 0);
}
export function average(array: Array<number>) {
    return sum(array) / array.length;
}
export function remove<T>(array: Array<T>, item: T) {
    const index = array.indexOf(item);
    if (index == -1) return false;
    array.splice(index, 1);
    return true;
}
export function removeAll<T>(array: Array<T>, test: (item: T) => boolean) {
    if (!test) {
        array.length = 0;
        return array;
    }
    let left = 0;
    let right = array.length - 1;
    while (left <= right) {
        if (test(array[left])) {
            const temp = array[right];
            array[right] = array[left];
            array[left] = temp;
            right--;
        } else {
            left++;
        }
    }
    array.length = right + 1;
    return array;
}
export function maxVal<T, U>(array: Array<T>, fn: (x: T, index: number) => U): U {
    if (array.length == 0)
        return null;
    let current = array[0];
    let currentVal = fn ? fn(current, 0) : current;
    array.forEach((item, i) => {
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
}
export function minVal<T, U>(array: Array<T>, fn: (x: T, index: number) => U): U {
    if (array.length == 0)
        return null;
    let current = array[0];
    let currentVal = fn ? fn(current, 0) : current;
    array.forEach((item, i) => {
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
}

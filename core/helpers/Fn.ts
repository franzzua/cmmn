import {ulid} from "ulid";
import {Cell, cellx} from "cellx";

export const Fn = {
    I<T>(x: T): T {
        return x || null;
    },
    Ib<T>(x: T): boolean {
        return !!x;
    },
    ulid: ulid,
    pipe: (...functions: Function[]) => {
        return functions.reduce((f1, f2) => (...args: any[]) => f2(f1(...args)))
    },
    distinctUntilChanged<T>(comparator: (x: T, y: T) => boolean): MethodDecorator {
        return <T>(target: any, key: string, descr: TypedPropertyDescriptor<T>) => {
            const symbol = Symbol(key + 'distinct');
            return {
                get() {
                    const cell: Cell<T> = this[symbol] ?? (this[symbol] = new Cell(descr.get!.bind(this), {
                        compareValues: comparator
                    }));
                    return cell.get();
                }
            }
        }
    },
    /**
     * Сравнивает два объекта, учитывает DateTime, Duration, array, object
     * @param a
     * @param b
     * @returns {boolean}
     */
    compare: function compare(a: any, b: any): boolean {
        if (["string", "number", "boolean", "function"].includes(typeof a))
            return a === b;
        if (a === b)
            return true;
        if (a == null && b == null)
            return true;
        if (a == null || b == null)
            return false;
        if ('equals' in a)
            return a['equals'](b);
        if (Array.isArray(a) && Array.isArray(b)) {
            return a.length === b.length &&
                a.every((x, i) => compare(x, b[i]));
        }
        if (typeof a === "object" && typeof b === "object") {
            const aKeys = Object.getOwnPropertyNames(a);
            const bKeys = Object.getOwnPropertyNames(b);
            if (!compare(aKeys, bKeys))
                return false;
            return aKeys.every(key => compare(a[key], b[key]));
        }
        return false;
    }

};

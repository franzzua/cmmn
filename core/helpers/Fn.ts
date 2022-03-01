import {ulid} from "./ulid";
import {Cell} from "cellx";
import {compare} from "./compare";
//
// import { generator, BASE } from "flexid";
// const ulid = generator(BASE["58"]);

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
    join: (...functions: Function[]) => {
        return function (...args) {
            for (let fn of functions) {
                fn.apply(this, args);
            }
        }
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
    asyncDelay(timeout: number = 0): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, timeout));
    },
    /**
     * Сравнивает два объекта, учитывает DateTime, Duration, array, object
     * @param a
     * @param b
     * @returns {boolean}
     */
    compare: compare

};

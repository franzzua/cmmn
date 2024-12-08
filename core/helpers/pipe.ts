import {type Func} from "./throttle";

export function pipe<TThis, TArgs extends Array<unknown>, T1, T2, T3, T4, T5, T>(fn1: Func<T1, TThis, TArgs>, fn2: Func<T2, TThis, [T1]>
    , fn3: Func<T3, TThis, [T2]>, fn4: Func<T4, TThis, [T3]>, fn5: Func<T5, TThis, [T4]>, fn6: Func<T, TThis, [T5]>): Func<T, TThis, TArgs>;
export function pipe<TThis, TArgs extends Array<unknown>, T1, T2, T3, T4, T>(fn1: Func<T1, TThis, TArgs>, fn2: Func<T2, TThis, [T1]>
    , fn3: Func<T3, TThis, [T2]>, fn4: Func<T4, TThis, [T3]>, fn5: Func<T, TThis, [T4]>): Func<T, TThis, TArgs>;
export function pipe<TThis, TArgs extends Array<unknown>, T1, T2, T3, T>(fn1: Func<T1, TThis, TArgs>, fn2: Func<T2, TThis, [T1]>
    , fn3: Func<T3, TThis, [T2]>, fn4: Func<T, TThis, [T3]>): Func<T, TThis, TArgs>;
export function pipe<TThis, TArgs extends Array<unknown>, T1, T2, T>(fn1: Func<T1, TThis, TArgs>, fn2: Func<T2, TThis, [T1]>
    , fn3: Func<T, TThis, [T2]>): Func<T, TThis, TArgs>;
export function pipe<TThis, TArgs extends Array<unknown>, T1, T>(fn1: Func<T1, TThis, TArgs>, fn2: Func<T, TThis, [T1]>): Func<T, TThis, TArgs>;
export function pipe(fn1: Function, ...fn: Array<Function>): Function {
    return function piped(this: unknown, ...args: unknown[]) {
        args = fn1.apply(this, args);
        for (let f of fn) {
            args = f.call(this, args);
        }
        return args;
    }
}
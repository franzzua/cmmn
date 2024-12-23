import {throttle as throttleOrig} from "throttle-debounce";
import {ResolvablePromise} from "./resolvable.promise";


export function throttle<TResult, TThis = void, TNewArgs extends unknown[] = [], TArgs extends unknown[] = TNewArgs>(
    fn: ThrottleFunc<TResult, TThis, TNewArgs>,
    wait: number,
    options: ThrottleOptions<TResult, TThis, TNewArgs, TArgs> = defaultThrottleOptions,
): ThrottledFunc<TResult, TThis, TArgs> {
    const throttler = getThrottler<TResult, TThis, TNewArgs, TArgs>(wait, options);
    return throttler(fn);
}

export type Func<TResult, TThis = void, TArgs extends unknown[] = []> = (this: TThis, ...args: TArgs) => TResult;
export type ThrottleFunc<TResult, TThis = void, TArgs extends unknown[] = []>
    = (this: TThis, ...args: TArgs) => TResult

export type ThrottledFunc<TResult, TThis = void, TArgs extends unknown[] = []>
    = ((this: TThis, ...args: TArgs) => Promise<Awaited<TResult>>) & Disposable & PromiseLike<void>;


export type ThrottleOptions<TResult = unknown, TThis = void, TNewArgs  extends unknown[] = [], TArgs extends unknown[] = TNewArgs> = {
    leading?: boolean;
    trailing?: boolean;
    /** @internal **/
    debounceMode?: boolean;
    select?: (this: TThis, ...args: TArgs[]) => TNewArgs
};
export const defaultThrottleOptions = {
    leading: false,
    trailing: true,
}

export function getThrottler<TResult = unknown, TThis = void, TNewArgs extends unknown[] = [], TArgs extends unknown[] = TNewArgs>(
    time: number,
    options: ThrottleOptions<TResult, TThis, TNewArgs, TArgs> = defaultThrottleOptions) {
    options.leading ??= false;
    options.trailing ??= true;
    return function (fn: ThrottleFunc<TResult, TThis, TNewArgs>): ThrottledFunc<TResult, TThis, TArgs> {
        let promise: ResolvablePromise<Awaited<TResult>> | undefined;
        let allArgs: Array<TArgs> = [];
        const orig = throttleOrig(time, async function () {
            promise ??= new ResolvablePromise()
            try {
                const args: TNewArgs[] = options.select ? options.select.apply(this, allArgs) : allArgs.pop();
                allArgs = [];
                const res = await fn.apply(this, args);
                promise.resolve(res);
            } catch (e) {
                promise.reject(e);
            }
            promise = undefined;
        }, {
            noLeading: !options.leading,
            noTrailing: !options.trailing,
            debounceMode: options.debounceMode
        });
        return Object.assign(function (this: TThis, ...args: TArgs): Promise<Awaited<TResult>> {
            allArgs.push(args);
            orig.call(this);
            return promise ??= new ResolvablePromise();
        }, {
            [Symbol.dispose]() {
                orig.cancel();
                promise?.reject();
            },
            then: (async () => {
                await promise;
            }) as PromiseLike<void>['then']
        });
    }
}

export function getDebouncer<TResult, TThis = void, TNewArgs extends unknown[] = [], TArgs extends unknown[] = TNewArgs>(
    time: number,
    immediate = false,
    select: ThrottleOptions<TResult, TThis, TNewArgs, TArgs>["select"] = void 0
) {
    return getThrottler<TResult, TThis, TNewArgs, TArgs>(time, {
        debounceMode: immediate,
        leading: true,
        trailing: true,
        select
    })
}

export function debounce<TResult, TThis = void, TNewArgs extends unknown[] = [], TArgs extends unknown[] = TNewArgs>(
    fn: ThrottleFunc<TResult, TThis, TNewArgs>,
    wait: number,
    immediate = false,
    select: ThrottleOptions<TResult, TThis, TNewArgs, TArgs>["select"] = void 0
): ThrottledFunc<TResult, TThis, TArgs> {
    return throttle<TResult, TThis, TNewArgs, TArgs>(fn, wait, {
        debounceMode: immediate,
        leading: true,
        trailing: true,
        select
    })
}


export const throttled = getThrottler;
export const debounced = getDebouncer;

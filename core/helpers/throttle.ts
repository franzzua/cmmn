import {throttle as throttleOrig} from "throttle-debounce";
import {ResolvablePromise} from "./resolvable.promise";

export function throttle<TResult, TThis = void, TArgs extends unknown[] = [], TCallInfo = void>(
    fn: ThrottleFunc<TResult, TThis, TArgs, TCallInfo>,
    wait: number,
    options: ThrottleOptions<TResult, TThis, TArgs, TCallInfo> = defaultThrottleOptions,
): ThrottledFunc<TResult, TThis, TArgs> {
    const throttler = getThrottler<TResult, TThis, TArgs, TCallInfo>(wait, options);
    return throttler(fn);
}

export type Func<TResult, TThis = void, TArgs extends unknown[] = []> = (this: TThis, ...args: TArgs) => TResult;
export type ThrottleFunc<TResult, TThis = void, TArgs extends unknown[] = [], TCallInfo = void>
    = TCallInfo extends void
    ? (this: TThis, ...args: TArgs) => TResult
    : (this: TThis, ...args: [...TArgs, TCallInfo[]]) => TResult

export type ThrottledFunc<TResult, TThis = void, TArgs extends unknown[] = []>
    = ((this: TThis, ...args: TArgs) => Promise<Awaited<TResult>>) & Disposable & PromiseLike<void>;


export type ThrottleOptions<TResult = unknown, TThis = void, TArgs extends unknown[] = [], TCallInfo = void> = {
    leading?: boolean;
    trailing?: boolean;
    /** @internal **/
    debounceMode?: boolean;
    getCallInfo?: (this: TThis, ...args: TArgs) => TCallInfo
};
export const defaultThrottleOptions = {
    leading: false,
    trailing: true,
}

export function getThrottler<TResult = unknown, TThis = void, TArgs extends unknown[] = [], TCallInfo = void>(
    time: number,
    options: ThrottleOptions<TResult, TThis, TArgs, TCallInfo> = defaultThrottleOptions) {
    return function (fn: ThrottleFunc<TResult, TThis, TArgs, TCallInfo>): ThrottledFunc<TResult, TThis, TArgs> {
        let promise: ResolvablePromise<Awaited<TResult>>;
        let calls: Array<TCallInfo> = [];
        const orig = throttleOrig(time, async function (...args: TArgs) {
            promise ??= new ResolvablePromise()
            try {
                args.push(calls);
                calls = [];
                const res = await fn.apply(this, args);
                promise.resolve(res);
            } catch (e) {
                promise.reject(e);
            }
        }, {
            noLeading: !options.leading,
            noTrailing: !options.trailing,
            debounceMode: options.debounceMode
        });
        return Object.assign(function (this: TThis, ...args: TArgs): Promise<Awaited<TResult>> {
            if (options.getCallInfo) {
                calls.push(options.getCallInfo.apply(this, args));
            }
            orig.apply(this, args);
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

export function getDebouncer<TResult, TThis = void, TArgs extends unknown[] = [], TCallInfo = void>(
    time: number,
    immediate = false,
    getCallInfo: ThrottleOptions<TResult, TThis, TArgs, TCallInfo>["getCallInfo"] = void 0
) {
    return getThrottler<TResult, TThis, TArgs, TCallInfo>(time, {
        debounceMode: immediate,
        leading: true,
        trailing: true,
        getCallInfo
    })
}

export function debounce<TResult, TThis = void, TArgs extends unknown[] = [], TCallInfo = void>(
    fn: ThrottleFunc<TResult, TThis, TArgs, TCallInfo>,
    wait: number,
    immediate = false,
    getCallInfo: ThrottleOptions<TResult, TThis, TArgs, TCallInfo>["getCallInfo"] = void 0
): ThrottledFunc<TResult, TThis, TArgs> {
    return throttle<TResult, TThis, TArgs, TCallInfo>(fn, wait, {
        debounceMode: immediate,
        leading: true,
        trailing: true,
        getCallInfo
    })
}

export const throttled = getThrottler;
export const debounced = getDebouncer;

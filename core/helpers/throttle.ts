import { throttle as throttleOrig } from "throttle-debounce";
import {ResolvablePromise} from "./resolvable.promise";

export function throttle<TResult, TThis = void, TArgs extends unknown[] = []>(
    fn: (this: TThis, ...args: TArgs) => TResult | Promise<TResult>,
    wait: number,
    options: {
        leading?: boolean;
        trailing?: boolean;
        /** @internal **/
        debounceMode?: boolean;
    } = {
        leading: false,
        trailing: true,
    },

){
    let promise: ResolvablePromise<TResult> = new ResolvablePromise();
    const orig = throttleOrig(wait, async function (...args){
        try {
            const res = await fn.apply(this, args);
            promise.resolve(res);
        }catch (e){
            promise.reject(e);
        }
        promise = new ResolvablePromise();
    }, {
        noLeading: !options.leading,
        noTrailing: !options.trailing,
        debounceMode: options.debounceMode
    });
    return function (this: TThis, ...args: TArgs): Promise<TResult>{
        orig.apply(this, args);
        return promise.asPromise();
    }
}

export function debounce<TResult, TThis = void, TArgs extends unknown[] = []>(
    fn: (this: TThis, ...args: TArgs) => TResult,
    wait: number,
    immediate = false
){
    return throttle(fn, wait, {
        debounceMode: immediate,
        leading: true,
        trailing: true
    })
}

export function throttled<TResult, TThis = void, TArgs extends unknown[] = []>(
    wait: number, options = {leading: false, trailing: true}
) {
    return (
        fn: (this: TThis, ...args: TArgs) => TResult | Promise<TResult>,
        context: ClassMethodDecoratorContext<TThis>) => {
        return throttle(fn, wait, options);
    };
}

export function debounced(wait: number, immediate = false) {
    return (method, context: ClassMethodDecoratorContext) => {
        return debounce(method, wait, immediate);
    };
}
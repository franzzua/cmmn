import {ulid} from "./ulid";
import * as crc32 from "crc-32";
import {compare} from "./compare";
import {deepAssign} from "./deepAssign";
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
    pipe: (...functions: (((...input: any[]) => any | Function))[]):  ((...input: any[]) => any) => {
        return functions.reduce((f1, f2) => (...args: any[]) => f2(f1(...args)))
    },
    join: (...functions: Function[]) => {
        return function (...args) {
            for (let fn of functions) {
                fn && fn.apply(this, args);
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
    compare: compare,
    deepAssign: deepAssign,
    cache() {
        return (target, key, descr) => {
            const existed = descr.value;
            const cacheSymbol = Symbol("cache");
            descr.value = function (id) {
                if (!this[cacheSymbol]) this[cacheSymbol] = {};
                return this[cacheSymbol][id] ||
                    (this[cacheSymbol][id] = existed.call(this, id))
            };
            return descr;
        }
    },
    crc32(value) {
        return crc32.str(JSON.stringify(value));
    },
    throttle(func, wait, options = {leading: false, trailing: true}) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        var later = function() {
            previous = options.leading === false ? 0 : +new Date();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function() {
            var now = +new Date();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    },
    debounce(func, wait, immediate) {
        var timeout, previous, args, result, context;

        var later = function() {
            var passed = +new Date() - previous;
            if (wait > passed) {
                timeout = setTimeout(later, wait - passed);
            } else {
                timeout = null;
                if (!immediate) result = func.apply(context, args);
                // This check is needed because `func` can recursively invoke `debounced`.
                if (!timeout) args = context = null;
            }
        };

        var debounced = function(..._args) {
            context = this;
            args = _args;
            previous = +new Date();
            if (!timeout) {
                timeout = setTimeout(later, wait);
                if (immediate) result = func.apply(context, args);
            }
            return result;
        } as Function & {cancel?();}

        debounced.cancel = function() {
            clearTimeout(timeout);
            timeout = args = context = null;
        };

        return debounced;
    }
};

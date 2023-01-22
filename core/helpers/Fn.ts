import {ulid} from "./ulid";
import * as crc32 from "crc-32";
import {compare} from "./compare";
import {deepAssign} from "./deepAssign";
import {debounce} from "./debounce";
import {throttle} from "./throttle";
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
    debounce: debounce,
    throttle: throttle,
    cloneClass: function<T extends {
        new(...args): any;
    }>(t: T):T{
        const q = function (...args){
            Object.assign(this, new t(...args));
        }
        q.prototype = t.prototype;
        q.constructor = t.constructor;
        for (let key of Object.keys(t)) {
            q[key] = t[key];
            console.log(key)
        }
        return q as any;
    },
    deepExtend: function <T, U, TArgs extends Array<any> = []>(t: {
        new (...args: TArgs): T;
    }, u: {
        new (): U;
    }): {
        new (...args: TArgs): T & U
    } {
        const protos = [];
        for (let x = t; x !== Function.prototype; x = Object.getPrototypeOf(x)){
            protos.push(x);
        }

        let result = u;
        while (protos.length){
            const Q = Fn.cloneClass(protos.pop());
            Object.setPrototypeOf(Q.prototype, result.prototype);
            Object.setPrototypeOf(Q, result);
            result = Q;
        }
        return result as any;
    }
};

import { uuid } from './uuid';
import { compare } from './compare';
import { deepAssign } from './deepAssign';
import { debounce, Func, throttle } from './throttle';
import { pipe } from './pipe';
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
	uuid: uuid,
	pipe,
	join: (...functions: Array<(this: unknown, ...args: unknown[]) => unknown>) => {
		return function (...args) {
			for (const fn of functions) {
				fn?.apply(this, args);
			}
		};
	},
	asyncDelay(timeout = 0): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, timeout));
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
			const cacheSymbol = Symbol('cache');
			descr.value = function (id) {
				if (!this[cacheSymbol]) this[cacheSymbol] = {};
				return (
					this[cacheSymbol][id] ||
					(this[cacheSymbol][id] = existed.call(this, id))
				);
			};
			return descr;
		};
	},
};

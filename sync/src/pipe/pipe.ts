import { Operator } from './index';

export function pipe<T, U>(
	ai: AsyncIterable<T>,
	o: Operator<T, U>,
): AsyncIterable<U>;
export function pipe<T, T1, U>(
	ai: AsyncIterable<T>,
	o: Operator<T, T1>,
	o2: Operator<T1, U>,
): AsyncIterable<U>;
export function pipe<T, T1, T2, U>(
	ai: AsyncIterable<T>,
	o: Operator<T, T1>,
	o1: Operator<T1, T2>,
	o2: Operator<T2, U>,
): AsyncIterable<U>;
export function pipe<T, T1, T2, T3, U>(
	ai: AsyncIterable<T>,
	o: Operator<T, T1>,
	o1: Operator<T1, T2>,
	o2: Operator<T2, T3>,
	o3: Operator<T3, U>,
): AsyncIterable<U>;
export function pipe<T, U>(
	ai: AsyncIterable<T>,
	...chain: Array<Operator<unknown, unknown>>
): AsyncIterable<U> {
	return chain.reduce((ai, o: any) => o(ai), ai) as AsyncIterable<U>;
}

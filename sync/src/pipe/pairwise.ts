import { Operator, windowCount } from './index.ts';

export function pairwise<T>(): Operator<T, [T, T]> {
	return windowCount(2) as Operator<T, [T, T]>;
}

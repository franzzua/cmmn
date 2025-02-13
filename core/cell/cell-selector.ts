import { BaseCell } from './base-cell';
import { Cell } from './cell';

const ArrayWriteKeys: Array<
	Exclude<keyof Array<never>, keyof ReadonlyArray<never>>
> = [
	'push',
	'copyWithin',
	'fill',
	'pop',
	'reverse',
	'shift',
	'sort',
	'splice',
	'unshift',
];

const arrayBase = Object.fromEntries(
	ArrayWriteKeys.map((key) => [
		key,
		function (...args) {
			const value = this[BaseCell.Symbol].get();
			return value[key](...args);
		},
	]),
);

export function arraySelector<T>(cell: BaseCell<Array<T>>): Selector<Array<T>> {
	return new Proxy<ArraySelector<T>>(
		Object.assign(Object.create(arrayBase), {
			[BaseCell.Symbol]: cell,
			[Selector]: 'array',
		}) as ArraySelector<T>,
		{
			get(target: ArraySelector<T>, key: string | symbol, receiver: any): any {
				if (key == 'length') return cell.get().length;
				return (target[key] = selector(
					new Cell(() => cell.get()[key], {
						onExternal(value) {
							const current = cell.get().slice();
							current[key] = value;
							cell.set(current);
						},
					}),
				));
			},
		},
	);
}

export function objectSelector<T extends object>(
	cell: BaseCell<T>,
): ObjectSelector<T> {
	return new Proxy<ObjectSelector<T>>(
		{
			[BaseCell.Symbol]: cell,
			[Selector]: 'object',
		} as ObjectSelector<T>,
		{
			get(target: ObjectSelector<T>, key: string | symbol, receiver: any): any {
				return (target[key] = selector(
					new Cell(() => cell.get()[key], {
						onExternal(value) {
							const current = cell.get();
							cell.set({
								...current,
								[key]: value,
							});
						},
					}),
				));
			},
		},
	);
}

const Selector: unique symbol = Symbol('Selector');

export function selector<T>(cell: BaseCell<T>): Selector<T> {
	const value = cell.get();
	const current = cell[Selector];
	switch (typeof value) {
		case 'object':
			if (Array.isArray(value)) {
				if (current?.[Selector] == 'array') return current;
				return (cell[Selector] = arraySelector(
					cell as BaseCell<T & unknown[]>,
				) as Selector<T>);
			}
			if (current?.[Selector] == 'object') return current;
			return (cell[Selector] = objectSelector(
				cell as BaseCell<T & object>,
			) as Selector<T>);
		default:
			if (current instanceof BaseCell) return current as Selector<T>;
			return (cell[Selector] = cell as Selector<T>);
	}
}

export type ArraySelector<T> = Omit<Array<T>, keyof ReadonlyArray<T>> &
	ReadonlyArray<Selector<T>> & {
		[BaseCell.Symbol]: BaseCell<Array<T>>;
		[Selector]: 'array';
	};
export type ObjectSelector<T> = {
	readonly [key in keyof T]: Selector<T[key]>;
} & {
	/** @internal **/
	[BaseCell.Symbol]: BaseCell<T>;
	/** @internal **/
	[Selector]: 'object';
};

export type Selector<T> = T extends Array<infer U>
	? ArraySelector<U>
	: T extends object
		? ObjectSelector<T>
		: BaseCell<T>;

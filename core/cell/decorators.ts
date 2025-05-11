import { type BaseCell, Cell, type ICellOptions } from '../cell';

type ClassAccessorDecorator<TClass, T> = (
	initial: ClassAccessorDecoratorTarget<TClass, T>,
	context: ClassAccessorDecoratorContext<TClass, T>,
) => ClassAccessorDecoratorResult<TClass, T>;

type ClassGetterDecorator<TClass, T> = (
	initial: (this: TClass) => T,
	context: ClassGetterDecoratorContext<TClass, T>,
) => (this: TClass) => T;

type ClassSetterDecorator<TClass, T> = (
	initial: (this: TClass, value: T) => void,
	context: ClassSetterDecoratorContext<TClass, T>,
) => (this: TClass, value: T) => void;

type CellDecorator<TClass, T> = ClassAccessorDecorator<TClass, T> &
	ClassSetterDecorator<TClass, T> &
	ClassGetterDecorator<TClass, T>;
// 	(
// 	initial: any,
// 	context:
// 		| ClassAccessorDecoratorContext<TClass, T>
// 		| ClassFieldDecoratorContext<TClass, T>
// 		| ClassGetterDecoratorContext<TClass, T>
// 		| ClassSetterDecoratorContext<TClass, T>
// 		| ClassMethodDecoratorContext<TClass, (this: TClass, ...args: any) => T>
// ) => ((this: TClass, value: T | undefined) => T) & ClassAccessorDecoratorResult<TClass, T>;

export function cell<T, TClass = unknown>(
	options: ICellOptions<T> = {},
): CellDecorator<TClass, T> {
	return ((initialValue, context) => {
		switch (context.kind) {
			case 'getter': {
				const getter = initialValue as (this: TClass) => T;
				return function (this: TClass): T {
					return getOrCreateCell(
						this as never,
						context.name,
						() => new Cell(getter.bind(this), options),
					).get();
				};
			}
			case 'setter': {
				const setter = initialValue as (this: TClass, value: T) => T;
				return function (this: TClass, value: T) {
					getOrCreateCell(
						this as never,
						context.name,
						() => new Cell(() => this[context.name]),
					).set(value);
					setter.call(this, value);
				};
			}
			case 'accessor': {
				const target = initialValue as ClassAccessorDecoratorTarget<TClass, T>;
				const createCell = (self: TClass) => {
					const startValue = options?.startValue ?? target.get.call(self);
					options.startValue = undefined;
					return new Cell(startValue, options);
				};
				return {
					get(this: TClass) {
						return getOrCreateCell(this as never, context.name, () =>
							createCell(this),
						).get();
					},
					set(this: TClass, value: T) {
						return getOrCreateCell(this as never, context.name, () =>
							createCell(this),
						).set(value);
					},
				} as ClassAccessorDecoratorResult<TClass, T>;
			}
		}
	}) as CellDecorator<TClass, T>;
}

const cellsSymbol = Symbol('@cells');

export function getOrCreateCell<T>(
	instance: {
		[cellsSymbol]: Map<string | symbol, BaseCell<unknown>>;
	},
	prop: string | symbol,
	createCell?: () => BaseCell<T>,
): BaseCell<T> {
	const map = (instance[cellsSymbol] ??= new Map());
	let result = map.get(prop);
	if (!result && createCell) {
		map.set(prop, (result = createCell()));
	}
	return result as BaseCell<T>;
}


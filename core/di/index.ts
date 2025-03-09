import { Container } from './container';
import type {ConstructorOf, InjectionToken} from './types';
type FieldDecoratorResult<T, This> = (this: This, value: T) => T
type FieldDecorator<T, This> = (_: T, ctx: ClassFieldDecoratorContext) =>
	FieldDecoratorResult<T, This>;
type AccessorDecoratorResult<T, This> = {
	get?(this: This): T;
	set?(this: This, value: T): void;
	init?(this: This): void;
};
type AccessorDecorator<T, This> = (_: T, ctx: ClassAccessorDecoratorContext) =>
	AccessorDecoratorResult<T, This>

export const inject = <T>(dep: InjectionToken<T>): FieldDecorator<T, unknown> & AccessorDecorator<T, unknown> => {
	return ((
		_: unknown,
		ctx,
	) => {
		if (ctx.kind === 'field')
			return function (this: unknown) {
				return resolve(dep) as T;
			} as unknown as (AccessorDecoratorResult<T, unknown> & FieldDecoratorResult<T, unknown>);
		if (ctx.kind === 'accessor') {
			return {
				init() {
					return resolve(dep);
				},
			} as unknown as (AccessorDecoratorResult<T, unknown> & FieldDecoratorResult<T, unknown>);
		}
	});
};

export function scoped<TClass extends ConstructorOf<unknown>>() {
	return (target: ConstructorOf<unknown>, context: ClassDecoratorContext<TClass>) => {
		di.factory(target, () => new target());
	};
}

export function factory<T>(
	dep: ConstructorOf<T>,
	factory: (c: Container) => T,
) {
	di.factory(dep, factory);
}

// const scopeds = new Set<ConstructorOf<any>>();

export const di = Container.Default;
export const resolve = <T>(dep: InjectionToken<T>) =>
	Container.Default.resolve(dep);

const t: InjectionToken<Container> = Container;
export { Container };
export type { InjectionToken };

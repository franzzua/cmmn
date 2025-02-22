import { Container } from './container';
import type {ConstructorOf, InjectionToken} from './types';

type FieldDecorator<T, This> = (_: T, ctx: ClassFieldDecoratorContext) => (this: This, value: T) => T;
type AccessorDecorator<T, This> = (_: T, ctx: ClassAccessorDecoratorContext) => {
	get?(this: This): T;
	set?(this: This, value: T): void;
	init?(this: This): void;
};

export const inject = <T>(dep: InjectionToken<T>) => {
	return ((
		_: unknown,
		ctx: ClassFieldDecoratorContext | ClassAccessorDecoratorContext,
	) => {
		if (ctx.kind === 'field')
			return function (this: unknown) {
				return resolve(dep) as T;
			};
		if (ctx.kind === 'accessor') {
			return {
				init() {
					return resolve(dep);
				},
			};
		}
	}) as (FieldDecorator<T, unknown> | AccessorDecorator<T, unknown>);
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

// const singletons = new Set<ConstructorOf<any>>();

export const di = Container.Default;
export const resolve = <T>(dep: InjectionToken<T>) =>
	Container.Default.resolve(dep);

const t: InjectionToken<Container> = Container;
export { Container };

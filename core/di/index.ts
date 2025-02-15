import { Container } from './container';
import type { ConstructorOf } from './types';
import * as console from 'node:console';

export const inject = <T>(dep: ConstructorOf<T, unknown[]> | symbol) => {
	return (
		initial: T | undefined,
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
	};
};

export function singleton<TClass extends ConstructorOf<unknown>>() {
	return (target: unknown, context: ClassDecoratorContext<TClass>) => {
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
export const resolve = <T>(dep: ConstructorOf<T> | symbol) =>
	Container.Default.resolve(dep);
export { Container };

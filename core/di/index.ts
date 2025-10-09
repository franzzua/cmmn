import {Container} from './container';
import type {ConstructorOf, InjectionToken} from './types';
export {injectLazy, inject} from "./injectLazy";

export function scoped<TClass extends ConstructorOf<unknown, any[]>>() {
	return (target: ConstructorOf<unknown, any[]>, context: ClassDecoratorContext<TClass>) => {
		di.scoped(target);
	};
}

export function singleton<TClass extends ConstructorOf<unknown, any[]>>() {
	return (target: ConstructorOf<unknown, any[]>, context: ClassDecoratorContext<TClass>) => {
		di.factory(target, () => new target());
	};
}

export function factory<T>(
	dep: ConstructorOf<T>,
	factory: (c: Container) => T,
) {
	di.factory(dep, Object.assign(factory, { isScoped: true}));
}

export const di = Container.Current;
export const resolve = <T>(dep: InjectionToken<T, any>) =>
	Container.Current.resolve(dep);

export { Container };
export type { InjectionToken };

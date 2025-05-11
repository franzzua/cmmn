import type {
	AccessorDecorator,
	FieldDecorator,
	InjectionToken
} from "./types";
import {Container} from "./container";
import {resolve} from "./index";

export const injectLazy = <T, This>(dep: () => InjectionToken<T>): AccessorDecorator<This, T> & FieldDecorator<This, T> => {
	return ((
		_: unknown,
		ctx,
	) => {
		if (ctx.kind === 'field')
			return function (this: unknown) {
				return resolve(dep()) as T;
			} as unknown;
		if (ctx.kind === 'accessor') {
			const instances = new WeakMap();
			const containers = new WeakMap();
			return {
				init() {
					containers.set(this, Container.Default);
				},
				get() {
					if (!instances.has(this)) {
						instances.set(this, containers.get(this).resolve(dep()))
					}
					return instances.get(this);
				}
			} as unknown;
		}
	}) as FieldDecorator<This, T> & AccessorDecorator<This, T>;
};

export const inject = <T, This = unknown>(dep: InjectionToken<T>): AccessorDecorator<This, T> & FieldDecorator<This, T> => {
	return injectLazy(() => dep);
}
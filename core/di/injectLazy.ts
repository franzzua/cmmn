import type {
	AccessorDecorator,
	AccessorDecoratorResult,
	FieldDecorator,
	FieldDecoratorResult,
	InjectionToken
} from "./types";
import {Container} from "./container";
import {resolve} from "./index";

export const injectLazy = <T>(dep: () => InjectionToken<T>): FieldDecorator<T, unknown> & AccessorDecorator<T, unknown> => {
	return ((
		_: unknown,
		ctx,
	) => {
		if (ctx.kind === 'field')
			return function (this: unknown) {
				return resolve(dep()) as T;
			} as unknown as (AccessorDecoratorResult<T, unknown> & FieldDecoratorResult<T, unknown>);
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
			} as unknown as (AccessorDecoratorResult<T, unknown> & FieldDecoratorResult<T, unknown>);
		}
	});
};
import { Component } from './component';
import {cell, Fn, ICellOptions} from '@cmmn/core';
import {ComponentRegistry} from "./registry";

export type IComponentOptions = {
	name?: `${string}-${string}`;
	scoped?: boolean;
};

export function component<This extends Component>(opts: IComponentOptions = {}) {
	return (
		target: {
			new (): This;
			componentName: string;
		},
		context: ClassDecoratorContext<abstract new () => This>,
	) => {
		// target.Name = opts.name;
		const attrs = context.metadata.observedAttributes as
			| Record<string, string | symbol>
			| undefined;
		if (attrs) {
			Object.defineProperty(target, 'observedAttributes', {
				get() {
					return Object.keys(attrs);
				},
			});
		}
		target.prototype.attributeChangedCallback = Fn.join(
			target.prototype.attributeChangedCallback,
			function (
				key,
				oldValue,
				newValue,
			) {
				this[key as keyof This] = newValue;
			}
		)
		ComponentRegistry.Instance.register(target, opts);
	};
}

export function property<T, This extends Component>(
	options: {
		name?: string;
	} & ICellOptions<T> = {},
) {
	return function (
		initial,
		context: ClassAccessorDecoratorContext<This, T>,
	) {
		const attrName = options?.name ?? toSnake(context.name.toString());
		const set = (context.metadata.observedAttributes ??= {}) as Record<
			string,
			string | Symbol
		>;
		set[attrName] = context.name;
		return cell<T, This>({
			...(options ?? {}),
		})(initial as any, context as any);
	};
}

export function toSnake(str: string): string {
	return str.replace(/[A-Z]/g, function (word, index) {
		return index === 0 ? word.toLowerCase() : '-' + word.toLowerCase();
	});
}

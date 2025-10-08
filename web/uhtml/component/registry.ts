import {Component} from "./component";
import {IComponentOptions, toSnake} from "./decorators";
import {InjectionToken} from "@cmmn/core";

export class ComponentRegistry {
	public static Instance = new ComponentRegistry();

	private constructor() { }

	register(target: {
		new (): Component;
		componentName: string;
	}, options: IComponentOptions){
		if (options.scoped){
			Object.defineProperty(target, diSymbol, {
				get(): any {
				}
			})
		}
		const name = options.name ?? toSnake(target.name);
		target.componentName = name;
		if (!customElements.get(name))
			customElements.define(name, target);
	}
}

const diSymbol = Symbol('DI');

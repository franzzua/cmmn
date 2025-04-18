export {useCell, useCelled} from './src/useCell';
export {useInjected} from './src/useInjected';
export {component, effect} from "./src/component";
export {Component} from "./src/component";

export function cn(...args: Array<string | Record<string, any>>) {
	return [...cnGenerator(args)].join(' ');
}

function* cnGenerator(args: Array<string | Record<string, any>>) {
	for (let arg of args) {
		if (typeof arg === "string")
			yield arg;
		else for (const key in arg) {
			if (arg[key])
				yield key;
		}
	}
}
export {useCell, useCelled} from './src/useCell.ts';
export {useInjected} from './src/useInjected.ts';
export {component, effect} from "./src/component.tsx";
export {Component} from "./src/component.tsx";
export {Scope} from "./src/scope.tsx";
export {ReactRouter, type ReactRouteData} from "./src/react.router.tsx";
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
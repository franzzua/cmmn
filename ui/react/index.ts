export {useCell, useCelled, Component, component} from './src/useCell';
export {useInjected} from './src/useInjected';

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
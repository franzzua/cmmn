import { attr } from 'uhtml';

attr.set('class', (el, value) => {
	const res = Array.from(cn(value)).join(' ');
	if (res != el.className)
		el.className = res;
});

type ClassArgument =
	| string
	| number
	| Record<string, boolean>
	| Array<ClassArgument>;

function* cn(value: ClassArgument) {
	if (!value) return;
	switch (typeof value) {
		case 'object': {
			if (Symbol.iterator in value) for (let x of value) yield* cn(x);
			else
				for (let x in value) {
					if (value[x]) yield x;
				}
			break;
		}
		case 'string':
			yield value;
			break;
		default:
			yield value.toString();
			break;
	}
}

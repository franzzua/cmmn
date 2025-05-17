import {cell, ICellOptions} from "@cmmn/core";

export function stored<T, TClass = unknown>(
	key: string,
	options?: ICellOptions<T> & {
		storage?: typeof localStorage | typeof sessionStorage;
	},
) {
	const storage = options?.storage ?? localStorage;
	return cell({
		...options,
		startValue: JSON.parse(storage.getItem(key) ?? 'null') as T,
		onExternal: (value) => {
			if (value === undefined) {
				storage.removeItem(key);
			} else {
				storage.setItem(key, JSON.stringify(value));
			}
			options?.onExternal?.(value);
		},
	});
}
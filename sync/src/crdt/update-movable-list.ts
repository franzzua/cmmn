export function updateMovableList<T>(list: IMovableList<T>, value: ReadonlyArray<T>) {
	for (let i = 0, j = 0; i < value.length || j < list.length;) {
		const state = list.toArray();
		console.log([...state.slice(0, j), '|', ...state.slice(j)], '->', [...value.slice(0, i), '|', ...value.slice(i)]);
		const current = list.get(j);
		if (value[i] === current) {
			i++;
			j++;
			continue;
		}
		if (j >= list.length){
			list.push(value[i]);
			i++;
			j++;
			continue;
		}
		if (i >= value.length){
			list.delete(j, list.length - j);
			continue;
		}
		if (!state.includes(value[i])) {
			// added
			list.insert(j, value[i]);
			i++;
			j++;
			continue;
		}
		const index = value.indexOf(current, j);
		if (index == -1) {
			list.delete(j, 1);
		} else if (index < list.length) {
			list.move(j, index);
		} else {
			list.insert(j, value[i]);
			i++;
			j++;
		}
	}
}

export type IMovableList<T> = {
	toArray(): T[];
	delete(index: number, count: number);
	move(from: number, to: number);
	length: number;
	get(index: number): T;
	insert(index: number, value: T);
	push(value: T);
}


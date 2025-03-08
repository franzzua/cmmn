import {useRef, useSyncExternalStore} from 'react';
import {BaseCell, Cell, ICellOptions} from '@cmmn/core';

export function useCell<T>(
	getter: (() => T) | BaseCell<T> | undefined,
	options?: ICellOptions<T>
): T {
	const cellRef = useRef<{
		cell: BaseCell<T>;
		state: symbol;
		getSnapshot(): symbol;
		subscribe(onChange): void;
	} | null>(null);

	if (!cellRef.current && getter) {
		const value = (cellRef.current = {
			cell: getter instanceof BaseCell ? getter : new Cell<T>(getter, options),
			state: Symbol(),
			getSnapshot() {
				return value.state;
			},
			subscribe(onChange) {
				value.cell.on('change', (e) => {
					onChange(value.state = Symbol());
				});
			},
		});
	}
	useSyncExternalStore(
		cellRef.current.subscribe,
		cellRef.current.getSnapshot,
		cellRef.current.getSnapshot,
	);

	return cellRef.current.cell.value;
}

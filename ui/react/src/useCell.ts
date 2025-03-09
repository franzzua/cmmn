import {useEffect, useMemo, useRef, useSyncExternalStore} from 'react';
import {BaseCell, Cell, ICellOptions} from '@cmmn/core';

export function useCell<T>(
	getter: (() => T) | BaseCell<T> | undefined,
	options?: ICellOptions<T>
): T {
	const cellRef = useMemo<{
		cell: BaseCell<T>;
		state: symbol;
		getSnapshot(): symbol;
		subscribe(onChange: () => void): () => void;
	} | null>(() => {
		const value = {
			cell: getter instanceof BaseCell ? getter : new Cell<T>(getter, options),
			state: Symbol(),
			getSnapshot() {
				return value.state;
			},
			subscribe(onChange: () => void) {
				return value.cell.on('change', (e) => {
					value.state = Symbol()
					onChange();
				});
			},
		};
		return value;
	}, []);
	useEffect(() => cellRef.cell.on('change', () => {}), []);
	useSyncExternalStore(
		cellRef.subscribe,
		cellRef.getSnapshot,
		cellRef.getSnapshot,
	);
	return cellRef.cell.get();
}

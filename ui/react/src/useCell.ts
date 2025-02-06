import { useRef, useSyncExternalStore } from 'react';
import { BaseCell } from '@cmmn/core';

export function useCell<T>(getter: (() => T) | BaseCell<T> | undefined, deps: any[] = []): T {
    if (!getter || getter instanceof BaseCell) deps.push(getter);
    console.log('useRef', useRef)
    const cellRef = useRef<{
        cell: BaseCell<T>;
        state: symbol;
        getSnapshot(): symbol;
        subscribe(onChange): void;
    } | null>(null);

    if (!cellRef.current && getter){
        const value = cellRef.current = {
            cell: getter instanceof BaseCell ? getter : new BaseCell<T>(getter),
            state: Symbol(),
            getSnapshot(){
                return this.state;
            },
            subscribe(onChange) {
                value.cell.on('change', e => {
                    onChange(value.state);
                })
            }
        };
    }
    useSyncExternalStore(
        cellRef.current.subscribe,
        cellRef.current.getSnapshot,
        cellRef.current.getSnapshot,
    );

    return cellRef.current.cell.value;
}
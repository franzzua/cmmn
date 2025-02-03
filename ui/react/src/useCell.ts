import { useEffect, useMemo, useReducer } from 'react';
import { BaseCell, Cell, compare } from '@cmmn/core';

export function useCell<T>(getter: (() => T) | BaseCell<T> | undefined, deps: any[] = []): T {
    if (!getter || getter instanceof BaseCell) deps.push(getter);
    const cell = useMemo<BaseCell>(
        () => (getter instanceof BaseCell ? getter : new Cell(getter, { compare })),
        deps
    );
    // @ts-ignore
    const [, dispatch] = useReducer((x) => ({}), {});
    useEffect(() => {
        dispatch();
        return cell?.on('change', dispatch);
    }, [cell]);
    return cell.get();
}

export function select<T extends {
    [k in TKey]?: unknown
}, TKey extends keyof T>(cell: BaseCell<T | undefined>, key: TKey) : BaseCell<T[TKey] | undefined> {
    return new Cell(() => cell.get()?.[key], {
        onExternal: v => cell.set({
            ...(cell.get() || {}),
            [key]: v
        } as never)
    })
}

const c = new Cell<{a: Number}>({a: 1});
c.$.Selector
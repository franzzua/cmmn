import {FC, ReactNode, useEffect, useMemo, useSyncExternalStore} from 'react';
import {BaseCell, Cell, ICellOptions, InjectionToken} from '@cmmn/core';
import {useInjected} from "./useInjected";
import {JsxElement} from "typescript";

export function useCell<T>(
	getter: (() => T) | BaseCell<T> | undefined,
	options?: ICellOptions<T>
): T {
	const cellRef = useMemo(() =>
			new CellRef(getter instanceof BaseCell ? getter : new Cell<T>(getter, options)),
		getter instanceof BaseCell ? [getter] : []
	);
	useEffect(() => cellRef.unsubscribe, []);
	return useSyncExternalStore(
		cellRef.subscribe,
		cellRef.getSnapshot,
		cellRef.getSnapshot,
	).value;
}

type TInstances<TDeps extends InjectionToken[]> = [...(
	TDeps extends [(new () => infer TInstance), ...(infer TOther)]
		? [TInstance, ...TInstances<TOther>]
		: []
	)];

export function useCelled<TProps = {}, TDeps extends InjectionToken[]>(
	render: ((...TDeps: TInstances<TDeps>) => JsxElement), ...deps: TDeps): JsxElement {
	const instances = deps.map(dep => useInjected(dep)) as TDeps;
	return useCell(() => render(...instances));
}

export function celled<TProps = {}, TDeps extends InjectionToken[]>(
	render: (props: TProps, ...TDeps: TInstances<TDeps>) => any,
	...deps: TDeps
): FC<TProps> {
	const component = (props: TProps) => {
		const instances = deps.map(dep => useInjected(dep)) as TDeps;
		return useCell(() => render(props, ...instances));
	};
	// @ts-nocheck
	// component.name = render.name;
	return component as FC<TProps>;
}

class CellRef<T> {
	constructor(private cell: BaseCell<T>) {

	}

	state: { value: T } | undefined;

	getSnapshot = () => {
		return this.state ??= {value: this.cell.value};
	}

	subscribe = (onChange: () => void) => {
		return this.cell.on('change', onChange);
	}

	unsubscribe = this.cell.on('change', () => {
		this.state = {value: this.cell.value};
	})
}
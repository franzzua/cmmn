import {ReactNode, useEffect, useMemo, useSyncExternalStore} from 'react';
import {BaseCell, Cell, di, ICellOptions, InjectionToken} from '@cmmn/core';
import {useInjectedFrom} from "./useInjected";
import {Props} from "./props";

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

type TToken<TProps, T> = new (props: TProps) => T;
type TTokens<TProps, TInstances> = [...(
	TInstances extends [infer TInstance, ...(infer TOther)]
		? [TToken<TProps, TInstances>, ...TTokens<TProps, TOther>]
		: []
	)]

type TInstances<TProps, TDeps extends InjectionToken<unknown, [TProps]>[]> = [...(
	TDeps extends [(new (props: TProps) => infer TInstance), ...(infer TOther)]
		? [TInstance, ...TInstances<TProps, TOther & InjectionToken[]>]
		: []
	)];

export function useCelled<TProps = {}, TDeps extends InjectionToken<unknown, [TProps]>[] = []>(
	props: TProps,
	render: ((...TDeps: TInstances<TProps, TDeps>) => unknown),
	...deps: TDeps
): ReactNode {
	const container = useMemo(() => di.child(), []);
	container.resolve(Props).set(props);
	const instances = deps.map(dep => useInjectedFrom(container, dep)) as TInstances<TProps, TDeps>;
	useEffect(() => {
		return () => {
			container[Symbol.asyncDispose]();
		};
	}, []);
	return useCell(() => render(...instances)) as ReactNode;
}

class CellRef<T> {
	private unsubscribe: () => void;
	constructor(private cell: BaseCell<T>) {
		this.unsubscribe = this.cell.on('change', () => {
			this.state = {value: this.cell.value};
		})
	}

	state: { value: T } | undefined;

	getSnapshot = () => {
		return this.state ??= {value: this.cell.value};
	}

	subscribe = (onChange: () => void) => {
		return this.cell.on('change', onChange);
	}

}


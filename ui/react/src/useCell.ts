import {FC, memo, ReactNode, useEffect, useMemo, useSyncExternalStore} from 'react';
import {BaseCell, Cell, di, getOrAdd, ICellOptions, inject, InjectionToken, scoped} from '@cmmn/core';
import {useInjected, useInjectedContainer} from "./useInjected";

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

type TInstances<TProps, TDeps extends InjectionToken[]> = [...(
	TDeps extends [(new (props: TProps) => infer TInstance), ...(infer TOther)]
		? [TInstance, ...TInstances<TProps, TOther>]
		: []
	)];

export function useCelled<TProps = {}, TDeps extends InjectionToken<unknown, [TProps]>[]>(
	props: TProps,
	render: ((...TDeps: TInstances<TProps, TDeps>) => unknown),
	...deps: TDeps
): ReactNode {
	const container = useMemo(() => di.child(), []);
	container.resolve(Props).set(props);
	const instances = deps.map(dep => useInjectedContainer(container, dep)) as TDeps;
	useEffect(() => {
		return () => {
			container[Symbol.asyncDispose]();
		};
	}, []);
	return useCell(() => render(...instances)) as ReactNode;
}

@scoped()
class Props<TProps> {
	#cells = new Map<string | symbol, Cell>();

	set(props) {
		for (let key in props) {
			getOrAdd(this.#cells, key, (key) => {
				const cell = new BaseCell(undefined);
				Object.defineProperty(this, key, {
					get(): any {
						return cell.get();
					},
					set(value) {
						cell.set(value);
					},
					enumerable: true
				})
				return cell;
			}).set(props[key]);
		}
	}

	[Symbol.dispose]() {
		for (let value of this.#cells.values()) {
			value[Symbol.dispose]();
		}
		this.#cells.clear();
	}
}

export abstract class Component<TProps = {}> implements FC<TProps> {
	protected readonly props: TProps;
	private _render = this.render?.bind(this);

	protected render(){}

	protected fc(){
		return useCell(this._render);
	}
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

export function component(){
	return (target) => {
		return props => {
			const instance = useInjected(target);
			instance.props = useMemo(() => new Props(), []);
			instance.props.set(props);
			return instance.fc();
		};
	}
}
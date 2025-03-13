import {Store} from './store';
import {useCell, useInjected} from "@cmmn/react";
import {Cell, inject, scoped} from "@cmmn/core";
import {Component, memo, useMemo, useRef, useState, useSyncExternalStore} from "react";

export const App = () => {
	const store = useInjected(Store);

	return useCell(() => <>
		<div style={{display: 'flex', gap: '1em'}}>
			Hi there: <span>{store.value}</span>
			<button onClick={() => store.value++}>Increment</button>
		</div>
	</>);
};


export abstract class BaseComponent<Props = {}> {
	public props: Props;
	public cell = new Cell(() => this.render(this.props));
	public renderInstance = Symbol()

	protected render() {

	}
}

// const component = () => function <This extends BaseComponent>(target: new() => This, context: ClassDecoratorContext) {
// 	return memo((props, ctx) => {
// 		const instance = new target();
// 		instance.props = props;
// 		let listener: ((s: symbol) => void) | undefined
// 		const cell = useMemo(() => new Cell(() => instance.render(), {
// 			onExternal() {
// 				listener?.(instance.renderInstance = Symbol())
// 			}
// 		}), []);
// 		useSyncExternalStore(
// 			e => {
// 				listener = e;
// 			},
// 			() => instance.renderInstance,
// 			() => instance.renderInstance,
// 		);
// 		instance.cell.active();
// 		return instance.cell.get();
// 	}) as unknown as (new () => This & Component);
// }

@scoped()
export class Counter extends BaseComponent<{value: any}> {
	@inject(Store) private accessor store!: Store;

	ref = useRef<HTMLDivElement>(null);

	inc = () => {
		return this.store.value++;
	};

	render() {
		console.log('render', this.props.value)
		return <>
			<div ref={this.ref} style={{display: 'flex', gap: '1em'}}>
				Hi there: <span>{this.store.value}</span>
				<button onClick={this.inc}>Increment</button>
			</div>
		</>
	}
}
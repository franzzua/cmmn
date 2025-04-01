import {useInjectedContainer} from "./useInjected";
import {FC, useContext, useEffect, useMemo} from "react";
import {useCell} from "./useCell";
import {Props} from "./props";
import {DIContext} from "./DIContext";
import {di} from "@cmmn/core";

export function component(options: {
	scoped: boolean
} = {}) {
	return (target) => {
		const c = props => {
			const di = useContext(DIContext);
			const container = useMemo(() => {
				if (!options.scoped) {
					return di;
				}
				const child = di.child();
				child.scoped(target);
				child.override(c as any, target);
				return child;
			}, [di]);

			const instance = useInjectedContainer(container, target);
			instance.props = useMemo(() => new Props(), []);
			useEffect(() => {
				if (options.scoped){
					return () => {
						container[Symbol.asyncDispose]();
					}
				}
			}, [container])
			instance.props.set(props);
			return instance.fc();
		};
		Object.defineProperty(c, 'name', { value: target.name });
		return c;
	}
}


export abstract class Component<TProps = {}> implements FC<TProps> {
	protected readonly props: TProps;
	private _render = this.render?.bind(this);

	protected render() {
	}

	protected fc() {
		return useCell(this._render);
	}
}
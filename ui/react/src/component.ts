import {useInjected} from "./useInjected";
import {FC, memo, useMemo} from "react";
import {useCell} from "./useCell";
import {Props} from "./props";

export function component() {
	return (target) => {
		const c = props => {
			const instance = useInjected(target);
			instance.props = useMemo(() => new Props(), []);
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
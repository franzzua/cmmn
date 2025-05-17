import {useInjectedContainer} from "./useInjected";
import {FC, useContext, useEffect, useMemo} from "react";
import {useCell} from "./useCell";
import {Props} from "./props";
import {DIContext} from "./DIContext";
import {Cell, di} from "@cmmn/core";

export function component(options: {
	scoped?: boolean
} = {}) {
	return <This extends Component>(target: new () => This) => {
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
			useEffect(() => {
				return () => {
					instance[Symbol.dispose]();
					if (options.scoped) {
						container[Symbol.asyncDispose]();
					}
				}
			}, [container]);
			for (let effect of instance.effects) {
				useEffect(() => Cell.OnChange(() => effect.call(instance),
					e => e.oldValue?.()
				), [])
			}
			instance.setProps(props);
			return instance.fc();
		};
		Object.defineProperty(c, 'name', {value: target.name});
		return c as unknown as new () => This;
	}
}

export function effect<This extends Component>() {
	return function (method: Effect, context: ClassMethodDecoratorContext<This>) {
		context.addInitializer(function (this: This) {
			this.effects.push(method);
		})
	}
}

type Effect = () => void | (() => unknown)

//@ts-expect-error
export abstract class Component<TProps = {}> implements FC<TProps>, Disposable {
	/** @internal **/
	public effects: Effect[] = [];
	protected readonly props: TProps = new Props() as TProps;

	/** @internal **/
	setProps(props: TProps) {
		(this.props as Props<TProps>).set(props);
	}

	private _render = () => {
		try {
			return this.render()
		} catch (e) {
			return e?.toString() + e?.stack;
		}
	}

	protected render() {
	}

	public fc() {
		return useCell(this._render);
	}

	[Symbol.dispose](){

	}
}
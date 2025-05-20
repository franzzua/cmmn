import {useInjectedFrom} from "./useInjected";
import React, {
	FC,
	ReactNode,
	useContext,
	useEffect,
	useMemo,
	Component as ReactComponent,
	FunctionComponent
} from "react";
import {useCell} from "./useCell";
import {Props} from "./props";
import {DIContext} from "./DIContext";
import {Cell, di} from "@cmmn/core";

export function component(options: {
	scoped?: boolean
} = {}) {
	return <Props, This extends Component<Props>, TClass extends new () => This>(target: TClass, context: ClassDecoratorContext) => {
		const c = (props: Props) => {
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

			const instance = useInjectedFrom<This>(container, target);
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
		return c as unknown as TClass;
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

export class Component<TProps = {}> implements Disposable {
	private abort = new AbortController();
	protected get signal() { return this.abort.signal }
	/** @internal **/
	public effects: Effect[] = [];
	public static props: { va: number };
	public props: TProps = new Props() as TProps;

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

	protected render(): ReactNode {
		return null;
	}

	public fc(): ReactNode {
		return useCell(this._render);
	}

	[Symbol.dispose]() {
		this.abort.abort();
	}
}


@component()
class App extends Component<{
	id: { value: number };
}> {

	protected render(): React.ReactNode {
		return <>
			<Wrapper/>
			<OldComponent id={+this.props.id}/>
		</>;
	}
}

function Wrapper(){
	return <App id={{ value: 1}}></App>
}
class OldComponent extends ReactComponent<{ id: number}> {
	render() {
		return <App id={{ value: this.props.id }}/>;
	}
}
import {CRDT} from "@cmmn/sync";
import {inject} from "@cmmn/core";
import {CounterStore} from "./counter.store";
import {css} from "@acab/ecsstatic";
import {Button} from "@cmmn/examples-ui-lib";
import {cn, Component, component, effect} from "@cmmn/react";

@component({scoped: true})
export class Counter extends Component<{
	counter: CRDT.Counter;
	active: boolean;
}> {
	@inject(CounterStore)
	protected accessor store!: CounterStore;

	public get counter() {
		return this.props.counter;
	}

	changes = [];

	@effect()
	listenChanges() {
		return this.props.counter.subscribe(e => {
			this.changes = [...this.changes, e];
			while (this.changes.length > 5)
				this.changes.shift();
		})
	}

	private style = {
		container: css`
            display: flex;
            flex-direction: row;
            gap: 1em;
            align-items: center;
		`,
		loading: css`
            opacity: .3;
		`
	}

	protected render() {
		const className = cn(
			this.style.container,
			!this.props.active && this.style.loading
		);

		return (<div className={className}>
			<code>{this.store.value}</code>
			<Button onClick={this.store.inc}>Inc</Button>
			<Button onClick={this.store.dec}>Dec</Button>
			<ol>
				{this.changes.map((x, i) => <li key={i}>{JSON.stringify(x)}</li>)}
			</ol>
		</div>)
	}
}
import {resolve} from "@cmmn/core";
import {CounterStore} from "./counter.store";
import {css, } from "@acab/ecsstatic";
import {Button} from "@cmmn/examples-ui-lib";
import {cn, Component, component} from "@cmmn/react";

@component({ scoped: true })
export class Counter extends Component<{ active: boolean; }> {
	protected readonly store = resolve(CounterStore);

	private get style() {
		return {
			container: css`
                display: flex;
                flex-direction: row;
                gap: 1em;
                align-items: center;
				background: var(--bg);
			`,
			loading: css`
	            opacity: .3;
			`
		}
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
				{this.store.incrementHistory.map((x, i) => <li key={i}>{x}</li>)}
			</ol>
		</div>)
	}
}


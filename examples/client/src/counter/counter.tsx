import {Fn, resolve} from "@cmmn/core";
import {CounterModel} from "./counterModel";
import {css, } from "@acab/ecsstatic";
import {Button} from "@cmmn/examples-ui-lib";
import {cn, Component, component} from "@cmmn/react";
import {DraggableContext} from "../draggable/draggable.context";

@component()
export class Counter extends Component<{ active: boolean; model: CounterModel;}> {
	protected get model(): CounterModel {
		return this.props.model;
	}
	private draggable = resolve(DraggableContext);

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

		return (<div className={className} ref={Fn.join(
			this.draggable.setTarget(this.model.counter),
			this.draggable.setDraggable(this.model.counter)
		)}>
			<code>{this.model.value}</code>
			<Button onClick={this.model.inc}>Inc</Button>
			<Button onClick={this.model.dec}>Dec</Button>
			<ol>
				{this.model.incrementHistory.map((x, i) => <li key={i}>{x}</li>)}
			</ol>
		</div>)
	}
}


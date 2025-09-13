import {component, Component, effect, Scope} from "@cmmn/react";
import {resolve} from "@cmmn/core";
import {Button} from "@cmmn/examples-ui-lib";
import {Counter} from "./counter";
import {CountersController} from "../model/counters.controller";

@component()
export class Counters extends Component {
	private ctrl = resolve(CountersController);

	protected render() {
		if (this.ctrl.docQuery.isPending)
			return <>Loading...</>;
			console.log(this.ctrl.tasks.toArray());
		return <>
			{this.ctrl.models.map(c => <div key={c.id}>
				<Counter active={this.ctrl.isActive} model={c} />
			</div>)}
			<Button onClick={this.ctrl.add}>Add</Button>
			<Button onClick={this.ctrl.deleteLast}>Remove</Button>
		</>

	}
}


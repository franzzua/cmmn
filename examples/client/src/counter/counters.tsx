import {component, Component} from "@cmmn/react";
import {resolve} from "@cmmn/core";
import {Button} from "@cmmn/examples-ui-lib/button";
import {Counter} from "./counter";
import {CountersController} from "./counters.controller";

@component()
export class Counters extends Component {
	private ctrl = resolve(CountersController);

	protected render() {
		if (this.ctrl.docQuery.isPending)
			return <>Loading...</>;
		return <>
			{this.ctrl.models.map(c => <div key={c.id}>
				<Counter active={this.ctrl.isActive} model={c} />
			</div>)}
			<Button onClick={this.ctrl.add}>Add</Button>
			<Button onClick={this.ctrl.deleteLast}>Remove</Button>
		</>

	}
}
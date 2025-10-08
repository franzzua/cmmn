import {Scope} from "@cmmn/react";
import {Counters} from "../counter";
import {CountersController} from "../counter/counters.controller";

export function CounterPage(props: { id: string }) {
	return (<div style={{display: 'flex', gap: '1em', flexDirection: 'column'}}>
		<Scope provide={[CountersController, props.id]}>
			<Counters/>
		</Scope>
	</div>);
}
import {component, Component} from "@cmmn/react";
import {AsyncCell, bind, cell, inject} from "@cmmn/core";
import {Button} from "@cmmn/examples-ui-lib";
import {CounterRepository} from "./counter-repository";
import {CRDT} from "@cmmn/sync";
import {Counter} from "./counter";

@component()
export class Counters extends Component<{ id: string }> {
	@inject(CounterRepository)
	protected repository!: CounterRepository;

	readonly docQuery = AsyncCell.query(() => this.repository.loadDoc(this.props.id));

	@cell()
	private get doc(){
		return this.docQuery.result.getModel({
			counters: CRDT.list(CRDT.counter),
			value: CRDT.lww<number>,
		})
	}

	@cell()
	private get room(){
		return this.docQuery.result.room;
	}

	@cell()
	private get counters(){
		return this.doc.counters;
	}

	@bind()
	private add(){
		this.counters.push();
	}

	protected render() {
		if (this.docQuery.isPending)
			return <>Loading...</>;
		return <>
			{this.counters.toArray().map(c => <div key={c.id}>
				<Counter counter={c} active={this.room.peers.size > 0} />
			</div>)}
			<Button onClick={this.add}>Add</Button>
			<Button onClick={() => {
				this.counters.delete(this.counters.length - 1, 1);
				this.counters.commit();
			}}>Remove</Button>
			{Array.from(this.room.peers).map(p => <span key={p}>{p}</span>)}
		</>

	}
}
import {cn, component, Component, effect} from "@cmmn/react";
import {CounterStore} from "./counter.store";
import {AsyncCell, bind, cell, Fn, inject} from "@cmmn/core";
import {Button} from "@cmmn/examples-ui-lib";
import {css} from "@acab/ecsstatic";
import {CounterRepository} from "./counter-repository";
import {CRDT} from "@cmmn/sync";

@component({scoped: true})
export class CounterInternal extends Component<{
	counter: CRDT.Counter;
	active: boolean;
}> {
	constructor() {
		super();
	}
	@inject(CounterStore)
	protected accessor store!: CounterStore;

	public get counter() {
		return this.props.counter;
	}
	changes = [];

	@effect()
	listenChanges(){
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
			{/*<ol>*/}
			{/*	{this.changes.map((x, i) => <li key={i}>{JSON.stringify(x)}</li>)}*/}
			{/*</ol>*/}
		</div>)
	}
}

@component()
export class Counters extends Component<{ id: string }> {
	@inject(CounterRepository)
	protected repository!: CounterRepository;

	@cell()
	private get room(){
		return this.repository.getRoom(this.props.id);
	}

	readonly docQuery = AsyncCell.query(() => this.repository.shape(this.props.id, {
		counters: CRDT.list(CRDT.counter),
	}));


	@cell()
	private get counters(){
		return this.docQuery.result.counters;
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
				<CounterInternal counter={c} active={this.room.peers.size > 0} />
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
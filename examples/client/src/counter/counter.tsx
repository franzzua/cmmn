import {cn, component, Component} from "@cmmn/react";
import {CounterStore} from "./counter.store";
import {AsyncCell, BaseCell, inject} from "@cmmn/core";
import {Button} from "@cmmn/examples-ui-lib";
import {css} from "@acab/ecsstatic";
import {CounterRepository} from "./counter-repository";
import {LoroCell, type LoroCounterCell} from "@cmmn/sync";

@component({scoped: true})
export class CounterInternal extends Component<{
	counter: LoroCounterCell
}> {

	@inject(CounterStore)
	protected accessor store!: CounterStore;

	public get counter() {
		return this.props.counter;
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
			!this.counter.isSynced && this.style.loading
		);
		console.log(this.counter.isSynced, className);
		return (<div className={className}>
			<code>{this.store.value}</code>
			<Button onClick={this.store.inc}>Inc</Button>
		</div>)
	}
}

@component()
export class Counter extends Component<{ id: string }> {
	@inject(CounterRepository)
	protected repository!: CounterRepository;

	protected doc = new AsyncCell(
		() => this.repository.getDoc(this.props.id, {
			counter: LoroCell.Counter,
			list: LoroCell.List<number>
		})
	);

	protected render() {
		if (!this.doc.get())
			return <>Loading...</>
		return <CounterInternal counter={this.doc.get().counter}/>

	}
}
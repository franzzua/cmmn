import {inject, scoped} from "@cmmn/core";
import {injectLazy} from "@cmmn/core";
import {CounterRepository} from "./counter-repository";
import {Counter} from "./counter";

@scoped()
export class CounterStore {

	@injectLazy(() => Counter)
	accessor counter!: Counter;

	@inject(CounterRepository)
	private repository!: CounterRepository;


	public get value() {
		return this.counter.counter.value;
	}

	inc = () => {
		this.counter.counter.value++;
	}
	dec = () => this.counter.counter.value--;
}

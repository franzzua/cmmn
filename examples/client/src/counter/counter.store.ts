import {inject, scoped} from "@cmmn/core";
import {CounterInternal} from "./counters";
import {injectLazy} from "@cmmn/core";
import {CounterRepository} from "./counter-repository";

@scoped()
export class CounterStore {

	@injectLazy(() => CounterInternal)
	accessor counter!: CounterInternal;

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

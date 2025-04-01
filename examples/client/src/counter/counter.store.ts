import {inject, scoped} from "@cmmn/core";
import {CounterInternal} from "./counter";
import {injectLazy} from "@cmmn/core";
import {CounterRepository} from "./counter-repository";

@scoped()
export class CounterStore {

	@injectLazy(() => CounterInternal)
	accessor counter!: CounterInternal;

	@inject(CounterRepository)
	private repository!: CounterRepository;

	private loroCounter = this.counter.counter;

	public get value() {
		return this.loroCounter.value;
	}

	inc = () => {
		this.loroCounter.value++;
	};
}

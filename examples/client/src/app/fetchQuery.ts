import {bind, Cell, Fn} from "@cmmn/core";

export class FetchQuery<T> extends Cell<{
	result?: T;
	isFetching: boolean;
	error?: Error;
}> {
	private abort: AbortController;

	constructor(private url, private requestInit?: RequestInit) {
		super({
			isFetching: false
		})
	}

	@bind()
	async fetch() {
		this.set({
			isFetching: true,
		});
		await fetch(this.url, {
			...this.requestInit,
			signal: this.abort?.signal
		}).then(x => x.json()).then(async x => {
			await Fn.asyncDelay(500);
			return x;
		}).then(x => this.set({
			isFetching: false,
			result: x
		})).catch(err => this.set({
			isFetching: false,
			error: err
		}))
	}

	active() {
		super.active();
		this.abort = new AbortController();
		this.fetch();
	}

	protected disactive() {
		super.disactive();
		this.abort.abort();
	}

}
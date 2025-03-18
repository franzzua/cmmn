import {cell, Cell, scoped} from '@cmmn/core';

@scoped()
export class Store {

	constructor() {
		console.log('store')
	}

	@cell()
	public accessor value = 1;


	public query = new FetchQuery('/api');

}

class FetchQuery<T> extends Cell<{
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

	fetch(){
		this.set({
			isFetching: true,
		});
		fetch(this.url, {
			...this.requestInit,
			signal: this.abort.signal
		}).then(x => x.json()).then(x => this.set({
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

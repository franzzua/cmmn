import {cell, Cell, di, scoped} from '@cmmn/core';
import {data} from "@cmmn/examples-common";
@scoped()
export class Store {

	constructor() {
		console.log('store')
	}

	@cell()
	public accessor value = data.value;


}

export class Api {
	public query = new FetchQuery('/api');

	[Symbol.dispose](){
		this.query[Symbol.dispose]();
	}
}
export const ApiToken = Symbol("Api")
di.override(ApiToken, Api);

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

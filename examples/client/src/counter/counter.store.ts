import {CRDT} from "@cmmn/sync";
import {cell, Cell} from "@cmmn/core";
import {CounterDiff, LoroEvent, LoroEventBatch} from "loro-crdt";

export class CounterStore {
	constructor(private counter: CRDT.Counter) {
	}

	public get value() {
		return this.counter.value;
	}

	inc = () => {
		this.counter.value++;
	}
	dec = () => this.counter.value--;


	lastEvent = Cell.from<LoroEventBatch>(this.counter.subscribe)

	get lastDiffs(){
		return this.lastEvent.get()?.events?.map(x => x.diff as CounterDiff) ?? []
	}
	private changesCache = [];
	@cell()
	get incrementHistory(){
		return this.changesCache = [
			...this.lastDiffs.map(x => x.increment),
			...this.changesCache,
		].slice(0, 5);
	}
}

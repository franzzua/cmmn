import {CRDT} from "@cmmn/sync";
import {cell, Cell} from "@cmmn/core";
import {CounterDiff, LoroEvent, LoroEventBatch} from 'loro-crdt/nodejs';

export class CounterModel {
	constructor(public counter: CRDT.Counter) {
	}

	public get id (){
		return this.counter.id;
	}
	public get value() {
		return this.counter.value;
	}

	inc = () => {
		this.counter.value++;
	}
	dec = () => this.counter.value--;


	lastEvent = Cell.from<LoroEventBatch>(this.counter);

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

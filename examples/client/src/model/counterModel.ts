import {CRDT} from "@cmmn/sync";
import {cell, Cell} from "@cmmn/core";
import {CounterDiff, LoroEvent, LoroEventBatch} from 'loro-crdt/bundler';

export class TaskModel {
	constructor(public task: CRDT.Counter) {
	}

	public get id (){
		return this.task.id;
	}
	public get value() {
		return this.task.value;
	}

	inc = () => {
		this.task.value++;
	}
	dec = () => this.task.value--;


	lastEvent = Cell.from<LoroEventBatch>(this.task);

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

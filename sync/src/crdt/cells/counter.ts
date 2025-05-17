import {LoroCounter, LoroDoc} from "loro-crdt";
import {BaseCell} from "@cmmn/core";
import {extend, Extension, LoroDocExtensions} from "./extend";

export class Counter extends LoroCounter implements LoroDocExtensions<LoroCounter, never>{
	protected constructor(
		public base: LoroCounter,
		public doc: LoroDoc,
		public commit: () => void,
	) {
		super();
	}
	//@ts-expect-error
	override get value(){
		return this.base.value;
	}

	override set value(value){
		this.increment(value - this.base.value);
		this.commit();
	}
}


export function counter(doc: LoroDoc, id: string): Counter {
	const counter = doc.getCounter(id);
	return extend<LoroCounter, Counter & Extension<LoroCounter, never>, never>(counter, Counter as any, doc);
}

BaseCell.addAdapter(LoroCounter, LoroCounter.prototype.subscribe);

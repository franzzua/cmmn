import {LoroDocCell, LoroDocExtensions} from "./loro-doc-cell";
import {LoroCounter, LoroDoc} from "loro-crdt";
import {BaseCell} from "@cmmn/core";

export function counter(docCell: LoroDocCell, id: string): Counter {
	const counter = docCell.doc.getCounter(id);
	return docCell.extend(counter, {
		id,
		get value(){
			return counter.value;
		},
		set value(value){
			this.increment(value - counter.value);
			this.commit();
		}
	});
}

BaseCell.addAdapter(LoroCounter, LoroCounter.prototype.subscribe);

export type Counter = Omit<LoroCounter, "value"> & LoroDocExtensions<LoroCounter> & {
	value: number;
	readonly id: string;
};
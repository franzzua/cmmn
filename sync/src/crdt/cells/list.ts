import {LoroDoc, LoroMovableList} from "loro-crdt";
import {BaseCell} from "@cmmn/core";
import {Infer, Scheme} from "./types";
import {extend, LoroDocExtensions} from "./extend";
import {factory} from "./factory";

export abstract class List<T extends Scheme> extends LoroMovableList
	implements LoroDocExtensions<LoroMovableList, T> {
	protected constructor(
		public base: LoroMovableList,
		public doc: LoroDoc,
		public commit: () => void,
		public shape?: T
	) {
		super();
	}

	push(value?: T) {
		if (!this.shape){
			this.base.push(value);
			this.commit();
			return;
		}
		const id = Id();
		this.base.push(id);
		this.commit();
		return factory(this.doc, this.shape, [id])
	}

	toArray() {
		if (!this.shape)
			return this.base.toArray();
		const ids = this.base.toArray();
		return ids.map(id => factory(this.doc, this.shape, [id])) as Infer<T>[];
	}
}

export function list<T extends Scheme>(shape?: T) {
	return function (doc: LoroDoc, id: string): List<Infer<T>> {
		const list = doc.getMovableList(id);
		return extend(list, List<T>, doc, shape);
	}
}

BaseCell.addAdapter(LoroMovableList, LoroMovableList.prototype.subscribe);
export const Id = () => Math.random().toString(36).substring(2);
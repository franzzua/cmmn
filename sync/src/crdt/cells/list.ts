import {LoroDoc, type LoroMovableList as LoroMovableListType, LoroMovableList} from "loro-crdt";
import {BaseCell} from "@cmmn/core";
import {LoroShape, LoroShaped} from "./types";
import {extend, LoroDocExtensions} from "./extend";
import {factory} from "./factory";

export abstract class List<T extends LoroShape> extends LoroMovableList
	implements LoroDocExtensions<LoroMovableList, T> {
	protected constructor(
		public base: LoroMovableList,
		public doc: LoroDoc,
		public commit: () => void,
		public shape?: T
	) {
		super();
	}

	push() {
		const id = Id();
		this.base.push(id);
		this.commit();
		return factory(this.doc, this.shape, [id])
	}

	toArray() {
		const ids = this.base.toArray();
		return ids.map(id => factory(this.doc, this.shape, [id])) as T[];
	}
}

export function list<T extends LoroShape>(shape?: T) {
	return function (doc: LoroDoc, id: string): List<T> & LoroMovableListType<T> {
		const list = doc.getMovableList(id);
		return extend(list, List<T>, doc, shape) as List<T> & LoroMovableListType<T>;
	}
}


BaseCell.addAdapter(LoroMovableList, LoroMovableList.prototype.subscribe);
export const Id = () => Math.random().toString(36).substring(2);
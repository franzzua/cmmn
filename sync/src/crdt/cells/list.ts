import {
	LoroDoc,
	LoroMovableList,
	type LoroMovableList as LoroMovableListType,
	Container,
} from 'loro-crdt/nodejs';
import {BaseCell} from "@cmmn/core";
import {Factory, Infer, Scheme} from "./types";
import {extend, LoroDocExtensions} from "./extend";
import {factory} from "./factory";

export abstract class List<T> extends LoroMovableList<T> implements LoroDocExtensions<LoroMovableList> {
	protected constructor(
		public readonly base: LoroMovableListType<string>,
		public readonly doc: LoroDoc,
		public readonly commit: () => void,
		public readonly shape?: Scheme
	) {
		super();
	}

	push(value?: T) {
		const id = Id();
		this.base.push(id);
		this.commit();
		return factory(this.doc, this.shape, [id])
	}

	toArray(): T[] {
		const ids = this.base.toArray();
		return ids.map(id => factory(this.doc, this.shape, [id])) as T[];
	}

}

export function list<T>(shape: T): Factory<List<Infer<T>>>;
export function list<T>(): Factory<List<T>>;
export function list<T>(shape?: T): Factory<List<T>> {
	return function (doc: LoroDoc, id: string): List<T> {
		const list = doc.getMovableList(id);
		return extend(list, shape ? List<T> : {
			prototype: {} as any
		}, doc, shape as Scheme);
	}
}

BaseCell.addAdapter(LoroMovableList, LoroMovableList.prototype.subscribe);
export const Id = () => Math.random().toString(36).substring(2);
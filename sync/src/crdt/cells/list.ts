import {LoroDocCell, LoroDocExtensions} from "./loro-doc-cell";
import {LoroMovableList} from "loro-crdt";
import {BaseCell} from "@cmmn/core";
import {LoroShape, LoroShaped} from "./types";


export function list<T extends LoroShape>(shape?: T){
	return function (docCell: LoroDocCell, id: string): List<T> {
		const list = docCell.doc.getMovableList(id);
		return docCell.extend<ListExtensions<T>, LoroMovableList<T>>(
			list as LoroMovableList<T>,
			{
				id: id,
				push(this: LoroDocExtensions<LoroShaped<T>>){
					const id = Id();
					list.push(id);
					this.commit();
					return docCell.getShaped(shape, [id])
				},
				toArray(this: LoroDocExtensions<LoroShaped<T>>){
					const ids = list.toArray();
					return ids.map(id => docCell.getShaped(shape, [id])) as T[];
				}
			}
		);
	}
}

export type ListExtensions<T extends LoroShape> = {
	id: string;
	push(): LoroShaped<T>;
	toArray(): T[];
}

export type List<T extends LoroShape> = LoroDocExtensions<LoroMovableList<T>> & ListExtensions<T>;

BaseCell.addAdapter(LoroMovableList, LoroMovableList.prototype.subscribe);
export const Id = () => Math.random().toString();
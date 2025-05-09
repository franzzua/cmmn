import {LoroDocCell, LoroDocExtensions} from "./loro-doc-cell";
import {LoroMap, LoroMovableList} from "loro-crdt";
import {BaseCell} from "@cmmn/core";

const extensions = Object.getOwnPropertyDescriptors({
	push(value){
		this.__proto__.push(value);
		this.commit();
	}
})

export function map<T extends Record<string, unknown>>(){

	return function (docCell: LoroDocCell, id: string): Map<T> {
		return Object.create(id ? docCell.doc.getMap(id) : new LoroMap(), Object.getOwnPropertyDescriptors({
			...docCell.extensions,
			...extensions
		}));
	}
}


export type Map<T> = LoroMap<Record<string, T>> & LoroDocExtensions<T>;

BaseCell.addAdapter(LoroMovableList, LoroMovableList.prototype.subscribe);
import {LoroDocCell, LoroDocExtensions} from "./loro-doc-cell";
import {LoroList, LoroMap, LoroMovableList} from "loro-crdt";
import {BaseCell} from "@cmmn/core";
import {LoroShape, LoroShaped} from "./types";

const extensions = Object.getOwnPropertyDescriptors({
	push(value){
		this.__proto__.push(value);
		this.commit();
	}
})

export function map<T extends Record<string, unknown>>(){

	return function (docCell: LoroDocCell, id: string): Map<T> {
		return Object.create(id ? docCell.doc.getMap(id) : new LoroMap(), {
			...docCell.extensions,
			...extensions
		});
	}
}


export type Map<T> = LoroMap<Record<string, T>> & LoroDocExtensions;

BaseCell.addAdapter(LoroMovableList, LoroMovableList.prototype.subscribe);
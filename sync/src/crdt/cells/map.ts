import {
	LoroDoc,
	LoroMap,
	LoroMovableList
} from "loro-crdt";
import {BaseCell} from "@cmmn/core";
import {LoroShape} from "./types";
import {extend, LoroDocExtensions} from "./extend";


export abstract class Map<T extends LoroShape> extends LoroMap<Record<string, T>>
	implements LoroDocExtensions<LoroMap, T> {
	protected constructor(
		public readonly base: LoroMap<Record<string, T>>,
		public doc: LoroDoc,
		public readonly commit: () => void,
		public shape?: T
	) {
		super();
	}

	push(value){
		this.commit();
	}
}
export function map<T extends LoroShape>(){

	return function (doc: LoroDoc, id: string): Map<T> {
		const map = (id ? doc.getMap(id) : new LoroMap()) as LoroMap<Record<string, T>>;
		return extend(map, Map<T>, doc) as Map<T>;
	}
}
BaseCell.addAdapter(LoroMovableList, LoroMovableList.prototype.subscribe);
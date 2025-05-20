import {
	LoroDoc,
	LoroMap,
	LoroMovableList
} from "loro-crdt";
import {BaseCell} from "@cmmn/core";
import {Infer, LWWValue, Scheme, Value} from "./types";
import {extend, LoroDocExtensions} from "./extend";


export abstract class Map<T extends Scheme> extends LoroMap<Record<string, T>>
	implements LoroDocExtensions<LoroMap> {
	protected constructor(
		public readonly base: LoroMap<Record<string, T>>,
		public readonly doc: LoroDoc,
		public readonly commit: () => void,
		public readonly shape?: T
	) {
		super();
	}

	push(value){
		this.commit();
	}
}
export function map<T extends Scheme>(){

	return function (doc: LoroDoc, id: string): Map<T> {
		const map = (id ? doc.getMap(id) : new LoroMap()) as LoroMap<Record<string, T>>;
		return extend(map, Map<T>, doc) as Map<T>;
	}
}
BaseCell.addAdapter(LoroMovableList, LoroMovableList.prototype.subscribe);
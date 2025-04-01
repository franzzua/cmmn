import {Diff, LoroDoc} from 'loro-crdt';
import {cell, EventEmitter} from "@cmmn/core";
import {LoroShape, LoroShaped} from "../types";

export class LoroDocCell extends EventEmitter<{
	diff: Diff
}> {
	@cell()
	accessor isSynced = false;

	constructor(
		data?: Uint8Array,
		/** @internal **/
		public doc: LoroDoc = data ? LoroDoc.fromSnapshot(data) : new LoroDoc(),
	) {
		super();
	}

	async import(update: Uint8Array) {
		this.doc.import(update);
	}

	[Symbol.dispose]() {
		super[Symbol.dispose]();
	}

	getShaped<Shape extends LoroShape>(shape: Shape, path = []): LoroShaped<Shape> {
		const result = {};
		for (let key in shape) {
			if (typeof shape[key] === "function") {
				result[key] = shape[key](this, path.concat(key).join('.'));
			} else {
				result[key] = this.getShaped(shape[key], path.concat(key));
			}
		}
		return result;
	}
}


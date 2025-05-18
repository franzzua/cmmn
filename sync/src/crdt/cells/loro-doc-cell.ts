import {LoroDoc} from 'loro-crdt';
import {cell, EventEmitter} from "@cmmn/core";
import {Scheme, Infer} from "./types";
import {LoroRoom} from "../../p2p/loroRoom";
import {Container} from "loro-crdt/bundler/loro_wasm";
import {factory} from "./factory";

export class LoroDocCell extends EventEmitter<{
	snapshot: Uint8Array;
	update: Uint8Array;
}> implements AsyncDisposable {
	@cell()
	accessor room: LoroRoom;

	constructor(
		data?: Uint8Array,
		/** @internal **/
		public doc: LoroDoc = data ? LoroDoc.fromSnapshot(data) : new LoroDoc(),
	) {
		super();
	}

	[Symbol.asyncDispose]() {
        return this.room?.[Symbol.asyncDispose]();
    }

	async import(update: Uint8Array) {
		this.doc.import(update);
	}

	unsubscr: (() => void) | undefined;
	protected subscribe(eventName: keyof { snapshot: Uint8Array }) {
		this.unsubscr = this.doc.subscribe(e => {
			this.emit('snapshot', this.doc.export({mode: 'snapshot'}))
			this.emit('update', this.doc.export({mode: 'update'}))
		});
	}

	protected unsubscribe(eventName: keyof { snapshot: Uint8Array; update: Uint8Array }) {
		this.unsubscr?.();
		super.unsubscribe(eventName);
	}

	getModel<Model extends Scheme>(shape: Model, path = []): Infer<Model> {
		return factory(this.doc, shape, path);
	}

}


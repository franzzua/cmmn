import {LoroDoc} from 'loro-crdt';
import {cell, EventEmitter} from "@cmmn/core";
import {LoroShape, LoroShaped} from "./types";
import {LoroRoom} from "../../p2p/loroRoom";

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

	getShaped<Shape extends LoroShape>(shape: Shape, path = []): LoroShaped<Shape> {
		if (typeof shape === "function")
			return shape(this, path.join('.') || 'root');

		const result = {};
		for (let key in shape) {
			result[key] = this.getShaped(shape[key], path.concat(key) || 'root');
		}
		return result;
	}

	async sink(ai: AsyncIterator<Uint8Array>){
		for await (let uint8Array of ai) {
			this.doc.import(uint8Array);
		}
	}

	extensions = {
		// factory: {value: (type: LoroTypeFactory) => type(this)},
		doc: this.doc,
		commit(){
			this.doc.commit()
		}
	};

	extend<TExt, T>(
		container: T, extensions: TExt
	): LoroDocExtensions<T> & TExt {
		return Object.create(container, {
			base: { value: container },
			...Object.getOwnPropertyDescriptors(this.extensions),
			...Object.getOwnPropertyDescriptors(extensions)
		})
	}
}
export type LoroDocExtensions<T> = T & {
	base: T;
	doc: LoroDoc;
	commit();
}
import {LoroDoc} from 'loro-crdt';
import {cell, EventEmitter, ResolvablePromise} from "@cmmn/core";
import {Scheme, Infer} from "./types";
import {LoroRoom} from "../loroRoom";
import {factory} from "./factory";
import {LoroProtocol} from "../loroProtocol";

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

	async [Symbol.asyncDispose]() {
		await this.isSyncStarted;
		for (let disposable of this.disposables) {
			await disposable[Symbol.asyncDispose]();
		}
		super[Symbol.dispose]();
	}

	async import(update: Uint8Array) {
		this.doc.import(update);
	}

	disposables: AsyncDisposable[] = [];
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

	private isSyncStarted = new ResolvablePromise();
	async sync(room: LoroRoom, ...protocols: LoroProtocol[]) {
		this.room = room;
		for (let protocol of protocols) {
			this.disposables.push(await room.sync(this.doc, protocol));
		}
		this.isSyncStarted.resolve();
	}
}


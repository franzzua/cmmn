import { BaseCell } from '@cmmn/core';
import { LoroDoc, Subscription } from 'loro-crdt';
import { LoroDocEventEmitter } from './loro-doc-event-emitter';
import { P2PNode } from '../p2p/p2p.node';

export class LoroCell<T> extends BaseCell<T> {
	constructor(
		data?: Uint8Array,
		/** @internal **/
		public doc: LoroDoc = data ? LoroDoc.fromSnapshot(data) : new LoroDoc(),
	) {
		super(() => doc.toJSON().value);
	}

	public docEvents = new LoroDocEventEmitter(this.doc);

	syncP2P(p2pNode: P2PNode, uri: string) {
		return p2pNode.join(uri, this.doc);
	}

	async sinkFrom(ai: AsyncIterable<Uint8Array>) {
		for await (let uint8Array of ai) {
			this.doc.import(uint8Array);
		}
	}

	async import(update: Uint8Array) {
		this.doc.import(update);
	}

	private subscription: Subscription | undefined;

	active() {
		super.active();
		this.subscription?.();
		this.subscription = this.doc.subscribe((e) => {
			this.isActual = false;
			this.onValueContentChanged();
		});
	}

	protected disactive() {
		super.disactive();
		this.subscription?.();
	}


	[Symbol.dispose]() {
		super[Symbol.dispose]();
		this.docEvents[Symbol.dispose]();
	}
}

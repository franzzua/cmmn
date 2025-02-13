import { EventEmitter } from '@cmmn/core';
import { LoroDoc, LoroEventBatch, Subscription } from 'loro-crdt';

export class LoroDocEventEmitter extends EventEmitter<{
	change: { event: LoroEventBatch; diff: Uint8Array };
}> {
	constructor(private doc: LoroDoc) {
		super();
	}

	private subscription: Subscription | undefined;

	protected subscribe(eventName: 'change') {
		super.subscribe(eventName);
		let lastVersion = this.doc.version();
		this.subscription = this.doc.subscribe((event) => {
			this.emit('change', {
				event,
				diff: this.doc.export({
					mode: 'update',
					from: lastVersion,
				}),
			});
			lastVersion = this.doc.version();
		});
	}

	protected unsubscribe(eventName: 'change') {
		super.unsubscribe(eventName);
		this.subscription?.();
	}
}

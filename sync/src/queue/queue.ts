import { EventEmitter, inject } from '@cmmn/core';
import { Transport } from '../transport/transport';
import { LoroDoc, LoroList } from 'loro-crdt/nodejs';
import { Team } from './team';

export class Queue<T> extends EventEmitter<{
	push: T;
	shift: T;
}> {
	@inject(Transport<Record<string, QueueMessage<T>>>)
	private transport!: Transport<Record<string, QueueMessage<T>>>;
	private channel = this.transport.getChannel(`queue:${this.name}`);

	private doc = new LoroDoc<{
		value: LoroList<{ value: T }>;
	}>();
	private list = this.doc.getList('value');
	@inject(Team) team!: Team;

	public get queue(): ReadonlyArray<T> {
		return this.list.toArray().map((x) => x.value);
	}

	constructor(
		private name: string,
		state: T[] = [],
	) {
		super();
		for (let value of state) {
			this.list.insert(this.list.length, { value });
		}
		this.doc.commit();
	}

	onDispose = this.transport.on(this.name, (e) => {
		this.doc.import(e.update);
	});

	async pushAsync(value: T) {
		const version = this.doc.version();
		this.list.push({ value });
		this.doc.commit();
		const update = this.doc.export({
			mode: 'update',
			from: version,
		});
		this.channel.broadcast({ update });
	}

	async shiftAsync() {
		const version = this.doc.version();
		const value = this.list.get(0);
		this.list.delete(0, 1);

		this.doc.commit();
		const update = this.doc.export({
			mode: 'update',
			from: version,
		});
		this.channel.broadcast({ update });

		return value;
	}

	[Symbol.dispose]() {
		this.onDispose();
	}
}

type QueueMessage<T> = {
	update: Uint8Array;
};

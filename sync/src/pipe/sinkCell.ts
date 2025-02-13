import { BaseCell } from '@cmmn/core';

export class SinkCell<T> extends BaseCell<T | undefined> {
	constructor(private ai: AsyncIterable<T>) {
		super(undefined);
	}

	active() {
		super.active();
		this.run();
	}

	disactive() {
		super.disactive();
		this.iterator.return();
	}

	private iterator: AsyncIterator<T>;

	async run() {
		this.iterator = this.ai[Symbol.asyncIterator]();
		let value: IteratorResult<T>;
		while (!(value = await this.iterator.next()).done) this.set(value.value);
	}
}

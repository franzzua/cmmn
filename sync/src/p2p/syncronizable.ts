export class Syncronizable<T> {

	protected async* getUpdates?(): AsyncIterator<T> {

	}

	protected async addUpdate?(update: T){

	}

	public get updates(): AsyncIterator<T> {
		return this.getUpdates();
	}

	async sink(ai: AsyncIterable<T>) {
		for await (let update of ai) {
			await this.addUpdate?.(update)
		}
	}
}
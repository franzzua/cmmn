import {Syncronizable} from "../p2p/syncronizable";

export abstract class Storage<T> {
	abstract set(key: string, value: T): Promise<void | unknown>;

	abstract keys();

	abstract get(key: string): Promise<T>;

	abstract remove(key: string): Promise<void>;

	abstract purge(): Promise<void>;

	getSink(key: string): Syncronizable<T>{
		const self = this;
		return new class extends Syncronizable<T> {
			protected async addUpdate(update: T): Promise<void> {
				await self.set(key, update)
			}
		}
	}

}
export abstract class StorageProvider {
	abstract getStorage<T>(name: string): Storage<T>;
}

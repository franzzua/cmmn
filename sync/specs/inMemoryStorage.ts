import { Storage, StorageProvider } from '../src/crdt/storage';
import { scoped } from '@cmmn/core';

@scoped()
export class InMemoryStorage<T> extends Storage<T> {
	static Provider: StorageProvider = {
		getStorage<T>(name: string): Storage<T> {
			return new InMemoryStorage();
		},
	};

	private store: Record<string, T> = {};

	async set(key: string, value: T): Promise<void> {
		this.store[key] = value;
	}

	keys() {
		return Promise.resolve(Object.keys(this.store));
	}

	async get(key: string): Promise<T> {
		return this.store[key];
	}

	async remove(key: string): Promise<void> {
		delete this.store[key];
	}

	async purge(): Promise<void> {
		this.store = {};
	}
}

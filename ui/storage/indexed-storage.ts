import {Storage, StorageProvider} from "@cmmn/sync";
import {scoped} from "@cmmn/core";

@scoped()
class IndexedStorageProvider extends StorageProvider {
	getStorage<T>(name: string): Storage<T> {
		return new IndexedStorage(name);
	}
}
export class IndexedStorage<T> extends Storage<T> {
	static Provider = IndexedStorageProvider;

	private db = new Promise<IDBDatabase>((resolve, reject) => {
		const request = window.indexedDB.open(this.name, 1);
		request.addEventListener("success", (e: any) => resolve(e.target.result), {
			once: true,
		});
		request.addEventListener("error", reject, {once: true});
		request.addEventListener("blocked", reject, {once: true});
		request.addEventListener(
			"upgradeneeded",
			(e: any) => {
				const db = e.target.result;
				if (!db.objectStoreNames.contains(this.name)) {
					db.createObjectStore(this.name);
				}
			},
			{once: true}
		);
	});

	constructor(protected name: string) {
		super();
	}

	private request<T>(
		req: (store: IDBObjectStore) => IDBRequest<T>
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.db.then((db) => {
				const transaction = db.transaction([this.name], "readwrite");
				transaction.onabort = reject;
				const store = transaction.objectStore(this.name);
				const request = req(store);
				request.onerror = reject;
				request.onsuccess = function () {
					resolve(this.result);
				};
				transaction.commit?.();
			});
		});
	}

	public set(key: string, value: T) {
		return this.request((store) => store.put(value, key));
	}

	public keys() {
		return this.request((store) => store.getAllKeys());
	}

	public get<T>(key: string): Promise<T> {
		return this.request((store) => store.get(key));
	}

	public remove(key: string) {
		return this.request((store) => store.delete(key));
	}

	public purge() {
		return this.request((store) => store.clear());
	}
}
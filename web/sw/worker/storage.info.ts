export class StorageInfo {
	private dbName = '@cmmn/service-worker/worker-storage';
	private storageStore = 'storages';
	private db = new Promise<IDBDatabase>((resolve, reject) => {
		const request = self.indexedDB.open(this.dbName, 1);
		request.addEventListener("success", (e: any) => resolve(e.target.result), {
			once: true,
		});
		request.addEventListener("error", reject, {once: true});
		request.addEventListener("blocked", reject, {once: true});
		request.addEventListener(
			"upgradeneeded",
			(e: any) => {
				const db = e.target.result;
				if (!db.objectStoreNames.contains(this.storageStore)) {
					db.createObjectStore(this.storageStore);
				}
			},
			{once: true}
		);
	});

	private request<T>(
		mode: IDBTransactionMode,
		req: (store: IDBObjectStore) => IDBRequest<T>
	): Promise<T> {
		return this.db.then(db => new Promise<T>((resolve, reject) => {
			const transaction = db.transaction(this.storageStore, mode);
			transaction.onabort = reject;
			const store = transaction.objectStore(this.storageStore);
			const request = req(store);
			request.onerror = reject;
			request.onsuccess = function () {
				resolve(this.result);
			};
			transaction.commit?.();
		}));
	}

	async load() {
		return await this.request('readonly', x => x.getAll());
	}

	async save(store: string, data: any) {
		await this.request('readwrite', x => x.put(data, store));
	}

	async clear() {
		await new Promise(r => self.indexedDB.deleteDatabase(this.dbName).addEventListener('success', r));
	}
}
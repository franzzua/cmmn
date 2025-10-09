import {InitMessageData} from "./types";
declare var self: ServiceWorkerGlobalScope;

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
	async load(){
		return await this.request('readonly', x => x.getAll());
	}

	async save(store: string, data: any){
		await this.request('readwrite', x => x.put(data, store));
	}

	async clear() {
		await new Promise(r => self.indexedDB.deleteDatabase(this.dbName).addEventListener('success', r));
	}
}

export class SwStorage {
	private static instances = new Map<string, SwStorage>();
	private static info = new StorageInfo();
	public static async get(data: InitMessageData){
		let storage = this.instances.get(data.baseURI);
		if (!storage) {
			this.instances.set(data.baseURI, storage = new SwStorage(data.baseURI, data.bundleJson));
		}
		return storage;
	}
	static fetch(request: Request) {
		for (let [key, storage] of this.instances) {
			const response = storage.fetch(request);
			if (response) return response;
		}
		return fetch(request);
	}
	static async init(){
		if(globalThis.isInitialized) return;
		const json = await this.info.load();
		for (let data of json) {
			const storage = await this.get(data);
			await storage.load();
		}
		globalThis.isInitialized = true;
	}
	static async clear(){
		for (let [key, storage] of this.instances) {
			await storage.clear();
		}
		this.instances.clear();
		await this.info.clear();
	}
	private readonly name = `main:${this.baseURI}`;
	private readonly cloneName = `clone:${this.baseURI}`;
	private readonly bundleUrl = new URL(`${this.baseURI}@_/bundle.json`, self.origin);
	private readonly cache: Promise<Cache> = caches.open(this.name);
	protected platforms = new Set<string>();

	loading: Promise<void>;
	constructor(private readonly baseURI: string, private bundleJson: {
		assets: Asset[];
		deps: any[];
		proxy: Array<{regex: string; replace: string;}>;
		publicPath: string;
	}, private hashHeader: string = 'sw-hash') {
	}
	save(data: any){
		return SwStorage.info.save(this.baseURI, data);
	}

	public async clear() {
		await caches.delete(this.name);
		await caches.delete(this.cloneName).catch();
	}

	private checkIntervalId: number | undefined;
	public setCheckInterval(checkInterval = 30_000) {
		this.checkIntervalId && clearInterval(this.checkIntervalId);
		this.checkIntervalId = setInterval(
			() => this.checkUpdate(),
			checkInterval
		) as any;
	}

	async checkUpdate(force = false) {
		const clone = await this.cloneCache()
		const hasUpdates = await this.loadAssets(clone);
		// console.log('SW check update: ', hasUpdates)
		if (!hasUpdates) {
			await caches.delete(this.cloneName);
			return;
		}

		const cache = await this.cache;
		for (let request of await cache.keys()) {
			const match = await clone.match(request);
			if (!match){
				await cache.delete(request);
			} else {
				await cache.put(request, match);
				await clone.delete(request);
			}
		}
		for (let left of await clone.keys()){
			await cache.put(left, await clone.match(left))
		}
		await caches.delete(this.cloneName);
		await this.sendAll({
			action: 'update'
		})
	}

	async cloneCache(){
		const from = await this.cache;
		const to = await caches.open(this.cloneName);
		for (let key of await from.keys()) {
			if (await to.match(key)) continue
			await to.put(key, await from.match(key));
		}
		return to;
	}

	async sendAll(data: any) {
		const clients = await self.clients.matchAll({
			includeUncontrolled: true,
		});
		for (let client of clients) {
			client.postMessage(data);
		}
	}

	async load() {
		if (this.bundleJson){
			// TODO: check expiration and update json
		} else {
			this.bundleJson = await fetch(this.bundleUrl).then(async x => {
				if (x.ok) {
					return await x.json();
				}
				console.error(this.bundleUrl.href, await x.text());
				return null;
			});
			await this.save({
				bundleJson: this.bundleJson,
				baseURI: this.baseURI
			});
		}
		await this.loadAssets(await this.cache);
		await this.loadDeps();
	}

	protected async loadAssets(cache: Cache) {
		let updated = false;
		const cacheKeys = new Set((await cache.keys()).map(x => x.url));
		for (let asset of this.bundleJson.assets) {
			if (asset.platforms && asset.platforms.every(p => !this.platforms.has(p)))
				continue;
			let url = `${this.baseURI}${asset.path}`;
			if(url.endsWith('/')) url = url.substring(0, url.length - 1);
			const request = new Request(url);
			cacheKeys.delete(request.url);
			const matched = await cache.match(request);
			if (matched){
				const hash = await this.getHash(matched);
				if (hash == asset.hash)
					continue;
			}
			updated = true;
			const result = await this.fetchRetry(request);
			const clone = new Response(result.body, result);
			clone.headers.append(this.hashHeader, asset.hash);
			await cache.put(request, clone);
		}
		// remove old requests
		for (let cacheKey of cacheKeys) {
			await cache.delete(cacheKey);
			updated = true;
		}
		return updated;
	}
	async getHash(response: Response){
		return response.headers.get(this.hashHeader);
	}

	private async loadDeps(){
		for (let dep of this.bundleJson.deps) {
			const storage = await SwStorage.get(dep);
			await storage.load();
		}
	}

	private fetchRetry(request: Request, counter = 0): Promise<Response> {
		return fetch(request).catch((e) => {
			if (counter < 3) {
				return this.fetchRetry(request, counter + 1);
			} else {
				throw e;
			}
		});
	}

	async getFromCache(request: Request) {
		const cache = await this.cache;
		return  await cache.match(request, { ignoreSearch: true })
	}

	async getFromCacheOrFetch(request: Request) {
		const cached = await this.getFromCache(request);
		if (cached)
			return cached;
		return await fetch(request);
	}


	async getFromCacheOrFetchAndPut(request: Request) {
		const cached = await this.getFromCache(request);
		if (cached) return cached;
		const cache = await this.cache;
		const result = await fetch(request);
		await cache.put(request, result.clone());
		return result.clone();
	}

	fetch(request: Request) {
		if (request.mode == "navigate" && this.bundleJson.publicPath){
			const path = new URL(request.url).pathname;
			if(path.startsWith(this.bundleJson.publicPath)){
				const rest = path.substring(this.bundleJson.publicPath.length);
				for (let proxy of this.bundleJson.proxy) {
					if (rest.match(new RegExp(proxy.regex))){
						const url = new URL(this.baseURI + proxy.replace, self.origin);
						return this.getFromCacheOrFetch(new Request(url));
					}
				}
			}
		}
		if (request.cache == "reload"){

		}
		if(request.url.startsWith(this.baseURI) || request.url == this.baseURI.substring(0, this.baseURI.length - 1))
			return this.getFromCacheOrFetch(request);
	}
}

export type Asset = {
	path: string;
	hash: string;
	platforms?: string[];
}
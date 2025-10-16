import type {Asset} from "@cmmn/tools"

declare var self: ServiceWorkerGlobalScope;

export class SwStorage {
	private readonly name = `main:${this.uri}`;
	private readonly cloneName = `clone:${this.uri}`;
	private readonly cache: Promise<Cache> = caches.open(this.name);
	// protected platforms = new Set<string>();
    // public size = 0;

	constructor(public readonly uri: string,
                private assets: ReadonlyArray<Asset>,
                private hashHeader: string = 'sw-hash') {
	}
	// save(data: any){
	// 	return SwStorage.info.save(this.baseURI, data);
	// }

	public async clear() {
		await caches.delete(this.name);
		await caches.delete(this.cloneName).catch();
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

    async load(force: boolean = false) {
		await this.loadAssets(await this.cache);
	}

	protected async loadAssets(cache: Cache) {
		let updated = false;
		const unprocessedKeys = new Set((await cache.keys()).map(x => x.url));
		for (let asset of this.assets) {
			// if (asset.platforms && asset.platforms.every(p => !this.platforms.has(p)))
			// 	continue;
			const request = this.getAssetRequest(asset);
			unprocessedKeys.delete(request.url);
			const matched = await this.getFromCache(request);
			if (matched){
				const hash = await this.getHash(matched);
				if (hash == asset.hash)
					continue;
			}
			if (!matched && asset.optional) continue;
			updated = true;
            self.dispatchEvent(new AssetLoadEvent(asset));
			const result = await this.fetchRetry(request);
            if(!result.ok)
                throw new Error(`Failed to fetch ${request.url}: ${result.status} ${await result.text()}`);
			const clone = new Response(result.body, result);
			clone.headers.append(this.hashHeader, asset.hash);
			await cache.put(request, clone);
		}
		// remove old requests
		for (let cacheKey of unprocessedKeys) {
			await cache.delete(cacheKey);
			updated = true;
		}
		return updated;
	}

	private async getHash(response: Response){
		return response.headers.get(this.hashHeader);
	}

	private fetchRetry(request: Request, counter = 0): Promise<Response> {
		return fetch(request).then((res) => {
            if (res.ok || counter > 3) {
                return res;
            }
            return this.fetchRetry(request, counter + 1);
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
        const asset = this.assets.find(x => `${self.origin}${this.uri}/${x.path}` == request.url);
        if (asset){
            request = this.getAssetRequest(asset);
        }
		const cached = await this.getFromCache(request);
		if (cached) return cached;
		const cache = await this.cache;
		const result = await this.fetchRetry(request);
        const clone = result.clone();
        if (asset){
            clone.headers.append(this.hashHeader, asset.hash);
        }
		await cache.put(request, clone);
		return result.clone();
	}

    getAssetRequest(asset: Asset): Request {
        let url = `${this.uri}/${asset.path}`;
        if(url.endsWith('/')) url = url.substring(0, url.length - 1);
        return new Request(url);
    }

	fetch(request: Request) {
		if(!request.url.startsWith(this.uri + '/') && request.url !== this.uri)
			return;

        for (let asset of this.assets) {
            const rest = request.url.substring(this.uri.length);
            if (asset.regex && rest.match(new RegExp(asset.regex))){
                request = this.getAssetRequest(asset);
            }
        }
		return this.getFromCacheOrFetchAndPut(request);
	}
}

export class AssetLoadEvent extends Event {
    static eventName = 'asset-load'
	constructor(public readonly asset: Asset) {
		super(AssetLoadEvent.eventName);
	}
}
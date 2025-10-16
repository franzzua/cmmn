import {AssetLoadEvent} from './sw-storage';
import {ServiceWorkerAction} from '../src/types';
import {ServiceWorkerCache} from "./service-worker-cache";
declare var self: ServiceWorkerGlobalScope;

const cache = new ServiceWorkerCache();
self.addEventListener('install', (event) => {
	// event.waitUntil(caches.delete('root').catch())
});
self.addEventListener('activate', (event) => {
	globalThis.activated = true;
	self.skipWaiting();
});
self.addEventListener('fetch', async (event: FetchEvent) => {
	const request = event.request as Request;
	if(request.mode == "navigate"){
		event.respondWith(cache.fetch(request, true))
		return;
	}
	if (event.request.method !== "GET") return;
	const response = cache.fetchSync(request);
	if (response) {
		event.respondWith(response);
	}
});

self.addEventListener('message', async (event) => {
	try {
		switch (event.data?.action as ServiceWorkerAction) {
			case 'reload':
				await cache.clear();
				break;
			// case 'check':
			// 	storage.checkUpdate(event.data.force);
			// 	break;
			case 'init':
                self.addEventListener(AssetLoadEvent.eventName, (e: AssetLoadEvent)=> {
                    console.log(e.asset.path, cache.totalSize);
                    event.source?.postMessage({
                        action: 'progress',
                        progress: e.asset.size / cache.totalSize
                    });
                })
                await cache.load(event.data.baseURI);
				await self.clients.claim();
				event.source?.postMessage({
					action: 'init' as ServiceWorkerAction,
				});
				break;
		}
	} catch (e) {
		console.error(e);
	}
});

// setInterval(() => {
// 	SwStorage.update();
// }, 60_000)
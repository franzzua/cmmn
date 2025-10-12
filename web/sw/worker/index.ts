import {SwStorage, type Asset} from './sw-storage';
import {ServiceWorkerAction} from '../src/types';
declare var self: ServiceWorkerGlobalScope;

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
		event.respondWith(SwStorage.init().then(() => SwStorage.fetch(request)))
		return;
	}
	if (event.request.method !== "GET") return;
	const response = SwStorage.fetch(request);
	if (response) {
		event.respondWith(response);
	}
});

self.addEventListener('message', async (event) => {
	try {
		switch (event.data?.action as ServiceWorkerAction) {
			case 'reload':
				await SwStorage.clear();
				break;
			// case 'check':
			// 	storage.checkUpdate(event.data.force);
			// 	break;
			case 'init':
				const storage = await SwStorage.get(event.data);
				await storage.load();
				self.clients.claim();
				event.source?.postMessage({
					action: 'init' as ServiceWorkerAction,
				});
				break;
		}
	} catch (e) {
		console.error(e);
	}
});

setInterval(() => {
	SwStorage.update();
})
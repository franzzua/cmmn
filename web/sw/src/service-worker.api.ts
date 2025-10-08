import {InitMessageData, type ServiceWorkerAction} from "./types";

function getPlatform(){
	if (CSS.supports('-webkit-touch-callout', 'none'))
		return 'ios';
	return 'unknown';
}

export class ServiceWorkerApi {
	private worker = navigator.serviceWorker.controller;
	private abort = new AbortController();
	constructor(private options = {
		path: '/sw.js',
		scope: '/',
		// reloadEndpoint: /\.reload/,
		// platform: getPlatform()
	}) {
	}

	reload(){
		this.sendMessage('reload');
		navigator.serviceWorker
			.getRegistration()
			.then((x) => x?.unregister())
	}

	async init(data: InitMessageData): Promise<void> {
		if (!this.worker) {
			await this.registerWorker();
		}
		this.sendMessage({
			action: 'init',
			...data,
		});
		await new Promise<void>(resolve => {
			navigator.serviceWorker.addEventListener('message', ({data}) => {
				switch (data.action) {
					case 'init':
						resolve();
						break;
					case 'update':
						console.log('update');
						break;
				}
			});
		})

	}
	private async registerWorker(){
		const reg = await navigator.serviceWorker
			.register(this.options.path, {
				scope: this.options.scope,
				type: 'module',
			});
		this.worker = await new Promise(resolve => reg.addEventListener('updatefound', () => {
			const newWorker = reg.installing!;

			newWorker.addEventListener('statechange', () => {
				if (newWorker.state === 'activated') {
					resolve(newWorker);
				}
				// newWorker.state has changed
			});
		}));
	}

	private sendMessage<T extends { action: ServiceWorkerAction }>(data: ServiceWorkerAction | T){
		if (typeof data === "string")
			data = { action: data } as T;
		this.worker.postMessage(data);
	}

	[Symbol.dispose]() {
		this.abort.abort();
	}
}


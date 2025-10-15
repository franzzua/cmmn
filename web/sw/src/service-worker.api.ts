import {InitMessageData, type ServiceWorkerAction} from "./types";

function getPlatform(){
	if (CSS.supports('-webkit-touch-callout', 'none'))
		return 'ios';
	return 'unknown';
}

export class ServiceWorkerApi {
	public install = new Promise<BeforeInstallPromptEvent>(resolve =>
		window.addEventListener('beforeinstallprompt', resolve as any)
	);
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
                    case 'progress':
                        console.log(data.progress);
                        globalThis.dispatchEvent(new ProgressEvent(data.progress));
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


export type UserChoice = {
	outcome: 'accepted' | 'dismissed';
	platform: string;
}

type BeforeInstallPromptEvent = Event & {
	/**
	 * Returns an array of DOMString items containing the platforms on which the event was dispatched.
	 * This is provided for user agents that want to present a choice of versions to the user such as,
	 * for example, "web" or "play" which would allow the user to chose between a web version or
	 * an Android version.
	 */
	readonly platforms: Array<string>;

	/**
	 * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
	 */
	readonly userChoice: Promise<UserChoice>;

	/**
	 * Allows a developer to show the install prompt at a time of their own choosing.
	 * This method returns a Promise.
	 */
	prompt(): Promise<void>;
};

export class ProgressEvent extends Event {
    constructor(public readonly progress: number) {
        super('progress');
    }
}

'use strict';

export function registerSW(config: {}) {
	const sw = import.meta.resolve('/sw.js');
	return new Promise<void>((resolve) => {
		ServiceWorkerHandle.worker = navigator.serviceWorker.controller;
		setInterval(
			() =>
				ServiceWorkerHandle.worker?.postMessage({
					action: 'check',
				}),
			30 * 1000
		);

		if (location.pathname.match(/\.reload/)) {
			localStorage.clear();
			document.cookie = '';
			navigator.serviceWorker
				.getRegistration()
				.then((x) => x?.unregister())
				.catch()
				.then(() => {
					setTimeout(() => {
						location.pathname = '/';
					}, 100);
				});
		}
		if (navigator.serviceWorker.controller) {
			const isIOS = CSS.supports('-webkit-touch-callout', 'none');
			navigator.serviceWorker.controller.postMessage({
				action: 'init',
				isIOS: isIOS,
			});
		} else {
			navigator.serviceWorker
				.register(sw, {
					scope: '/',
					type: 'module',
				})
				.then((reg) => {
					reg.addEventListener('updatefound', () => {
						const newWorker = reg.installing!;

						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'activated') {
								ServiceWorkerHandle.worker = newWorker;
								newWorker.postMessage({
									action: 'init',
								});
							}
							// newWorker.state has changed
						});
					});
				});
		}

		navigator.serviceWorker.addEventListener('controllerchange', () => {
			ServiceWorkerHandle.worker = navigator.serviceWorker.controller;
			// This fires when the service worker controlling this page
			// changes, eg a new worker has skipped waiting and become
			// the new active worker.
		});

		navigator.serviceWorker.addEventListener('message', ({data}) => {
			switch (data.action) {
				// case "loading":
				// handle.size += data.size;
				// console.log(`${data.cache}: +${data.size} (${data.url})`);
				// break;

				case 'init':
					ServiceWorkerHandle.worker?.postMessage({
						action: 'check',
					});
					resolve();
					break;
				case 'new-version':
					console.log('web has new version');
					navigator.serviceWorker
						.getRegistration()
						.then((x) => x?.unregister())
						.then((x) => location.reload());
					break;
			}
		});
	});
}

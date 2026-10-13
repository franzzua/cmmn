import {ServiceWorkerApi, type ProgressEvent} from "../src/service-worker.api.ts";

export { ServiceWorkerApi } from "../src/service-worker.api.ts";

const api = globalThis.swApi = new ServiceWorkerApi({
	path: "/_sw.js",
	scope: "/",
});
console.log(document.head.baseURI)
await api.init({
	baseURI: document.head.baseURI.substring(location.origin.length),
});

export default api;

export {
    type ProgressEvent
}
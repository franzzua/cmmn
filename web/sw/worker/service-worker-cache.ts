import {SwStorage} from "./sw-storage";
import {BundleJsonStorage} from "./bundleJsonStorage";
import {BundleLoader} from "./bundle-loader";

export class ServiceWorkerCache {
    private bundleJsonStorage = new BundleJsonStorage();
    private bundleLoader = new BundleLoader(
        path => fetch(path + '/bundle.json').then(x => x.json()),
        this.bundleJsonStorage
    );
    private storages : SwStorage[];
    public totalSize = 0;
    public init = this.restore();
    constructor() {
    }

    async restore() {
        await this.bundleLoader.init;
        this.storages = Array.from(this.bundleLoader.bundles.values())
            .map(x => new SwStorage(self.origin + x.uri, x.getAssets()))
    }

    async load(path: string) {
        await this.init;
        await this.bundleLoader.load(path);
        this.totalSize = Array.from(this.bundleLoader.bundles.values()).map(x => x.size).reduce(
            (a, b) => a + b,
            0
        );
        console.log('total size', this.totalSize);
        this.storages = Array.from(this.bundleLoader.bundles.values())
            .map(x => new SwStorage(self.origin + x.uri, x.getAssets()))
        for (let storage of this.storages) {
            await storage.load();
        }
    }

    async fetch(request: Request, force = false) {
        if (force)
            await this.init;
        return await this.fetchSync(request) ?? await fetch(request);
    }
    fetchSync(request: Request){
        const storage = this.getStorage(request);
        if (storage)
            return storage.fetch(request);
    }

    private getStorage(request: Request){
        for (let storage of this.storages) {
            if (storage.uri == request.url || request.url.startsWith(storage.uri + '/'))
                return storage;
        }
    }

    async clear(){
        this.bundleLoader.clear();
        await this.bundleJsonStorage.clear();
        for (let storage of this.storages) {
            await storage.clear();
        }
        this.storages = [];
    }
}
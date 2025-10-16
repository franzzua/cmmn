import {IBundleJsonStorage} from "./bundleJsonStorage";
import {SwBundle} from "./sw-bundle";
import type {BundleJson} from "@cmmn/tools";

export class BundleLoader {
    public readonly bundles = new Map<string, SwBundle>();
    public readonly init = this.restore();

    constructor(private getBundleJson: (path: string) => Promise<BundleJson>,
                private storage?: IBundleJsonStorage) {
    }


    public async load(uri: string, paths?: string[]) {
        await this.init;
        uri = uri.replace(/\/$/, '');
        if (!this.bundles.has(uri)) {
            const json = await this.getBundleJson(uri);
            await this.storage?.save(json);
            const bundle = new SwBundle(json);
            this.bundles.set(uri, bundle);
        }
        const bundle = this.bundles.get(uri);
        const deps = bundle.load(paths);
        for (let [uri, paths] of deps.entries()) {
            await this.load(uri, Array.from(paths));
        }
        return bundle;
    }

    private async restore() {
        if (!this.storage) return;
        const items = await this.storage.getAll();
        for (let item of items) {
            this.bundles.set(item.baseURI, new SwBundle(item));
        }
    }

    clear() {
        this.bundles.clear();
    }
}
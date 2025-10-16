import {Asset, BundleJson} from "@cmmn/tools";

export class SwBundle {
    private assets = new Set<Asset>();
    private allAssets = new Map<string, Asset>(this.bundleJson.assets.map(x => [x.path, x]));

    constructor(private bundleJson: BundleJson) {

    }
    public get uri(){
        return this.bundleJson.baseURI;
    }

    load(paths: Iterable<string> = this.allAssets.keys()){
        const deps = new Map<string, Set<string>>();
        for (let path of paths) {
            const asset = this.allAssets.get(path)
            if (this.assets.has(asset)) continue;
            this.assets.add(asset);
            for (let uri in asset.deps) {
                const assets = asset.deps[uri];
                if(uri == ".") uri = this.bundleJson.baseURI;
                if (!deps.has(uri))
                    deps.set(uri, new Set(assets));
                else {
                    const dep = deps.get(uri);
                    assets.forEach(x => dep.add(x));
                }
            }
        }
        return deps;
    }

    getAssets(): ReadonlyArray<Asset> {
        return Array.from(this.assets);
    }

    get size(){
        let size = 0;
        this.assets.forEach(x => size += x.size);
        return size;
    }
}


import {Output} from "./vite.builder";
import {getAssets} from "./asset-collection";
import {readdir, stat} from "node:fs/promises";
import path from "node:path";
import {BundleJson} from "./target-web-server";
import {Target} from "../model/target";

export class BundleJsonBuilder {
    constructor(private target: Target,
                private url: string) {

    }

    public async getBundleJson(bundle: Output[]): Promise<BundleJson> {
        const data = {
            publicPath: this.target.publicPath,
            proxy: this.target.proxy.map(x => ({
                regex: x.regex.source,
                replace: this.target.getEntry("." + x.replace)?.output
            }))
        };
        const assets = await getAssets(bundle);
        for (let asset of assets) {
            const entry = this.target.entries.find(x => x.relative == './' + asset.path);
            if (entry) {
                asset.path = entry.output;
            }
        }
        for (let file of await readdir(this.target.publicDir, {
            recursive: true
        }).catch(() => [])) {
            const info = await stat(path.join(this.target.publicDir, file));
            assets.push({
                path: file,
                hash: info.mtimeMs.toString(36),
                size: info.size,
                optional: !file.endsWith('.json') // TODO: check importance?
            });
        }
        const bundles = new Set(bundle.flatMap(x => x.deps)
            .filter(x => x.package.startsWith(this.url))
            .map(x => x.package));
        return {
            ...data,
            assets,
            deps: Array.from(bundles).map(x => ({
                baseURI: x,
                path: ''
            }))
        };
    }

}
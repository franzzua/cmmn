import {Entry, Pack} from "./pack";
import {Target} from "./target";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {subtle} from "crypto";
import {string} from "fast-glob/out/utils";

export class Bundle {
    constructor(private pack: Pack, private output: Output[]) {
    }

    fileNames(){
        return this.output.map(x => x.entry?.output ?? x.fileName);
    }

    get(id: string){
        return this.output.find(x => x.fileName == id || x.entry?.output == id)?.data;
    }

    async getPublicAsset(id: string){
        if (!(this.pack instanceof Target) || !this.pack.publicDir) {
            return undefined;
        }
        return readFile(path.join(this.pack.publicDir, id))
    }

    async getBundleJson(): Promise<BundleJson>{
        return {
            baseURI: this.pack.publicPath,
            assets: [
                ...(await Promise.all(this.output.map(o => this.getOutputAsset(o)))),
            ],
        }
    }

    private async getOutputAsset(output: Output): Promise<Asset> {
        return {
            path: output.entry?.output ?? output.fileName,
            hash: await getHash(output.data),
            size: output.data.length,
            regex: output.entry && this.pack instanceof Target
                ? this.pack.proxy.find(x => x.replace == output.entry.name)?.regex.source
                : undefined,
            deps: Object.fromEntries(this.getDeps(output)),
        }
    }

    private *getDeps(output: Output): Generator<[string, string[]]>{
        const flat = output.deps.map(x => ({
            baseURI: x.pack === this.pack ? "." : x.pack.publicPath,
            path: x.path
        }));
        if (typeof output.data === "string"){
            for (let fileName of this.fileNames()) {
                if (output.data.includes(`new URL("${fileName}"`)) {
                    flat.push({ baseURI: ".", path: fileName });
                }
                if (output.data.includes(`import("./${fileName}"`)) {
                    flat.push({ baseURI: ".", path: fileName });
                }
            }
        }

        const grouped = Map.groupBy(flat, x => x.baseURI);
        for (let [uri, deps] of grouped) {
            yield [uri, Array.from(new Set(deps.map(x => x.path)))];
        }
    }
}

export async function getHash(data: string | Uint8Array) {
    const buffer = Buffer.from(data);
    const hash = await subtle.digest('SHA-1', buffer);
    return Buffer.from(hash).toString('base64');
}

export type Output = {
    entry?: Entry;
    fileName: string;
    data: string | Uint8Array;
    deps: Array<{
        pack: Pack;
        path: string;
    }>
}
export type BundleJson = {
    baseURI: string;
    assets: Asset[];
}
export type Asset = {
    path: string;
    regex?: string;
    hash: string;
    size: number;
    optional?: boolean;
    deps: Record<string, string[]>;
}
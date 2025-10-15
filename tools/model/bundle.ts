import {Entry, Pack} from "./pack";
import {Asset} from "../dev-server/asset-collection";
import {Target} from "./target";
import {readFile} from "node:fs/promises";
import path from "node:path";

export class Bundle {
    constructor(private pack: Pack, private output: Output[]) {
    }

    fileNames(){
        return this.output.map(x => x.fileName);
    }

    get(id: string){
        return this.output.find(x => x.fileName == id || x.entry?.output == id)?.data;
    }

    async getPublicAsset(id: string){
        if (!(this.pack instanceof Target) || !this.pack.publicDir) {
            return [];
        }
        return readFile(path.join(this.pack.publicDir, id))
    }

    async getBundleJson(): Promise<BundleJson>{
        return {} as any;
    }
}

export type Output = {
    entry?: Entry;
    fileName: string;
    data: string | Uint8Array;
    deps: Array<{
        package: string;
        path: string;
    }>
}
export type BundleJson = {
    assets: Asset[];
    deps: {
        baseURI: string;
        path: string;
    }[]
    publicPath?: string;
    proxy?: {
        regex: string;
        replace: string;
    }[]
}
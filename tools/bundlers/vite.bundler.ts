import {
    build,
    InlineConfig,
} from "vite";
import {RollupOutput} from "rollup";
import {IBundler} from "./types";
import {Bundle, Output} from "../model/bundle";
import {ViteBuilder} from "./vite.builder";

export class ViteBundler extends ViteBuilder implements IBundler {

    async getBundleConfig(): Promise<InlineConfig>{
        const config = await this.getConfig();
        config.build.lib = {
            entry: Object.fromEntries(this.target.entries
                .filter(x => !x.isExcluded)
                .map(x => [x.name, x.source])) as any,
            fileName: (format, entryName) => {
                if (entryName == '') entryName = 'index';
                return entryName + '.js';
            },
            formats: ['es'],
        };
        config.build.modulePreload = false;
        return config;
    }

    private async createBundle(): Promise<RollupOutput[]> {
        if (!this.target.entries.length)
            return [];
        const config = await this.getBundleConfig();
        return build(config).catch(err => {
            this.target.error(err.message);
            return [];
        }) as Promise<RollupOutput[]>;
    }
    public async bundle(): Promise<Bundle>{
        const rollupOutput = await this.createBundle()
        const outputChunks = rollupOutput.flatMap(x => x.output);
        const entryMap = new Map(this.target.entries.map(x => [x.relative, x]))
        const outputs = outputChunks.map(x => {
            return {
                fileName: x.fileName,
                entry: entryMap.get(x.fileName),
                data:  x.type == "asset" ? x.source : x.code,
                deps: x.type == "asset" ? [] : [
                    ...x.imports,
                    ...x.dynamicImports
                ].filter(x => !/^node:/.test(x)).map(path => path.replace(/^(\.\.\/)+/,'/')).map(path => this.resolver?.getPack(path) ?? {
                    pack: this.target,
                    path: path
                })
            } as Output
        });
        return new Bundle(this.target, outputs);
    }

}

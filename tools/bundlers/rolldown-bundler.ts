import {crc32} from "node:zlib";
import fs from "node:fs/promises";
import {wasm} from "./plugins/wasm";
import {swcMinifyPlugin} from "./plugins/minify";
import path, {join} from "node:path";
import {Bundle, Output} from "../model/bundle";
import {Entry, Pack} from "../model/pack";
import {Resolver} from "../model/resolver";
import {Flags} from "../model/flags";
import {BuildOptions} from "rolldown";
import {esmExternalRequirePlugin} from "rolldown/experimental";
import {IBundler} from "./types";
import {Plugin} from "rolldown";

export class RolldownBundler implements IBundler{
    constructor(private pack: Pack,
                private resolver: Resolver) {
    }

    private async getFileContent(entry: Entry) {
        const target = entry.name ? `${this.pack.name}/${entry.name}` : `${this.pack.name}`;
        if (this.pack.packageJson.type === "module")
            return `export * from '${target}';`
        const pkg = await import(target, entry.source.endsWith('.json') ? {
            with: {
                type: 'json'
            }
        } : {});
        const keys = Object.keys(pkg).filter(x => x !== 'default');
        return [
            `import * as result from '${target}';`,
            `export const { ${keys.join(',')} } = result;`,
            ('default' in pkg) ? 'export default result.default;' : ''
        ].join('\n');
    }

    dir = path.join(process.cwd(), './node_modules/.cmmn');

    async getInputs(): Promise<AsyncDisposable & Record<string, string>> {
        const result: AsyncDisposable & Record<string, string> = {
            async [Symbol.asyncDispose]() {
                for (let file of Object.values(this)) {
                    if (typeof file === 'string')
                        await fs.rm(file);
                }
            }
        };
        for (let entry of this.pack.entries) {
            const id = crc32(entry.name + new Date() + Math.random());
            const file = `${this.dir}/.${id}.js`;
            const content = await this.getFileContent(entry);
            await fs.mkdir(this.dir, {recursive: true});
            await fs.writeFile(file, content, 'utf-8');
            result[entry.name] = file;
        }
        return result;
    }

    private getConfig(): BuildOptions {
        return {
            write: false,
            output: {
                format: 'esm',
                // chunkFileNames: chunk =>  '@_/' + chunk.name + '.js',
                // assetFileNames: asset =>  '@_/' + asset.name + '.js',
            },
            define: {
                'process.env.NODE_ENV': Flags.Current.production ? '"production"' : '"development"'
            },
            experimental: {},
            platform: 'browser',
            resolve: {
                mainFields: [
                    'browser',
                    'module',
                    'main',
                ],
            },
            optimization: {
                inlineConst: Flags.Current.minify,
            },
            // treeshake: true,
            plugins: [...this.getPlugins()]
        }
    }

    // TODO: Filter hook https://rolldown.rs/in-depth/why-plugin-hook-filter#when-to-use-filters
    * getPlugins(): Generator<Plugin> {
        yield wasm({
            emitAsset: true,
            assetName: `{name}`
        }) as any;
        yield {
            name: 'require',
            load: id => {
                const prefix = 'builtin:esm-external-require-';
                if (id.startsWith(prefix)){
                    const resolved = this.resolver.resolveId(id.substring(prefix.length), null, null)
                    return `export * from "${resolved}"`;
                }
            }
        };
        yield {
            name: 'externals',
            resolveId: (id, importer, options) => {
                if (options.kind === 'require-call')
                    return;
                const resolved = this.resolver.resolveId(id, importer, options);
                if (resolved && resolved.pack !== this.pack)
                    return resolved;
            }
        };
        yield esmExternalRequirePlugin({
            external: this.resolver.getPackNames().filter(x => x !== this.pack.name),
        });
        if (Flags.Current.minify)
            yield swcMinifyPlugin() as any;
    }

    async bundle(): Promise<Bundle> {
        const {build} = await import("rolldown");
        await using input = await this.getInputs();
        const config = this.getConfig();
        const result = await build({
            ...config,
            input
        });
        const outputs = result.output.map(x => ({
            fileName: x.fileName,
            entry: this.pack.getEntry(x.name),
            data: x.type == "asset" ? x.source : x.code,
            deps: x.type == "asset" ? [] : [
                ...x.imports,
                ...x.dynamicImports
            ].map(path => ({
                package: path,
                path: ''
            }))
        } as Output));
        return new Bundle(this.pack, outputs);
    }
}
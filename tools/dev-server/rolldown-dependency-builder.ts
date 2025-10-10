import {fileURLToPath} from "node:url";

import {crc32} from "node:zlib";
import fs, {readFile} from "node:fs/promises";
import {wasm} from "./plugins/wasm";
import {swcMinifyPlugin} from "./plugins/minify";
import path, {dirname, relative} from "node:path";

export class RolldownDependencyBuilder {
    constructor(private externals: string[],
                private basePath: string,
                private minify: boolean = false) {
    }

    async getFileContent(target: string, isModule: boolean){
        if (isModule) return `export * from '${target}';`
        const pkg = await import(target);
        const keys = Object.keys(pkg).filter(x => x !== 'default');
        return [
            `import * as result from '${target}';`,
            `export const { ${keys.join(',')} } = result;`,
            ('default' in pkg) ? 'export default result.default;' : ''
        ].join('\n');
    }

    dir = path.join(process.cwd(), './node_modules/.cmmn');

    async getEntry(target: string, isModule: boolean): Promise<AsyncDisposable & Record<string, string>>{
        const id = crc32(target + new Date() + Math.random());
        const file = `${this.dir}/.${id}.js`;
        const content = await this.getFileContent(target, isModule);
        await fs.mkdir(this.dir, { recursive: true });
        await fs.writeFile(file, content, 'utf-8');
        return {
            index: file,
            [Symbol.asyncDispose](){
                return fs.rm(file);
            }
        };
    }

    getModuleEntry(target: string){
        const targetUrl = import.meta.resolve(target);
        const targetFile = fileURLToPath(targetUrl);
        return {
            index: targetFile,
            [Symbol.asyncDispose]: () => Promise.resolve()
        }
    }

    async build(target: string, isModule: boolean): Promise<Record<string, string | Uint8Array>> {
        const {build} = await import("rolldown");
        const {esmExternalRequirePlugin} = await import("rolldown/experimental");
        await using input = await this.getEntry(target, isModule);
        const chunkBase = target.split('/').pop() + '/@_'
        try {
            const result = await build({
                input,
                write: false,
                output: {
                    format: 'esm',
                    chunkFileNames: chunk =>  chunkBase+ '/' + chunk.name + '.js',
                    assetFileNames: asset =>  chunkBase+ '/' + asset.name + '.js',
                },
                experimental: {

                },
                platform: 'browser',
                resolve: {
                    mainFields: [
                        'browser',
                        'module',
                        'main',
                    ],
                },
                external: [
                    `${this.basePath}/*`,
                ],
                optimization: {
                    inlineConst: this.minify,
                },
                treeshake: true,
                plugins: [
                    wasm({
                        emitAsset: true,
                        assetName: `${target}/{name}`
                    }),
                    {
                        name: 'require',
                        load: id => {
                            const prefix = 'builtin:esm-external-require-';
                            if (id.startsWith(prefix)){
                                return `export * from "${this.basePath}/${id.substring(prefix.length)}"`;
                            }
                        }
                    },
                    {
                        name: 'externals',
                        resolveId: (id, importer, options)=> {
                            if (options.kind !== 'require-call' && id !== target
                                && this.externals.includes(id) )
                                return {
                                    external: "absolute",
                                    id: this.basePath + '/' + id
                                }
                        }
                    },
                    esmExternalRequirePlugin({
                        external: this.externals.filter(x => x !== target),
                    }),
                    ...(this.minify ? [swcMinifyPlugin()] : [])
                ]
            });
            return Object.fromEntries([
                ...result.output
                    .filter(x => x.type == "chunk")
                    .map(x => [(x.name === 'index' ? '' : x.fileName.replace(chunkBase, '@_')), x.code]),
                ...result.output
                    .filter(x => x.type !== "chunk")
                    .map(x => ['@_/'+x.fileName, x.source])
            ]);
        } finally {
            // await entryPoints[Symbol.asyncDispose]();
        }
    }
}
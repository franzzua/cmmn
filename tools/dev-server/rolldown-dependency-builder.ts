import {fileURLToPath} from "node:url";

import {crc32} from "node:zlib";
import fs, {readFile} from "node:fs/promises";
import {dirname, relative} from "node:path";

export class RolldownDependencyBuilder {
    constructor(private externals: string[], private basePath: string) {
    }

    async getFileContent(target: string){
        const pkg = await import(target);
        const keys = Object.keys(pkg).filter(x => x !== 'default');
        return [
            `import * as result from '${target}';`,
            `export const { ${keys.join(',')} } = result;`,
            ('default' in pkg) ? 'export default result.default;' : ''
        ].join('\n');
    }

    dir = './node_modules/.cmmn';

    async getEntry(target: string): Promise<AsyncDisposable & Record<string, string>>{
        const id = crc32(target + new Date() + Math.random());
        const file = `${this.dir}/.${id}.js`;
        const content = await this.getFileContent(target);
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

    async build(target: string, isModule: boolean) {
        const {build} = await import("rolldown");
        const {esmExternalRequirePlugin} = await import("rolldown/experimental");
        await using input = isModule ? this.getModuleEntry(target) : await this.getEntry(target);
        const chunkBase = target.split('/').pop() + '/@_'
        try {
            const result = await build({
                input,
                write: false,
                output: {
                    format: 'esm',
                    chunkFileNames: chunk =>  chunkBase+ '/' + chunk.name + '.js',
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
                    inlineConst: false,
                },
                treeshake: true,
                plugins: [
                    {
                        name: 'wasm',
                        async load(id) {
                            if (!/\.wasm$/.test(id)) return null;
                            const rel = relative(input.index, id);
                            this.emitFile({
                                type: 'asset',
                                source: await this.fs.readFile(id),
                                name: 'Rollup WASM Asset',
                                fileName: '/'+rel
                            });
                            return rel;
                        },
                        transform(code, id){
                            if (!/\.wasm$/.test(id)) return null;
                            return {
                                map: {
                                    mappings: ''
                                },
                                code: [
                                    `const url = new URL('./${code}', import.meta.url);`,
                                    `const ab = await fetch(url).then(x => x.arrayBuffer())`,
                                    `export default new WebAssembly.Module(ab);`
                                ].join('\n')
                            }
                        }
                    },
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
                    })
                ]
            });
            return Object.fromEntries([
                ...result.output
                    .filter(x => x.type == "chunk")
                    .map(x => [(x.name === 'index' ? '/' : x.fileName.substring(chunkBase.length)), x.code]),
                ...result.output
                    .filter(x => x.type !== "chunk")
                    .map(x => [x.fileName, x.source])
            ]);
        } finally {
            // await entryPoints[Symbol.asyncDispose]();
        }
    }
}
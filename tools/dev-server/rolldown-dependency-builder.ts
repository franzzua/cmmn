import {fileURLToPath} from "node:url";
import {wasmResolver} from "./wasm-resolver.js";
import {PackageConfig} from "import-meta-resolve/lib/resolve";
import {crc32} from "node:zlib";
import fs from "node:fs/promises";
import {JSONSchemaForNPMPackageJsonFiles} from "@schemastore/package";

export class RolldownDependencyBuilder {
    constructor(private dependencies: string[], private basePath: string) {
    }

    async getFileContnet(target: string){
        const pkg = await import(target);
        const keys = Object.keys(pkg).filter(x => x !== 'default');
        return [
            `import * as result from '${target}';`,
            `export const { ${keys.join(',')} } = result;`,
            ('default' in pkg) ? 'export default result.default;' : ''
        ].join('\n');
    }

    dir = './node_modules/.cmmn';

    async getEntry(target: string, pkgJSON: JSONSchemaForNPMPackageJsonFiles): Promise<AsyncDisposable & Record<string, string>>{
        if (pkgJSON.type === 'module' || pkgJSON.module){
            const targetUrl = import.meta.resolve(target);
            const targetFile = fileURLToPath(targetUrl);
            return {
                index: targetFile,
                [Symbol.asyncDispose]: () => Promise.resolve()
            }
        }
        const id = crc32(target + new Date() + Math.random());
        const file = `${this.dir}/.${id}.js`;
        const content = await this.getFileContnet(target);
        await fs.mkdir(this.dir, { recursive: true });
        await fs.writeFile(file, content, 'utf-8');
        return {
            index: file,
            [Symbol.asyncDispose](){
                return fs.rm(file);
            }
        };
    }

    async build(target: string, pkgJSON: JSONSchemaForNPMPackageJsonFiles) {
        const rolldown = await import("rolldown");
        const {esmExternalRequirePlugin} = await import("rolldown/experimental");
        const wasmPlugin = await import("@rollup/plugin-wasm");
        await using input = await this.getEntry(target, pkgJSON);
        try {
            const result = await rolldown.build({
                input,
                write: false,
                output: {
                    format: 'esm',
                    chunkFileNames: chunk =>  target + '/@_/' + chunk.name + '.js',
                    preserveModulesRoot: '/preserveModulesRoot'
                },
                experimental: {

                },
                platform: 'browser',
                resolve: {
                    // alias: Object.fromEntries(this.dependencies
                    //     .filter(x => x !== target)
                    //     .map(dep =>
                    //         [dep, this.basePath + '/' + dep]
                    //     )),
                    mainFields: [
                        'module',
                        'browser',
                        'main',
                    ],
                },
                external: [
                    `${this.basePath}/*`,
                ],
                plugins: [
                    wasmPlugin.wasm({
                        publicPath: this.basePath + '/' +target + '/',
                        maxFileSize: Number.MAX_SAFE_INTEGER
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
                                && this.dependencies.includes(id) )
                                return {
                                    external: true,
                                    id: this.basePath + '/' + id
                                }
                        }
                    },
                    esmExternalRequirePlugin({
                        external: this.dependencies.filter(x => x !== target),
                    })
                ]
            });
            return Object.fromEntries(
                result.output
                    .filter(x => x.type == "chunk")
                    .map(x => [(x.name === 'index' ? '/' : x.fileName.substring(target.length + 3)), x.code])
            );
        } finally {
            // await entryPoints[Symbol.asyncDispose]();
        }
    }
}
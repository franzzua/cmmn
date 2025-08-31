import {crc32} from "node:zlib";
import fs from "node:fs/promises";
import url from "url";
import {wasmResolver} from "./wasm-resolver";

export class EsBuildDependencyBuilder {

    constructor(dependencies, basePath, mode) {
        this.mode = mode;
        this.basePath = basePath;
        this.dependencies = dependencies;
        this.externals = dependencies.map(id =>
            [id, `${basePath}/${id}`]
        );
    }

    canHandle(target) {
        return this.dependencies.some(x => target.startsWith(x));
    }

    async getFileContnet(target, pkgJSON){
        if (pkgJSON.type === 'module')
            return  `export * from '${target}'`;
        const pkg = await import(target);
        const keys = Object.keys(pkg).filter(x => x !== 'default');
        return [
            `import * as result from '${target}';`,
            `export const { ${keys.join(',')} } = result;`,
            ('default' in pkg) ? 'export default result.default;' : ''
        ].join('\n');
    }

    getAlias(target){
        return Object.fromEntries(this.externals.filter(x => !target.startsWith(x[0]+'/') && target !== x[0]));
    }
    dir = './node_modules/.cmmn';

    async getEntry(target, pkgJSON){
        const id = crc32(target + new Date() + Math.random());
        const file = `${this.dir}/.${id}.js`;
        const content = await this.getFileContnet(target, pkgJSON);
        await fs.mkdir(this.dir, { recursive: true });
        await fs.writeFile(file, content, 'utf-8');
        return {
            index: file,
            [Symbol.asyncDispose](){
                return fs.rm(file);
            }
        };
    }

    async build(target, pkgJSON) {
        const esbuild = await import('esbuild');
        const entryPoints = await this.getEntry(target, pkgJSON)
        try {
            const build = await esbuild.build({
                entryPoints,
                platform: 'browser',
                alias: this.getAlias(target),
                mainFields: ['module', 'browser', 'main'],
                external: [
                    `${this.basePath}/*`
                ],
                outdir: '/',
                publicPath: `${this.basePath}/${target}/_/`,
                loader: {},
                supported: {
                    'dynamic-import': true
                },
                bundle: true,
                target: 'esnext',
                format: 'esm',
                write: false,
                globalName: 'result',
                plugins: [
                    wasmResolver,
                    esbuildCjsExternalPlugin(this.dependencies, 'browser', this.basePath)
                ],
            });
            return Object.fromEntries(
                build.outputFiles.map(x => [(x.path.match(/\/index\.[tj]s/) ? '/' : x.path), x.contents])
            );
        } finally {
            await entryPoints[Symbol.asyncDispose]();
        }
    }
}

const escapeRegexRE = /[-/\\^$*+?.()|[\]{}]/g
export function escapeRegex(str) {
    return str.replace(escapeRegexRE, '\\$&')
}

const matchesEntireLine = (text) => `^${escapeRegex(text)}$`
const nonFacadePrefix = 'vite-cjs-external-facade:'
const cjsExternalFacadeNamespace = 'vite:cjs-external-facade'

// esbuild doesn't transpile `require('foo')` into `import` statements if 'foo' is externalized
// https://github.com/evanw/esbuild/issues/566#issuecomment-735551834
export function esbuildCjsExternalPlugin(
    externals,
    platform,
    basePath,
) {
    return {
        name: 'cjs-external',
        setup(build) {
            const filter = new RegExp(externals.map(matchesEntireLine).join('|'))

            build.onResolve({ filter: new RegExp(`^${nonFacadePrefix}`) }, (args) => {
                return {
                    path: args.path.slice(nonFacadePrefix.length),
                    external: true,
                }
            })

            build.onResolve({ filter }, (args) => {
                // preserve `require` for node because it's more accurate than converting it to import
                if (args.kind === 'require-call' && platform !== 'node') {
                    return {
                        path: basePath + '/' + args.path,
                        namespace: cjsExternalFacadeNamespace,
                    }
                }
            })

            build.onLoad(
                { filter: /.*/, namespace: cjsExternalFacadeNamespace },
                (args) => ({
                    contents:
                        `import * as m from ${JSON.stringify(
                            nonFacadePrefix + args.path,
                        )};` + `module.exports = m;`,
                }),
            )
        },
    }
}

export const DependencyBuilder = EsBuildDependencyBuilder;
import {crc32} from "node:zlib";
import fs from "node:fs/promises";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export class ViteDependencyBuilder {

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
        if (pkgJSON.type === 'module' || pkgJSON.module)
            return  `export * from '${target}'`;
        const pkg = await import(target);
        if ('default' in pkg) {
            const keys = Object.keys(pkg).filter(x => x !== 'default');
            return [
                `import * as result from '${target}';`,
                `export const { ${keys.join(',')} } = result;`,
                'export default result.default;'
            ].join('\n');
        }
        return  `export { ${Object.keys(pkg).join(',')} } from '${target}'`;
    }

    getAlias(target){
        return Object.fromEntries();
    }

    async build(target, pkgJSON) {
        const start = +performance.now();
        const vite = await import('vite');
        const dir = './node_modules/.cmmn';
        const id = crc32(target + new Date() + Math.random());
        const file = `${dir}/.${id}.js`;
        const content = await this.getFileContnet(target, pkgJSON);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(file, content, 'utf-8');
        try {
            const build = await vite.build({
                logLevel: 'silent',
                build: {
                    lib: {
                        entry: file,
                        formats: ['es'],
                    },
                    write: false,
                    minify: false,
                    rollupOptions: {
                        external: [
                            new RegExp(`^${this.basePath}`)
                            ]
                    },
                    target: 'chrome89',
                },
                resolve: {
                    alias: [
                        ...this.externals.filter(x => !target.startsWith(x[0]+'/') && target !== x[0]).map(x => ({
                            find: x[0],
                            replacement: x[1]
                        })),
                    ],
                },
                html: false,
                keepProcessEnv: true,
                define: {
                    process: {
                        env: {
                            NODE_ENV: `"${this.mode ?? 'development'}"`
                        }
                    },
                },
                plugins: [
                    topLevelAwait(), wasm()
                ],
                mode: 'production',
            });
            const end = +performance.now();
            console.log(`[cmmn:framework] bundle ${target} for ${((end - start)/1000).toFixed(2)}s`)
            return Object.fromEntries(
                build.flatMap(x => x.output.map(x => [
                    (x.isEntry ? '/' : x.fileName), x.code
                ]))
            );
        } catch (e) {
            console.error(e);
            return '';
        } finally {
            await fs.rm(file).catch(() => {});
        }
    }
}


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

    async build(target, pkgJSON) {
        const start = +performance.now();
        const esbuild = await import('esbuild');
        const dir = './node_modules/.cmmn';
        const id = crc32(target + new Date() + Math.random());
        const file = `${dir}/.${id}.js`;
        if (pkgJSON.type !== 'module'){

        }
        const content = await this.getFileContnet(target, pkgJSON);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(file, content, 'utf-8');
        try {
            const build = await esbuild.build({
                entryPoints: {
                    index: file
                },
                platform: 'browser',
                alias: this.getAlias(target),
                mainFields: ['module', 'browser', 'main'],
                external: [
                    `${this.basePath}/*`
                ],
                outdir: '/',
                publicPath: `${this.basePath}/${target}/_/`,
                loader: {
                },
                supported: {
                    'dynamic-import': true
                },
                bundle: true,
                target: 'esnext',
                format: 'esm',
                write: false,
                globalName: 'result',
                plugins: [
                    await import('esbuild-plugin-wasm').then(x => x.wasmLoader({
                        mode: 'embedded'
                    })),
                    esbuildCjsExternalPlugin(this.dependencies, 'browser', this.basePath)
                ],
            });
            const end = +performance.now();
            console.log(`[cmmn:framework] bundle ${target} for ${((end - start)/1000).toFixed(2)}s`)
            return Object.fromEntries(
                build.outputFiles.map(x => [(x.path === '/index.js' ? '/' : x.path), x.contents])
            );
        } catch (e) {
            console.error(e);
            return '';
        } finally {
            await fs.rm(file).catch(() => {});
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
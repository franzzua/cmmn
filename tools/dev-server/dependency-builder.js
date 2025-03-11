import {memfs} from 'memfs';
import {crc32} from "node:zlib";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import fs from "fs";
import path from "path";

export class RolldownDependencyBuilder {

    constructor(dependencies, basePath, mode) {
        this.mode = mode;
        this.dependencies = dependencies;
        this.externals = dependencies.map(d =>
            [d, `${basePath}/${d}`]
        );
    }

    async build(target) {
        const {rolldown} = await import('rolldown');
        const build = await rolldown({
            input: target,
            resolve: {
                alias: {
                    ['^react$']: `@id/react`
                },
                // alias: Object.fromEntries(this.externals.filter(x => x[0] !== target))
            },
            external: [
                'react'
            ],
            format: 'esm',
            define: {
                process: JSON.stringify({
                    env: {
                        NODE_ENV: `"${this.mode}"`
                    }
                })
            },
            platform: 'browser',
        });
        const output = await build.generate({
            platform: 'browser',
            esModule: true,
            define: {
                process: JSON.stringify({
                    env: {
                        NODE_ENV: `"${this.mode}"`
                    }
                })
            },
            polyfillRequire: true,
            format: 'esm',
        });
        return output.output.map(x => x.code).join('\n\n')
    }
}

export class EsBuildDependencyBuilder {

    constructor(dependencies, basePath, mode) {
        this.mode = mode;
        this.dependencies = dependencies;
        this.externals = dependencies.map(id =>
            [id, `${basePath}/${id}`]
        );
    }

    canHandle(target) {
        return this.dependencies.some(x => target.startsWith(x));
    }

    async build(target) {
        const esbuild = await import('esbuild');
        const id = crc32(target + new Date() + Math.random());
        const file = `./${id}.js`;

        const content = `export * from '${target}'`
        await fs.promises.writeFile(file, content, 'utf-8');
        // fs.writeFileSync(entry, `export {${Object.keys(res).join(',')}} from "${target}";`, {
        //     encoding: 'utf-8'
        // })
        console.log(target);
        try {
            const build = await esbuild.build({
                entryPoints: {
                    index: file
                },
                platform: 'browser',
                alias: Object.fromEntries(this.externals.filter(x => !target.startsWith(x[0]))),
                mainFields: ['module', 'browser', 'main'],
                external: [
                    '/_/@id/*'
                ],
                outdir: '/',
                publicPath: `/_/@id/${target}/_/`,
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
                    }))
                ],
                // externals: ['react'],
            });
            const result = Object.fromEntries(
                build.outputFiles.map(x => [x.path == '/index.js' ? '/' : x.path, x.text])
            );
            await fs.promises.rm(file);
            return result;
        } catch (e) {
            console.error(e);
            await fs.promises.rm(file).catch(() => void 0);
            return '';
        }
    }
}

export class RsPackDependencyBuilder {
    outFile = '/tmp/rspack/main.mjs';

    constructor(dependencies, basePath, mode) {
        this.mode = mode;
        this.dependencies = dependencies;
        this.externals = dependencies.map(d =>
            [d, `${basePath}/${d}`]
        );
    }

    async build(target, isESM) {
        const {rspack} = await import('@rspack/core');
        const compiler = await rspack({
            entry: target,
            mode: 'none',
            output: {
                library: {
                    type: 'module',
                },
                module: true,
                path: '/tmp/rspack',
                wasmLoading: 'fetch',
            },
            resolve: {
                mainFields: ['module', 'browser', 'main'],
                alias: {
                    'loro\-crdt$': '/mnt/dev/cmmn/node_modules/loro-crdt/bundler/index.js'
                }
            },
            devtool: false,
            optimization: {
                concatenateModules: true,
                avoidEntryIife: true,
                providedExports: true,
                minimize: false,
                removeEmptyChunks: true,
                emitOnErrors: true,
                splitChunks: false,
                mangleExports: 'deterministic',
                innerGraph: true
            },
            plugins: [
                new NodePolyfillPlugin(),
                new rspack.DefinePlugin({
                    process: {
                        env: {
                            NODE_ENV: `"${this.mode ?? 'development'}"`
                        }
                    }
                })
            ],
            experiments: {
                asyncWebAssembly: true
            },
            target: 'web',
            cache: false,
            externals: Object.fromEntries(this.externals.filter(x => x !== target)),
        });
        compiler.outputFileSystem = memfs().fs;
        return await new Promise((resolve, reject) => compiler.run((err, stats) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                // console.log([...stats.compilation.modules].map(x => x.resource));
                const content = compiler.outputFileSystem.readFileSync(this.outFile, {encoding: 'utf-8'})
                    + '\nexport { __webpack_exports__ };';
                resolve(content);
            }
            compiler.close(closeErr => {
                if (closeErr)
                    console.error(closeErr);
            });
        }));
    }
}

export class RsBuildDependencyBuilder {
    outFile = '/tmp/rspack/main.mjs';

    constructor(dependencies, basePath, mode) {
        this.mode = mode;
        this.dependencies = dependencies;
        this.externals = dependencies.map(d =>
            [d, `${basePath}/${d}`]
        );
    }

    async build(target, isESM) {
        const {build, defineConfig} = await import('@rslib/core');
        const id = crc32(JSON.stringify({target, date: new Date()}));
        const input = `./${id}.js`;
        const output = `/tmp/${id}/`;
        let exports = [];
        if (!isESM) {
            const pkg = await import(target);
            const keys = Object.keys(pkg);
            exports = keys.filter(x => x !== 'default');
        }
        await fs.promises.writeFile(input, `export * from "${target}";`, {encoding: "utf-8"});
        const config = await defineConfig({
            lib: [{
                source: {
                    entry: {
                        index: input
                    },
                    define: {
                        process: {
                            env: {
                                NODE_ENV: this.mode
                            }
                        }
                    },
                },
                format: 'esm',
                syntax: 'es2022',
                output: {
                    target: 'web',
                    polyfill: 'usage',
                    externals: {
                        ...Object.fromEntries(this.externals.filter(x => x !== target)),
                    },
                    minify: false,
                    sourceMap: false,
                    distPath: {
                        root: output,
                    },
                },
                shims: {
                    esm: {
                        __dirname: true,
                        // __filename: true,
                        // require: true
                    }
                },
                mode: 'production',
                autoExtension: false,
                plugins: [
                    await import('@rsbuild/plugin-node-polyfill').then(x => x.pluginNodePolyfill({
                        force: true,
                        protocolImports: true
                    })),
                ]
            }],
        });
        await build(config);
        const results = {};
        for await (let file of getFiles(output)) {
            console.log(path.relative(output, file), file);
            results[path.relative(output, file)] = await fs.promises.readFile(file);
            await fs.promises.rm(file, {force: true});
        }
        await fs.promises.rm(output, {recursive: true});
        await fs.promises.rm(input);
        const blob = results['index.js'];
        if (!isESM) {
            return blob.toString() +
                `\n\nexport const {\n${exports.join(',\n')}\n} = __webpack_exports__;`
        }
        return blob;
    }
}

async function* getFiles(dir) {
    const files = await fs.promises.readdir(dir);
    for (let file of files) {
        file = path.join(dir, file);
        const stat = await fs.promises.stat(file);
        if (stat.isDirectory())
            yield* getFiles(file);
        else
            yield file;
    }
}

export class FarmDependencyBuilder {
    outFile = '/tmp/rspack/main.mjs';

    constructor(dependencies, basePath, mode) {
        this.mode = mode;
        this.basePath = basePath;
        this.dependencies = dependencies;
        this.externals = dependencies.map(d =>
            [d, `${basePath}/${d}`]
        );
    }

    async build(target, isESM) {
        const {createCompiler, resolveConfig, logger, Compiler} = await import('@farmfe/core');
        const id = crc32(JSON.stringify({target, date: new Date()}));
        const file = `./${id}.js`;
        await fs.promises.writeFile(file, `export * from "${target}";`, {encoding: "utf-8"});
        // const {wasm} = await import("@farmfe/plugin-wasm");
        const config = await resolveConfig({
            compilation: {
                external: [{
                    'react$': 'ReactJS'
                }],
                resolve: {
                    alias: {
                        'react$': '/_/@id/react'
                    },

                },
                input: {index: file},
                output: {
                    format: 'esm',
                    targetEnv: 'browser-es2017',
                },
                custom: {},
                externalNodeBuiltins: false,
                lazyCompilation: false,
                persistentCache: false,
                minify: false,
                treeShaking: true,
                partialBundling: {
                    enforceResources: [
                        {
                            name: "index",
                            test: [".*"],
                        },
                    ],
                },
                sourcemap: false,
                mode: 'production',
                define: {}
            },
            clearScreen: false,
            server: false,
        }, 'production');
        const {jsPlugins, rustPlugins, compilation: compilationConfig} = config;
        config.server = undefined;
        const compiler = new Compiler({
            config: compilationConfig,
            jsPlugins,
            rustPlugins,
        }, logger);
        console.log(rustPlugins.map(x => x[0]))
        for (const plugin of jsPlugins) {
            await plugin.configureCompiler?.(compiler);
        }
        await compiler.compile();
        const resources = compiler.resources();
        console.log(resources);
        await fs.promises.rm(file);
        return new Blob(Object.values(resources)).text();
    }
}

export const DependencyBuilder = EsBuildDependencyBuilder;


new DependencyBuilder(['multiformats'], '/@id', 'development')
    .build('multiformats/basics', false)
    .then(async b => console.log(b['/index.js']))
    .catch(err => console.error(err));
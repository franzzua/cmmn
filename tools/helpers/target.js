import {getDependencyOrder} from "./getProjects.js";
import path from "path";
import fs from "node:fs";
import {getTSConfig} from "./getTSConfig.js";
import {resolve} from "node:path";
import {build, createBuilder, mergeConfig} from "vite";
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';
import {builtinModules as builtin} from "module";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import {createVitePlugin} from "unplugin";
import {fileURLToPath} from "node:url";

const swcConfig = JSON.parse(await fs.promises.readFile(import.meta.dirname + "/.swcrc", {
    encoding: 'utf-8'
}));

export class Target extends EventTarget {
    /** @type {string} **/
    rootDir;
    /** @type {import("./flags.js").Flags} **/
    flags;
    /** @type {Target[]} **/
    deps;
    /** @type {Map<string, Target>} **/
    depsMap;

    constructor(rootDir, flags, deps) {
        super();
        this.rootDir = rootDir;
        this.flags = flags;
        this.deps = deps;
        this.depsMap = new Map(deps.map(x => [x.packageJson.name, x]));
    }

    /**
     * @param rootDir
     * @param flags
     * @returns {Promise<Target[]>}
     */
    static async readTargets(rootDir, flags) {
        if (flags.workspace) {
            return [new Target(resolve(rootDir, flags.workspace), flags, [])];
        }
        const result = new Map();
        for await (let project of getDependencyOrder(rootDir)) {
            const depProjects = project.deps.map(x => result.get(x));
            result.set(project.root, new Target(project.root, flags, depProjects));
        }
        return Array.from(result.values());
    }

    /**
     * @returns {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles}
     */
    get packageJson() {
        const pkgPath = path.join(this.rootDir, 'package.json');
        return this._packageJson ??= JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    }

    get externalDependencies(){
        return [
            ...Object.keys(this.packageJson.dependencies ?? {}),
            ...Object.keys(!this.flags.production ? this.packageJson.devDependencies ?? {} : {}),
        ]
    }

    /**
     * @returns {{ compilerOptions: import("typescript").CompilerOptions}}
     */
    get tsConfig() {
        return this._tsConfig ??= getTSConfig(this.rootDir);
    }

    /**
     * @returns {import('@swc/types').Config}
     */
    get swcConfig() {
        const tsConfig = this.tsConfig;
        return this._swcConfig ??= {
            ...swcConfig,
            jsc: {
                ...swcConfig.jsc,
                baseUrl: this.rootDir,
                paths: tsConfig.compilerOptions?.paths,
                minify: this.flags.minify ? {
                    compress: {
                        booleans_as_integers: true,
                        ecma: 2020
                    },
                    mangle: {
                        topLevel: true
                    },
                    ecma: '2020',
                    format: {
                        comments: false,
                        asciiOnly: true
                    }
                } : undefined
            },
            "sourceMaps": true,
            "inlineSourcesContent": false
        };
    }

    /** @returns {import('webpack-dev-server').RspackOptions["entry"]} **/
    get entries() {
        const outputPath = path.join(this.rootDir, 'dist/bundle');
        if (this.packageJson.exports) {
            const result = {};
            for (let item in this.packageJson.exports) {
                const importFile = this.packageJson.exports[item].require ??
                    this.packageJson.exports[item].default ?? this.packageJson.exports[item];
                if (!importFile || !(typeof importFile === "string")) continue;
                if (importFile.endsWith('.html')) continue;
                const file = path.join(
                    this.rootDir,
                    importFile
                );
                // console.log(file)
                const exportFile = path.relative(
                    outputPath,
                    path.join(this.rootDir, importFile),
                );
                // console.log(exportFile);
                result['index'] = file;
            }
            return result;
        }
        const entry = path.join(this.rootDir, this.packageJson.module ?? "index.ts");
        return {
            index: entry
        }
    }

    get logger() {
        return {
            log: (...args) => console.log(this.packageJson.name, ...args)
        };
    }

    /** @returns {import('vite').InlineConfig} **/
    async getConfig() {
        return {
            envFile: false,
            root: this.rootDir,
            logLevel: 'silent',
            mode: 'production',
            optimizeDeps:{
            },
            keepProcessEnv: true,
            define: {
                process: {
                    env: {
                        NODE_ENV: `"${this.flags.production ? 'production' : 'development'}"`
                    }
                }
            },
            html: false,
            esbuild: false,
            build: {
                target: 'chrome89',
                emptyOutDir: false,
                watch: this.flags.watch,
                rollupOptions: {
                    // input: this.entries,
                    // output: {
                    //     dir: path.join(this.rootDir, 'dist/bundle'),
                    //     entryFileNames: `[name].${this.minify ? 'min.' : ''}js`,
                    //     chunkFileNames: `assets/[name].${this.minify ? 'min.' : ''}js`,
                    //     assetFileNames: `assets/[name].[ext]`,
                    //     esModule: true,
                    //     exports: "named",
                    //     format: 'esm',
                    //     generatedCode: 'es2015',
                    //     strict: true
                    // },
                    treeshake: this.flags.production ? 'recommended' : false,
                    external: [
                        ...this.externalDependencies.map(x => `${x}*`),
                        ...builtin,
                        ...builtin.map((x) => `node:${x}`),
                        'fsevents',
                    ],
                },
                write: true,
                sourcemap: true,
                lib: {
                    entry: this.entries,
                    formats: ['es'],
                    fileName: (format, name) => `bundle/${name}.${this.flags.minify ? 'min.' : ''}js`
                },
                commonjsOptions: {
                    transformMixedEsModules: true
                },
            },
            plugins: [...this.getPlugins()],
        };
    }

    *getPlugins(){
        yield wasm();
        yield topLevelAwait();
        yield swc.vite(this.swcConfig);
        yield tsconfigPaths();
        yield createVitePlugin(() => ({
            name: this.packageJson.name + '_pre',
            ...this.hooks
        }))()
    }

    async getCompiler() {
        const config = await this.getConfig();
        return await createBuilder(config);
    }

    /**
     * @type {import('vite/dist/node/index.d.ts').ViteDevServer}
     */
    devServer;
    resolver;
    /** @type {import('unplugin').UnpluginOptions} **/
    hooks = {
        buildStart: (config) => {
            this.dispatchEvent(new Event('start'));
        },
        buildEnd: () => {
            this.dispatchEvent(new Event('end'));
        },
        writeBundle: (config, bundles) => {
            for (let name in bundles) {
                this.dispatchEvent(new BundleEvent(name, bundles[name]));
            }
        },
        // transform: (code) => {
        //     const loader = `${this.packageJson.name}_@vite/client_loaded`;
        //     return code + `
        //         if (!globalThis['${loader}']){
        //             globalThis['${loader}'] = true;
        //             import('@vite/client');
        //         }
        //     `;
        // },
        // load: (id, options) => {
        //     if (!id?.startsWith('/_/@id:')) return;
        //     const [pkg, version] = id.substring('/_/@id:'.length).split('@');
        //     const resolved = import.meta.resolve(pkg, this.rootDir);
        //     return `export * from "${pkg}"`;
        // },
        watchChange: (id, change) => {
            this.dispatchEvent(new ChangeEvent(id, change.event));
        },
        resolveId: (id, importer, options) => {
            return this.resolver?.(id, importer, options);
        },
        enforce: 'pre',
    }
}

class BundleEvent extends Event {
    bundleName;
    bundle;

    constructor(bundleName, bundle) {
        super('bundle');
        this.bundleName = bundleName;
        this.bundle = bundle;
    }
}

class ChangeEvent extends Event {
    file;
    change;

    constructor(id, type) {
        super('change');
        this.file = id;
        this.change = type;
    }
}
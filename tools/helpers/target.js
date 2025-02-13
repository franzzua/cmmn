import {getDependencyOrder} from "./getProjects.js";
import path from "path";
import fs from "node:fs";
import {getTSConfig} from "./getTSConfig.js";
import {resolve} from "node:path";
import {build, createBuilder, mergeConfig} from "vite";
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';
import {builtinModules as builtin} from "module";
import {createVitePlugin} from "unplugin";

const swcConfig = JSON.parse(fs.readFileSync(import.meta.dirname + "/.swcrc", "utf-8"));

export class Target extends EventTarget {
    /** @type {string} **/
    rootDir;
    /** @type {import("./flags.js").Flags} **/
    flags;
    /** @type {Target[]} **/
    deps;

    constructor(rootDir, flags, deps) {
        super();
        this.rootDir = rootDir;
        this.flags = flags;
        this.deps = deps;
    }

    /**
     * @param rootDir
     * @param flags
     * @returns {Promise<Target[]>}
     */
    static async readTargets(rootDir, flags) {
        if (flags.workspace) {
            return [new Target(resolve(rootDir, flags.workspace), flags)];
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
                } : false
            }
        };
    }

    /** @returns {import('webpack-dev-server').RspackOptions["entry"]} **/
    get entries() {
        if (this.packageJson.module) {
            const entry = path.join(this.rootDir, this.packageJson.module ?? "index.ts");
            return {
                index: entry
            }
        }
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
                result[exportFile] = file;
            }
            return result;
        }
        return { index: './index.ts' };
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
            mode: 'development',
            build: {
                emptyOutDir: false,
                watch: this.flags.watch,
                rollupOptions: {
                    input: this.entries,
                    output: {
                        dir: path.join(this.rootDir, 'dist/bundle'),
                        entryFileNames: `[name].${this.minify ? 'min.' : ''}js`,
                        chunkFileNames: `assets/[name].${this.minify ? 'min.' : ''}js`,
                        assetFileNames: `assets/[name].[ext]`,
                        esModule: true,
                        exports: "named",
                        format: 'esm',
                        generatedCode: 'es2015',
                        strict: true
                    },
                    external: [
                        ...Object.keys(this.packageJson.dependencies ?? {}),
                        ...builtin,
                        ...builtin.map((x) => `node:${x}`),
                        'fsevents',
                    ],
                },
                minify: false,
                sourcemap: true,
                lib: {
                    entry: this.entries,
                    formats: ['es'],
                }
            },
            plugins: [
                swc.vite({
                    ...this.swcConfig,
                }),
                tsconfigPaths({}),
                createVitePlugin(() =>({
                    name: this.packageJson.name + '_pre',
                    ...this.hooks
                }))(),
            ],
            builder: {},
        };
    }

    getCompiler() {
        return createBuilder(this.getConfig());
    }

    resolver;
    /** @type {import('unplugin').UnpluginOptions} **/
    hooks = {
        buildStart: (config) => {
            this.dispatchEvent(new Event('start'));
            // this.logger.log('start...')
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
        watchChange: (id, change) => {
            this.dispatchEvent(new ChangeEvent(id, change.event));
            this.logger.log(change.event, id);
        },
        vite: {
        },
        resolveId:(id, importer, options) => {
            return this.resolver?.(id);
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
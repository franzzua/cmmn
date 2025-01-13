import {getDependencyOrder} from "./getProjects.js";
import path from "path";
import fs from "node:fs";
import {getTSConfig} from "./getTSConfig.js";
import swc from "unplugin-swc";
import {bootstrapLogger, mergeObjects, resolveConfig} from "@farmfe/core";
import {resolve} from "node:path";

const swcConfig = JSON.parse(fs.readFileSync(import.meta.dirname + "/.swcrc", "utf-8"));

export class Target {
    /** @type {string} **/
    rootDir;
    /** @type {string[]} **/
    flags;
    /** @type {Target[]} **/
    deps;

    constructor(rootDir, flags, deps) {
        this.rootDir = rootDir;
        this.flags = flags;
        this.deps = deps;
    }

    get minify() {
        return this.flags.includes('--minify');
    }

    get run() {
        return this.flags.includes('--run');
    }

    /**
     * @param rootDir
     * @param flags
     * @returns {Promise<Target[]>}
     */
    static async readTargets(rootDir, flags) {
        if (flags.includes('-w')) {
            const dir = flags[flags.indexOf('-w') + 1];
            return [new Target(resolve(rootDir, dir), flags)];
        }
        if (!flags.includes('-b')) {
            return [new Target(rootDir, flags)]
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
                paths: tsConfig.compilerOptions?.paths
            }
        };
    }


    get logger() {
        return this._logger ??= bootstrapLogger({
            brandColor: 'red',
            name: this.packageJson.name,
        })
    }

    /**
     * @returns {Promise<import('@farmfe/core').Config['config']>}
     */
    async getCompilation() {
        const packageJson = await this.packageJson;
        const input = this.packageJson.module ?? "index.ts";
        return {
            persistentCache: false,
            input: {
                main: path.resolve(this.rootDir, input),
            },
            external: Object.keys(packageJson.dependencies ?? {}),
            watch: {},
            resolve: {
                symlinks: true
            },
            treeShaking: !this.run,
            clearScreen: false,
            output: {
                path: path.join(this.rootDir, "dist/bundle"),
                targetEnv: input.endsWith('.ts') ? 'browser' : "browser-esnext",
                publicPath: this.run ? '/_/' + this.packageJson.name + '/' : undefined,
                clean: true,
                format: 'esm',
                entryFilename: `[entryName]${this.minify ? '.min' : ''}.[ext]`,
                filename: `[resourceName]${this.minify ? '.min' : ''}.[ext]`,
                assetsFilename: `[resourceName]${this.minify ? '.min' : ''}.[ext]`,
            },
            html: {},
            // partialBundling: {
            //     enforceResources: [
            //         {
            //             name: 'node.bundle.js',
            //             test: ['.+']
            //         }
            //     ]
            // },
            root: this.rootDir,
            minify: this.minify ? {
                compress: true,
            } : false,
        }
    }

    /**
     * @returns {Promise<import('@farmfe/core').ResolvedUserConfig>}
     */
    async getViteConfig() {
        const override = await import(path.join(this.rootDir, "vite.config.js"))
            .then(m => m.default ?? {})
            .catch(() => ({}));
        const mode = this.run ? 'development' : 'production';
        return resolveConfig(mergeObjects({
            root: this.rootDir,
            plugins: [
                swc.farm({
                    ...this.swcConfig,
                    env: null
                })
            ],
            server: this.run ? {} : undefined,
            compilation: await this.getCompilation(),
            clearScreen: false,
            logger: this.logger,
        }, override), mode, this.logger);
    }

}
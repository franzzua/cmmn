import {getDependencyOrder} from "./getProjects.js";
import path from "path";
import fs from "node:fs";
import {getTSConfig} from "./getTSConfig.js";
import swc from "unplugin-swc";
import {bootstrapLogger, mergeObjects, resolveConfig} from "@farmfe/core";

const swcConfig = JSON.parse(fs.readFileSync(import.meta.dirname + "/.swcrc", "utf-8"));

export class Target {
    constructor(rootDir, flags) {
        this.rootDir = rootDir;
        this.flags = flags;
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
        if (!flags.includes('-b')) {
            return [new Target(rootDir, flags)]
        }
        const result = [];
        for await (let project of getDependencyOrder(rootDir)) {
            result.push(new Target(project, flags));
        }
        return result;
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
        return {
            persistentCache: false,
            input: {
                main: path.resolve(this.rootDir, "index.ts"),
            },
            external: Object.keys(packageJson.dependencies ?? {}),
            treeShaking: true,
            clearScreen: false,
            output: {
                path: path.join(this.rootDir, "dist/bundle"),
                targetEnv: 'library-node',
                clean: true,
                // format: 'esm',
                entryFilename: `[entryName]${this.minify ? '.min' : ''}.[ext]`,
                filename: `[resourceName]${this.minify ? '.min' : ''}.[ext]`,
                assetsFilename: `[resourceName]${this.minify ? '.min' : ''}.[ext]`,
            },
            root: this.rootDir,
            minify: this.minify ? {
                compress: true,
            } : false,
        }
    }

    /**
     * @param mode {'development' | 'production'}
     * @returns {Promise<ResolvedUserConfig>}
     */
    async getViteConfig() {
        const override = await import(path.join(this.rootDir, "vite.config.js"))
            .then(m => m.default ?? {})
            .catch(() => ({}));
        const mode = this.flags.includes('--run') ? 'development' : 'production';
        return resolveConfig(mergeObjects({
            root: this.rootDir,
            plugins: [
                swc.farm({
                    ...this.swcConfig,
                    env: null
                })
            ],
            server: this.run ? {
                port: 9123
            } : undefined,
            compilation: await this.getCompilation(),
            clearScreen: false,
            logger: this.logger,
        }, override), mode, this.logger);
    }

    /**
     *
     * @returns {{
     *  input: import('rolldown').InputOptions;
     *  output: import('rolldown').OutputOptions;
     * }}
     */
    async getRolldownConfig() {
        return {
            input: {},
            output: {
                path: path.join(this.rootDir, "dist/dev"),

            }
        };
    }
}
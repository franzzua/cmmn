import {getDependencyOrder} from "./getProjects.js";
import path from "path";
import fs from "node:fs";
import {getTSConfig} from "./getTSConfig.js";
import swc from "unplugin-swc";
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

    /**
     * @returns {Promise<import('@rsbuild/core').RsbuildConfig>}
     */
    async getConfig() {
        const override = await import(path.join(this.rootDir, "vite.config.js"))
            .then(m => m.default ?? {})
            .catch(() => ({}));
        const mode = this.run ? 'development' : 'production';
        const entry = path.join(this.rootDir, this.packageJson.module ?? "index.ts");
        return {
            root: this.rootDir,
            mode,
            source: {
                entry: {
                    index: {
                        import: entry,
                        html: false
                    }
                },
                decorators: {
                    version: '2022-03'
                },
                exclude: ['dist', 'node_modules', '.git']
            },
            output: {
                distPath: {
                    root: 'dist/bundle'
                },
                target: "node",
                polyfill: "off",
                minify: this.minify,
            },
            tools: {
                rspack: {
                    plugins: [
                        swc.rspack({
                            ...this.swcConfig,
                            env: null
                        })
                    ],
                }
            },
            dev: {}
        };
    }

}
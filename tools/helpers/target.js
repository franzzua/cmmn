import {getDependencyOrder} from "./getProjects.js";
import path from "path";
import fs from "node:fs";
import {getTSConfig} from "./getTSConfig.js";
import {resolve} from "node:path";
import {rspack} from "@rspack/core";

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
                paths: tsConfig.compilerOptions?.paths
            }
        };
    }

    /** @returns {import('@rspack/core').RspackOptions["resolve"]} **/
    get resolve() {
        return {
            extensions: ['...', '.tsx', '.ts', '.jsx'],
            tsConfig: {
                configFile: path.join(this.rootDir, 'tsconfig.json')
            }
        }
    }

    /** @returns {import('@rspack/core').RspackOptions["module"]} **/
    get module() {
        return {
            rules: [
                '...',
                {
                    test: /\.ts$/,
                    exclude: [/node_modules/],
                    loader: 'builtin:swc-loader',
                    options: this.swcConfig,
                    type: 'javascript/auto',
                },
                {
                    test: /\.html$/,
                    type: "asset/resource",
                    // generator: {
                    //     filename: "[name][ext]",
                    // },
                },
                // {
                //     test: /\.html$/i,
                //     use: ["html-loader"],
                // },
            ],
        }
    }

    /** @returns {import('@rspack/core').RspackOptions["optimization"]} **/
    get optimization() {
        return {
            concatenateModules: true,
            mergeDuplicateChunks: true,
            nodeEnv: false,
            minimize: this.minify
        };
    }

    /** @returns {import('@rspack/core').RspackOptions["output"]} **/
    get output() {
        return {
            path: path.join(this.rootDir, 'dist/bundle'),
            filename: '[name]',
            module: true,
            chunkFormat: 'module',
            library: {
                type: 'modern-module'
            },
            chunkLoading: 'import',
            workerChunkLoading: 'import',
            wasmLoading: 'fetch',
        };
    }
    /** @returns {import('webpack-dev-server').RspackOptions["devServer"]} **/
    get devServer(){
        return  {

        }
    }

    /** @returns {import('webpack-dev-server').RspackOptions["entry"]} **/
    get entries(){
        if (this.packageJson.module) {
            const entry = path.join(this.rootDir, this.packageJson.module ?? "index.ts");
            return {
                index: entry
            }
        }
        if (this.packageJson.exports){
            const result = {};
            for (let item in this.packageJson.exports) {
                if (!this.packageJson.exports[item].require ||
                    !this.packageJson.exports[item].default) continue;
                const importFile = this.packageJson.exports[item].require;
                if (importFile.endsWith('.html')) continue;
                const file = path.join(
                    this.rootDir,
                    importFile
                );
                console.log(file)
                const exportFile = path.relative(
                    this.output.path,
                    path.join(this.rootDir, this.packageJson.exports[item].default),
                );
                console.log(exportFile);
                result[exportFile] = file;
            }
            return result;
        }
    }

    get htmlTemplate(){
        if (this.packageJson.exports) {
            for (let item in this.packageJson.exports) {
                if (!this.packageJson.exports[item].require ||
                    !this.packageJson.exports[item].default) continue;
                const importFile = this.packageJson.exports[item].require;
                if (!importFile.endsWith('.html')) continue;
                const exportFile = path.relative(
                    this.output.path,
                    path.join(this.rootDir, this.packageJson.exports[item].default),
                );
                return {
                    template: importFile,
                    output: exportFile,
                }
            }
        }
    }

    *getPlugins(){
        yield new rspack.ProgressPlugin({
            prefix: this.packageJson.name,
        });
        if (this.htmlTemplate){
            yield new rspack.HtmlRspackPlugin({
                filename: this.htmlTemplate.output,
                template: this.htmlTemplate.template,
                inject: false
            });
        }
    }

    /**
     * @returns {Promise<import('@rspack/core').RspackOptions>}
     */
    async getConfig() {
        const mode = this.run ? 'development' : 'production';
        return {
            context: this.rootDir,
            mode,
            name: this.packageJson.name,
            entry: this.entries,
            externals: Object.keys(this.packageJson.dependencies ?? {}),
            externalsType: 'module',
            resolve: this.resolve,
            module: this.module,
            optimization: this.optimization,
            output: this.output,
            plugins: [...this.getPlugins()],
            devServer: {
                client: {
                    overlay: {
                        errors: true,
                        warnings: false
                    },
                },
                hot: true,
                host: '0.0.0.0',
                port: 9126
            },
        }
    };

    async getCompiler() {
        return rspack(await this.getConfig());
    }

}

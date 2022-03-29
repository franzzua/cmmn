import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import {terser} from "rollup-plugin-terser"
import {visualizer} from 'rollup-plugin-visualizer';
import styles from "rollup-plugin-styles";
import {string} from "rollup-plugin-string";
import serve from 'rollup-plugin-serve';
import builtins from 'rollup-plugin-node-builtins';
import livereload from 'rollup-plugin-livereload';
import fs from "fs";
import path from "path";
import html from '@open-wc/rollup-plugin-html';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';

/**
 * @typedef {import(rollup).RollupOptions} RollupOptions
 * @typedef {import(rollup).OutputOptions} OutputOptions
 */

export class ConfigCreator {

    /**
     * @type {{
     *     minify: boolean,
     *     input: string,
     *     devServer: boolean,
     *     module: string,
     *     external: string[],
     *     stats: boolean,
     *     name: string,
     *     outDir: string,
     *     html: string,
     *     browser: boolean,
     *     dedupe: string[]
     * }}
     */
    options;

    /**
     * @type {string}
     */
    root = process.cwd();


    constructor(options) {
        this.options = {
            ...options
        };
    }

    setRootDir(rootDir) {
        this.root = rootDir;
    }

    get outDir() {
        return path.join(this.root, this.options.outDir);
    }

    getOutputFileName(module, minify) {
        switch (module) {
            case "cjs":
                return `[name]${minify ? '.min' : ''}.cjs`;
            case "es":
                return `[name]${minify ? '.min' : ''}.js`;
            default:
                return `[name]-${module}${minify ? '.min' : ''}.js`;
        }
    }

    /**
     *
     * @returns {OutputOptions}
     */
    get output() {
        // const output = `${this.options.name ?? 'index'}-${this.options.module}${this.options.minify ? '.min' : ''}.js`;
        return this.options.module.split(',').map(module => ({
            entryFileNames: this.getOutputFileName(module, this.options.minify),
            // file: output,
            dir: this.outDir,
            sourcemap: true,
            format: module,
            globals: Object.fromEntries(this.options.external.map(x => [x,x])),
            name: this.options.global ?? 'global',
        }));
    }

    get html() {
        return html({
            publicPath: '/',
            dir: this.outDir,
            template: () => fs.readFileSync(path.join(this.root, this.options.html), 'utf8')
        });
    }

    get devServer() {
        return serve({
            open: false,
            contentBase: [this.outDir, path.join(this.root, 'assets')],
            port: this.options.port ?? 3000,
            historyApiFallback: true
        });
    }

    get livereload() {
        return livereload({
            watch: [this.outDir, path.join(this.root, 'assets')],
            verbose: false, // Disable console output
            // other livereload options
            port: 12345,
            delay: 300,
        })
    }

    get visualizer() {
        return visualizer({
            open: true,
            sourcemap: true,
            template: 'treemap',
            brotliSize: true,

            filename: path.join(this.outDir, '/stats.html')
        })
    }

    get plugins() {
        const result = [
            nodeResolve({
                browser: this.options.browser,
                dedupe: this.options.dedupe || []
            }),
            commonjs({
                requireReturnsDefault: "namespace",
                dynamicRequireTargets: [
                    'node_modules/ulid/*.js'
                ]
            }),
            builtins(),
            styles({
                mode: "emit",
            }),
            string({
                include: /\.(html|svg|less|css)$/,
            }),
            json(),

        ];
        if (this.options.alias) {
            result.unshift(alias({
                entries: this.options.alias
            }));
            console.log(this.options.alias)
        }
        if (this.options.html || this.options.input.endsWith('.html')) {
            result.push(this.html);
        }
        if (this.options.minify) {
            result.push(terser({
                module: true,
                ecma: 2020,
                compress: true,
                keep_classnames: false,
                keep_fnames: false,
                mangle: true,
                output: {
                    comments: false
                }
            }));
        }
        if (this.options.devServer) {
            result.push(this.devServer, this.livereload);
        }
        if (this.options.stats) {
            result.push(this.visualizer);
        }
        return result;
    }

    /**
     * @returns {RollupOptions[]}
     */
    getConfig() {
        Object.assign(this.options, {
            module: this.options.module || 'es',
            external: this.options.external || [],
            name: this.options.name || 'index',
            outDir: this.options.outDir || 'dist'
        });
        if (this.options.external && typeof this.options.external === "string")
            this.options.external = [this.options.external]
        console.log(this.options);
        return [{
            input: {
                [this.options.name]: path.join(this.root, this.options.input)
            },
            output: this.output,
            external: (this.options.external || []).map(s => new RegExp(`^${s}$`)),
            onwarn(warning) {
                switch (warning.code){
                    case 'CIRCULAR_DEPENDENCY':
                        return;
                    case 'THIS_IS_UNDEFINED':
                        console.log(`${warning.message} at`);
                        console.log(`\t${warning.id}`);
                        break;
                    default:
                        console.warn(`\t(!) ${warning.message}`)
                }

            },
            plugins: this.plugins,
            treeshake: this.options.minify ? "smallest" : "recommended",
        }]
    }
}

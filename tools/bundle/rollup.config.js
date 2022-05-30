import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import image from "rollup-plugin-img";
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
import replace from '@rollup/plugin-replace';
import sourcemaps from 'rollup-plugin-sourcemaps';
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
     *     styles: 'modules' | null,
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
        if (options.rootDir)
            this.root = options.rootDir;
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
            globals: Array.isArray(this.options.external) ? Object.fromEntries(this.options.external.map(x => [x, x])) : this.options.external,
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
            port: this.options.port,
            historyApiFallback: true
        });
    }

    get livereload() {
        return livereload({
            watch: [this.outDir, path.join(this.root, 'assets'), this.options.html],
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
            replace({
                'process.env.NODE_ENV': JSON.stringify('development'),
                preventAssignment: true
            }),
            nodeResolve({
                browser: this.options.browser,
                dedupe: this.options.dedupe || []
            }),
            commonjs({
                requireReturnsDefault: "namespace"
            }),
            sourcemaps(),
            builtins(),
            /*this.options.styles === 'modules' ? postCSS({
                mode: [
                    "inject",
                    {container: "head", prepend: true, attributes: {id: "global"}},
                ],
                plugins: [
                    flexbugs,
                ],
                modules: {
                    root: ''
                },
                namedExports: false,
                autoModules: true,
            }) : */
            styles({
                mode: "emit"
            }),
            image({
                output: `/assets`, // default the root
                extensions: /\.(png|jpg|jpeg|gif)$/, // support png|jpg|jpeg|gif|svg, and it's alse the default value
                limit: 8192,  // default 8192(8k)
                exclude: 'node_modules/**'
            }),
            string({
                include: /\.(html|svg|less)$/,
                exclude: /\.module\.css/
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
        if (this.options.stats) {
            result.push(this.visualizer);
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
        if (this.options.devServer && this.options.port) {
            result.push(this.devServer, this.livereload);
        }
        return result;
    }

    getExternals() {
        if (!this.options.external)
            return [];
        if (Array.isArray(this.options.external))
            return this.options.external.map(s => new RegExp(s));
        return Object.keys(this.options.external).map(s => new RegExp(s));
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
        console.log(this.options.name, this.options);
        return [{
            input: {
                [this.options.name]: path.join(this.root, this.options.input)
            },
            output: this.output,
            external: this.getExternals(),
            onwarn(warning) {
                switch (warning.code) {
                    case 'CIRCULAR_DEPENDENCY':
                        return;
                    case 'THIS_IS_UNDEFINED':
                        console.log(`${warning.message} at`);
                        console.log(`\t${warning.id}`);
                        break;
                    case 'PLUGIN_WARNING':
                        console.log(`${warning.message} at`);
                        console.log(`\t${warning.id}`);
                        break;
                    default:
                        console.warn(`\t${warning.code}(!) ${warning.message}`)
                }

            },
            plugins: this.plugins,
            treeshake: this.options.minify ? "smallest" : "recommended",
        }]
    }
}

import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import {terser} from "rollup-plugin-terser"
import {visualizer} from 'rollup-plugin-visualizer';
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
import {Styles} from "./styles.js";

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
            module: 'es',
            external: [],
            name: 'index',
            outDir: 'dist/bundle',
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
            sourcemap: this.options.minify ? false : 'inline',
            format: module,
            globals: module === 'umd' ? (Array.isArray(this.options.external) ? Object.fromEntries(this.options.external.map(x => [x, x])) : this.options.external) : [],
            assetFileNames: "assets/[name][extname]",
            chunkFileNames: "chunks/[name].js",
            name: this.options.global ?? 'global',
            sourcemapPathTransform: sourceMap => {
                const p = path.relative(this.root, path.resolve(this.outDir, sourceMap));
                return path.join('/',this.options.package, p);
            }
        }));
    }

    get html() {
        return html({
            publicPath: '/',
            dir: this.outDir,
            inject: false,
            template: (x) => {
                const inject = Object.keys(x.bundle.bundle).map(key => {
                    if (key.endsWith('css'))
                        return `<link rel="stylesheet" href="/${key}" >`;
                    if (key.endsWith('js'))
                        return `<script type="module" defer src="/${key}"></script>`;
                });
                const importMaps = Object.fromEntries(Object.entries(this.options.external)
                    .map(([key,value]) => [key.replace('.*', '/'), `/external/${value}`]));
                const injectImportMaps = `<script type="importmap" >${JSON.stringify({
                    imports: importMaps
                })}</script>`;
                const html = fs.readFileSync(path.join(this.root, this.options.html), 'utf8')
                return html.replace('</head>', injectImportMaps + inject.join('\n') + '</head>');
            }
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
                'process.env.NODE_ENV': JSON.stringify(this.options.minify ? 'production' : 'development'),
                preventAssignment: true
            }),
            ...Styles(this.options),
            commonjs({
                requireReturnsDefault: "namespace",
                transformMixedEsModules: true,
                defaultIsModuleExports: true
            }),
            nodeResolve({
                browser: this.options.browser,
                dedupe: this.options.dedupe || []
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
            // styles({
            //     autoModules: true,
            // }),

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
        if (this.options.external && typeof this.options.external === "string")
            this.options.external = [this.options.external]
        console.log(this.options.name, this.options);
        return [{
            input: {
                [this.options.name]: path.join(this.root, this.options.input)
            },
            output: this.output,
            external: this.getExternals(),
            manualChunks: this.options.chunks,
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
            treeshake: this.options.minify ? "smallest" : "safest",
            watch: {
                buildDelay: 300,
                clearScreen: false,
                exclude: this.getExternals().concat(path.join(this.root, this.outDir)),
                // include: path.join(this.root, 'dist/esm')
            }
        }]
    }
}

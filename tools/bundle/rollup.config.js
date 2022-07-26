import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import {terser} from "rollup-plugin-terser"
import {visualizer} from 'rollup-plugin-visualizer';
import {string} from "rollup-plugin-string";
import serve from 'rollup-plugin-serve';
import builtins from 'rollup-plugin-node-builtins';
import livereload from 'rollup-plugin-livereload';
import copy from 'rollup-plugin-copy';
import fs from "fs";
import path, {join} from "path";
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
                return path.join('/', this.options.package, p);
            }
        }));
    }

    get html() {
        return html({
            publicPath: '/',
            dir: this.outDir,
            inject: false,
            template: (x) => {
                let inject = Object.keys(x.bundle.bundle).map(key => {
                    if (key.endsWith('css'))
                        return `<link rel="stylesheet" href="/${key}" >`;
                    if (key.endsWith('js'))
                        return `<script type="module" defer src="/${key}"></script>`;
                }).join('\n');
                if (!this.options.minify) {
                    const importMaps = Object.fromEntries(this.options.external
                        .map(key => key.replace('.*', '/'))
                        .map(key => [key, `/external/${this.options.alias?.[key] ?? key}`]));
                    inject = `<script type="importmap" >${JSON.stringify({
                        imports: importMaps
                    })}</script>` + inject;
                }
                const html = fs.readFileSync(path.join(this.root, this.options.html), 'utf8')
                return html.replace('</head>', inject + '</head>');
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
            ...Styles(this),
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
                entries: Object.entries(this.options.alias).map(([key, value]) => ({
                    find: key,
                    replacement: value
                }))
            }));
        }
        if (this.options.minify && this.options.mount){
            const toCopy = Object.entries(this.options.mount).map(([to, from]) => {
                return {src: from, dest: join(this.outDir, to)}
            });
            result.push(copy({
                targets: toCopy
            }));
        }
        if (this.options.html || this.options.input.endsWith('.html')) {
            result.push(this.html);
            result.push(watcher([path.join(this.root, this.options.html)]))
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
            external: (this.options.minify && this.options.browser) ? [] : this.getExternals(),
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
            }
        }]
    }
}

const watcher = (files) => ({
    buildStart() {
        for (const file of files) {
            this.addWatchFile(file);
        }
    },
});
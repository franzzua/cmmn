import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import {terser} from "rollup-plugin-terser"
import {visualizer} from 'rollup-plugin-visualizer';
import styles from "rollup-plugin-styles";
import builtins from "rollup-plugin-node-builtins";
import {string} from "rollup-plugin-string";
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import fs from "fs";
import path from "path";
import html  from '@open-wc/rollup-plugin-html';
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

    setRootDir(rootDir){
        this.root = rootDir;
    }

    get outDir(){
        return path.join(this.root, this.options.outDir);
    }

    /**
     *
     * @returns {OutputOptions}
     */
    get output() {
        // const output = `${this.options.name ?? 'index'}-${this.options.module}${this.options.minify ? '.min' : ''}.js`;
        return {
            entryFileNames: `[name]-${this.options.module}${this.options.minify ? '.min' : ''}.js`,
            // file: output,
            dir: this.outDir,
            sourcemap: !this.options.minify,
            format: this.options.module,
            name: 'global',
        };
    }

    get html(){
        return html({
            publicPath: '/',
            dir: this.outDir,
            template: () => fs.readFileSync(path.join(this.root, this.options.html), 'utf8')
        });
    }
    get devServer(){
        return serve({
            open: false,
            contentBase: [this.outDir, path.join(this.root, 'assets')],
            port: 3001,
            historyApiFallback: true
        });
    }

    get livereload(){
        return livereload({
            watch: [this.outDir, path.join(this.root, 'assets')],
            verbose: false, // Disable console output
            // other livereload options
            port: 12345,
            delay: 300,
        })
    }

    get visualizer(){
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
            builtins(),
            nodeResolve({
                browser: true,
                dedupe: this.options.dedupe || []
            }),
            commonjs({
                 requireReturnsDefault: "namespace",
            }),
            styles({
                mode: "emit",
            }),
            string({
                include: /\.(html|svg|less|css)$/,
            }),
        ];
        if (this.options.html || this.options.input.endsWith('.html')){
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
        if (this.options.stats){
            result.push(this.visualizer);
        }
        return result;
    }

    /**
     * @returns {RollupOptions[]}
     */
    getConfig() {
        Object.assign(this.options,{
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
                [this.options.name]: path.join(this.root,this.options.input)
            },
            output: this.output,
            external: (this.options.external || []).map(s => new RegExp(s)),
            onwarn(warning) {
                // Silence circular dependency warning for moment package
                if (
                    warning.code === 'CIRCULAR_DEPENDENCY'
                ) {
                    return
                }

                console.warn(`(!) ${warning.message}`)
            },
            plugins: this.plugins,
            treeshake: this.options.minify ? "smallest" : "recommended"
        }]
    }
}

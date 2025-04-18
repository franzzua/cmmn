import path, {join, resolve, dirname} from "node:path";
import fs from "node:fs/promises";
import {crc32} from "node:zlib";
import {htmlLoader} from "./html-loader.js";

export class Bundler {
    /** @type {import('./target.js').Target} **/
    target;
    /** @type {import('./flags.js').Flags} **/
    flags;
    /** @type {{ entry: string; output: string; data: Uint8Array; fileName; }[]} **/
    results = [];

    constructor(target, flags) {
        this.target = target;
        this.flags = flags;
    }

    async bundle() {
        await this.importHtml();
        const context = await this.getContext();
        const result = await context.rebuild().catch(err => {
            return {
                errors: err.errors,
                warnings: err.warnings
            }
        });
        await this.processResult(result);
        await context.dispose();
    }

    async importHtml(){
        for (let [entry, file] of Object.entries(this.target.entries)) {
            if (file.endsWith('.html')) {
                const html = await htmlLoader(file, this.target.rootDir);
                for (let imp of html.imports) {
                    if (Object.entries(this.target.entries).some(x => x[1] === imp.src))
                        continue;
                    const newEntry = entry + '/' + crc32(imp.src);
                    this.target.entries[newEntry] = imp.src;
                    const outFile = this.target.getExport(newEntry, imp.src);
                    imp.update('./' + outFile);
                }
                const output = this.target.getExport(entry, file);
                this.results.push({
                    entry,
                    fileName: output.split('/').pop(),
                    output: path.join(this.target.rootDir, 'dist/bundle', output),
                    get data() {
                        return html.result;
                    },
                })
                delete this.target.entries[entry];
            }
        }
    }


    async getContext() {
        const esbuild = await import('esbuild');
        return this.context = await esbuild.context({
            absWorkingDir: this.target.rootDir,
            platform: 'browser',
            external: [
                ...this.target.externalDependencies.map(x => `${x}*`),
                ...await import('builtin-modules').then(x => x.default),
                // '/_/@id*',
            ],
            logLevel: 'silent',
            outdir: './dist/bundle',
            supported: {
                'dynamic-import': true
            },
            loader: {
                '.svg': 'copy'
            },
            // alias: Object.fromEntries(this.target.externalDependencies.map(x => [`${x}`, `/_/@id/${x}`])),
            define: {
                "process.env.NODE_ENV": this.flags.production ? '"production"' : '"development"'
            },
            publicPath: './',
            entryPoints: this.target.entries,
            bundle: true,
            target: 'esnext',
            format: 'esm',
            treeShaking: true,
            minify: this.flags.minify,
            minifyIdentifiers: this.flags.minify,
            minifyWhitespace: this.flags.minify,
            minifySyntax: this.flags.minify,
            splitting: true,
            drop: ['debugger', 'console'],
            keepNames: !this.flags.minify,
            write: false,
            mainFields: ['browser', 'module', 'main'],
            sourcemap: this.flags.production ? false : "inline",
            plugins: [
                await import('esbuild-plugin-less').then(x => x.lessLoader()),
                await import('esbuild-plugin-wasm').then(x => x.wasmLoader({
                    mode: 'embedded'
                })),
            ],
            metafile: true,
        });
    }

    /**
     * @param result {import("esbuild").BuildResult}
     */
    async processResult(result) {
        if (!result) return;
        for (let error of result.errors) {
            this.target.log(`^RERROR: ^w${error.text} at ^W${error.location?.file}`)
        }
        for (let chunkName in result.metafile?.outputs ?? []) {
            const file = result.outputFiles.find(x => x.path === path.join(this.target.rootDir, chunkName));
            const meta = result.metafile.outputs[chunkName];
            const entryFile = resolve(this.target.rootDir, meta.entryPoint ?? Object.keys(meta.inputs)[0]);
            const entry = Object.entries(this.target.entries).find(([s, t]) => t === entryFile)?.[0];

            const fileName = this.target.exports[entry] ?? chunkName
                .replace(/\.[tj]s\.js$/, '.js')
                .replace(/(\.[^.]+)+$/, '$1')
                .replace('dist/bundle/', '');

            this.results.push({
                entry,
                data: file.contents,
                output: join(this.target.rootDir, 'dist/bundle', fileName),
                fileName
            })
        }
        this.results.push({
            data: JSON.stringify(result.metafile),
            output: join(this.target.rootDir, 'dist/bundle/meta.json'),
            fileName: 'meta.json'
        })
    }

    async write() {
        await fs.mkdir(path.join(this.target.rootDir, './dist/bundle'), {recursive: true});
        const fileDirs = new Set(this.results.map(f => dirname(f.output)));
        for (let fileDir of fileDirs) {
            await fs.mkdir(fileDir, { recursive: true });
        }
        await Promise.all(this.results.map(async f => fs.writeFile(f.output, f.data)));
    }

}
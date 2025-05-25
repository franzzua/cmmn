import path, {join, resolve, dirname} from "node:path";
import fs from "node:fs/promises";
import {crc32} from "node:zlib";
import {htmlLoader} from "./html-loader.js";
import {Flags} from "./flags";
import {Target, Entry} from "./target";
import {BuildContext} from "esbuild";

export class Bundler {
    results: Array<{
        entry: Entry,
        output: string;
        data: Uint8Array | string;
        fileName: string;
    }> = [];
    private context: BuildContext;

    constructor(private target: Target, private flags: Flags) {
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
        for (let entry of this.target.entries) {
            if (entry.isHTML) {
                const html = await htmlLoader(entry.source, this.target.rootDir);
                for (let imp of html.imports) {
                    if (this.target.entries.some(x => x.source === imp.src))
                        continue;
                    const newEntry = this.target.createEntry(entry.name + '/' + crc32(imp.src), imp.src)
                    this.target.entries.push(newEntry);
                    imp.update('./' + newEntry.output);
                }
                this.results.push({
                    entry,
                    fileName: entry.output.split('/').pop(),
                    output: path.join(this.target.rootDir, 'dist/bundle', entry.output),
                    get data() {
                        return html.result;
                    },
                })
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
            entryPoints: Object.fromEntries(this.target.entries.filter(entry => !entry.isExcluded).map(e => [e.name, e.source])),
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
            const entry = this.target.entries.find(x => x.source === entryFile);
            const fileName = entry?.output ?? chunkName
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
        if (this.flags.args.includes('--meta'))
            this.results.push({
                entry: null,
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
        await Promise.all(this.results.filter(f => f.data).map(async f => fs.writeFile(f.output, f.data)));
    }

}
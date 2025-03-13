import path from "node:path";
import fs from "node:fs/promises";

export class Bundler {
    /** @type {import('./target.js').Target} **/
    target;
    /** @type {import('./flags.js').Flags} **/
    flags;
    /** @type {{ entry: string; output: string; data: Uint8Array;}[]} **/
    results;

    constructor(target, flags) {
        this.target = target;
        this.flags = flags;
    }

    async bundle() {
        const context = await this.getContext();
        const result = await context.rebuild();
        await this.processResult(result);
        await context.dispose();
    }

    async getContext() {
        const esbuild = await import('esbuild');
        return await esbuild.context({
            absWorkingDir: this.target.rootDir,
            platform: 'neutral',
            external: ['/_/@id*'],//this.target.externalDependencies.map(x => `${x}/*`),
            outdir: './dist/bundle',
            supported: {
                'dynamic-import': true
            },
            alias: Object.fromEntries(this.target.externalDependencies.map(x => [`${x}`, `/_/@id/${x}`])),
            define: {
                process: JSON.stringify({
                    env: {
                        NODE_ENV: this.flags.production ? 'production' : 'development'
                    }
                })
            },
            publicPath: './',
            entryPoints: this.target.entries,
            bundle: true,
            target: 'esnext',
            format: 'esm',
            treeShaking: true,
            minify: this.flags.minify,
            write: false,
            sourcemap: "linked",
            plugins: [
                await import('esbuild-plugin-less').then(x => x.lessLoader()),
                await import('@chialab/esbuild-plugin-html').then(x => x.default({
                    injectStylesAs: 'link',
                }))
            ],
            metafile: true,
        });
    }

    /**
     * @param result {import("esbuild").BuildResult}
     */
    async processResult(result) {
        this.results = [];
        for (let chunkName in result.metafile.outputs) {
            const file = result.outputFiles.find(x => x.path === path.join(this.target.rootDir, chunkName));
            const meta = result.metafile.outputs[chunkName];
            const entryPoint = meta.entryPoint ?? Object.keys(meta.inputs)[0];
            const source = Object.entries(this.target.packageJson.exports ?? {}).find(([s, t]) => t === `./${entryPoint}`)

            const filename = chunkName
                .replace(/\.[tj]s\.js$/, '.js')
                .replace(/(\.[^.]+)+$/, '$1');

            this.results.push({
                entry: source?.[0],
                data: file.contents,
                output: filename
            })
        }
    }

    async write() {
        await fs.mkdir(path.join(this.target.rootDir, './dist/bundle'), {recursive: true});
        for (let result of this.results) {
            if (!result.entry) continue;
            this.target.packageJson.exports[result.entry] = result.output;
        }
        await Promise.all([
            ...this.results.map(f => fs.writeFile(path.join(this.target.rootDir, f.output), f.data)),
            fs.writeFile(path.join(this.target.rootDir, './dist/package.json'), JSON.stringify(this.target.packageJson))
        ]);
    }

}
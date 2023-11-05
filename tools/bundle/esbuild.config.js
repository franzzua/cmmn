import path from "node:path";
import fs from "node:fs";
import { lessLoader } from 'esbuild-plugin-less';
import {platform} from "os";

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
     *     platform: string,
     *     dedupe: string[],
     *     target: string
     *     inject: string
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
            platform: 'node,browser',
            ...options
        };
        if (options.rootDir)
            this.root = options.rootDir;
    }

    get outDir() {
        return path.join(this.root, this.options.outDir);
    }

    get importMaps(){
        return JSON.stringify({
            imports: Object.fromEntries(this.options.external
                .map(key => key.replace('*', '/'))
                .map(key => [key, `/external/${this.options.alias?.[key] ?? key}`]))
        })
    }
    getHtmlPlugin(){
        if (!this.options.html)
            return [];
        return [
            {
                name: 'esbuild-html-plugin',
                setup: (build) => { build.onEnd(async result => {
                    if (!result.metafile)
                        return;
                    const injectStyles = [];
                    const injectScripts = [
                        `<script type="importmap">${this.importMaps}</script>`
                    ];
                    for (let [key, value] of Object.entries(result.metafile.outputs)){
                        if (value.entryPoint !== this.options.input) continue;
                        const file = path.relative(this.outDir, path.join(this.root, key));
                        injectScripts.push(`<script type="module" src="/${file}"></script>`)
                        if (value.cssBundle) {
                            const file = path.relative(this.outDir, path.join(this.root, value.cssBundle));
                            injectStyles.push(`<link rel="stylesheet" href="/${file}"></link>`)
                        }
                        const html = await fs.promises.readFile(path.join(this.root, this.options.html));
                        await fs.promises.writeFile(
                            path.join(this.outDir, 'index.html'),
                            html.toString()
                                .replace('</head>', `${injectStyles.map(x => `\t${x}\n`).join('')}</head>`)
                                .replace('</body>', `${injectScripts.map(x => `\t${x}\n`).join('')}</body>`)
                        );
                    }
                }); }
            }
        ];

    }

    get platforms(){
        return this.options.platform.split(',');
    }
    get modules(){
        return this.options.module.split(',');
    }
    getOutExtension(format, platform){
        const ext = (this.options.minify ? '.min' : '') + {
            es: '.js',
            cjs: '.cjs'
        }[format];
        if (this.platforms.length == 1)
            return ext;
        return "."+platform+ext;
    }
    /**
     * @returns {RollupOptions[]}
     */
    getConfig() {
        if (this.options.external && typeof this.options.external === "string")
            this.options.external = [this.options.external]
        console.log(this.options.name, this.options);
        return this.modules.flatMap(format => this.platforms.map(platform => ({
            entryPoints: [
                { out: this.options.name, in: this.options.input }
            ],
            bundle: true,
            minify: this.options.minify,
            sourcemap: this.options.minify ? false : 'external',
            target: ['chrome88', 'safari14', 'firefox88'],
            outdir: 'dist/bundle',
            metafile: true,
            absWorkingDir: this.root,
            treeShaking: this.options.minify,
            format: ({
                es: 'esm'
            })[format] ?? format,
            outExtension: {
                '.js': this.getOutExtension(format, platform)
            },
            platform: platform,
            tsconfig: 'tsconfig.json',
            external: ["*.woff2", "*.woff", ...this.options.external],
            define: {
                'process.env.NODE_ENV': '"production"'
            },
            publicPath: '/',
            alias: this.options.alias,
            plugins: [
                lessLoader(),
                ...this.getHtmlPlugin(),
            ],
        })));
    }
}
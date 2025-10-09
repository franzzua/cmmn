import {TargetServer} from "./targetServer";
import {wasm} from "./plugins/wasm.js";
import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import {createVitePlugin} from "unplugin";
import path, {join, relative} from "node:path";
import {build, createServer, HtmlTagDescriptor, InlineConfig} from "vite";
import {ChangeEvent} from "../helpers/target";
import {FastifyReply, FastifyRequest} from "fastify";
import {RollupOutput} from "rollup";
import mime from "mime-types";
import {Asset, getAssets} from "./asset-collection";
import {readdir, readFile, stat} from "node:fs/promises";
import fs from "fs";
import {swcMinifyPlugin} from "./plugins/minify";

export class TargetWebServer extends TargetServer {

    async getConfig(): Promise<InlineConfig> {
        return {
            root: this.target.rootDir,
            logLevel: 'silent',
            mode: this.target.flags.production ? "production" : 'debug',
            optimizeDeps: {
                noDiscovery: true,
                include: []
            },
            keepProcessEnv: true,
            define: {
                process: {
                    env: {
                        NODE_ENV: this.target.flags.production ? 'production' : 'development'
                    }
                }
            },
            html: {},
            base: this.base + '/',
            build: {
                target: 'chrome89',
                emptyOutDir: false,
                rollupOptions: {
                    external: [
                        // ...this.target.externalDependencies.map(x =>
                        //     new RegExp(`^${x}`.replace('/', '\\/'))
                        // ),
                        // ...builtinModules,
                        'fsevents',
                        /@id/g,
                    ],
                },
                write: false,
                minify: false,
                sourcemap: this.target.flags.minify ? false : 'inline',
                commonjsOptions: {
                    transformMixedEsModules: true
                },
            },
            plugins: [...this.getPlugins()],

        };
    }

    async getBundleConfig(): Promise<InlineConfig>{
        const config = await this.getConfig();
        config.build.lib = {
            entry: Object.fromEntries(Object.entries(this.target.packageJson.exports as any ?? {
                '.': this.target.packageJson.module ?? this.target.packageJson.main ?? 'worker.ts'
            }).filter(x => x[1].match(/\.(tsx?|jsx?|html)$/))) as any,
            fileName: (format, entryName) => {
                if (entryName == '.') entryName = 'index';
                return `${entryName.replace(/^[./]*/, '')}.js`;
            },
            formats: ['es'],
        }
        config.build.outDir = './dist/bundle';
        config.build.emptyOutDir = true;
        config.build.modulePreload = false;
        return config;
    }

    * getPlugins() {
        yield wasm();
        // yield topLevelAwait({});
        yield swc.vite(this.target.swcConfig);
        yield tsconfigPaths();
        yield createVitePlugin(() => ({
            name: this.target.packageJson.name + '_pre',
            resolveId: (id: string, importer, opts) => {
                if(this.target.flags.production){
                    if(id.includes(this.target.packageJson.name)) {
                        return this.resolveId(id, importer, opts);
                    }

                    for (let external of this.target.externalDependencies) {
                        if (id == external || id.startsWith(external + '/') ||
                            id.includes(external)) {
                            return this.resolver?.resolveId(id, importer, opts);
                        }
                    }
                    if(id.includes('@swc/helpers'))
                        return this.resolver?.resolveId(id, importer, opts);
                    return null;
                }
                return this.resolver?.resolveId(id, importer, opts);
            },
            enforce: 'pre',
        }))();
        yield {
            name: "cmmn:html-base-tag",
            order: 'pre',
            transformIndexHtml: (_, config) => {
                const dirname = this.target.flags.production ? '' : config.path.substr(0, config.path.lastIndexOf('/'));
                const result: HtmlTagDescriptor[] = [
                    {
                        tag: "base",
                        attrs: {href: `${this.base}${dirname}/`},
                        children: '/** injected **/'
                    }
                ];
                if (this.target.flags.production){
                    result.push({
                        tag: "link",
                        attrs: {
                            rel: 'manifest',
                            href: this.base + '/manifest.json'
                        }
                    });
                }
                return result;
            },
        }
        if (this.target.flags.minify)
            yield swcMinifyPlugin();
        // yield analyzer();
    }

    private bundle: Promise<RollupOutput[]>;
    private async createBundle(): Promise<RollupOutput[]> {
        const config = await this.getBundleConfig();
        return build(config).catch(err => {
            this.target.error(err.message);
            return [];
        }) as Promise<RollupOutput[]>;
    }
    devServerRequest;
    handle(app, request: FastifyRequest, reply: FastifyReply) {
        (this.devServerRequest ??= this.getServer(app)).then(async s => {
            if (!this.target.flags.production) {
                s.middlewares(request.raw, reply.raw);
            } else {
                const relPath = path.relative(this.base, request.url).split('?')[0];
                const bundle = await this.getBundle();
                const mimeType = mime.lookup(relPath);
                if (relPath in bundle)
                    return reply.type(mimeType).send(bundle[relPath]);
                try {
                    const file = await readFile(path.join(this.target.rootDir, 'public', relPath))
                    return reply.type(mime.lookup(relPath)).send(file);
                } catch {
                    return reply.status(404).send('Not found');
                }
            }
        });
    }
    async getBundle(){
        const bundle = await (this.bundle ??= this.createBundle());
        const outputs = bundle.flatMap(x => x.output);
        const result: Record<string, string | Uint8Array> = {
            '@_/bundle.json': JSON.stringify(await this.getBundleJson()),
        };
        for (let output of outputs) {
            const entry = this.target.entries.find(x => x.relative == './'+output.fileName);
            result[entry?.output ?? output.fileName] =  output.type == "asset"
                ? output.source
                : output.code;
        }
        return result;
    }

    async getBundleJson(): Promise<BundleJson> {
        const bundle = await (this.bundle ??= this.createBundle());
        const outputs = bundle.flatMap(x => x.output);
        const data = {
            publicPath: this.target.publicPath,
            proxy: this.target.proxy.map(x => ({
                regex: x.regex.source,
                replace: this.target.getEntry("."+x.replace)?.output
            }))
        };
        const assets = await getAssets(bundle);
        for (let asset of assets) {
            const entry = this.target.entries.find(x => x.relative == './'+asset.path);
            if (entry){
                asset.path = entry.output;
            }
        }
        const publicDir = path.join(this.target.rootDir, 'public');
        for (let file of await readdir(publicDir, {
            recursive: true
        }).catch(() => [])){
            const info = await stat(path.join(publicDir, file));
            assets.push({
                path: file,
                hash: info.mtimeMs.toString(36),
                size: info.size
            });
        }
        const deps = [];
        for (let output of outputs) {
            if (output.type === "chunk"){
                const imports = [
                    ...output.imports,
                    ...output.dynamicImports
                ];
                for (let dependency of imports) {
                    if (!dependency.startsWith(`${this.url}/${this.prefix}/`)) continue;
                    const path = dependency.replace(`${this.url}/${this.prefix}/`, '');
                    if (path.startsWith('@id')){
                        // let dep = path.replace('@id/','');
                        // dep = dep.split('/').slice(0, dep.startsWith('@') ? 2 : 1).join('/')
                        deps.push({
                            baseURI: `${this.url}/_/${path}/`,
                            path: ''
                        })
                    } else {
                        for (let dep of this.target.externalDependencies) {
                            if (!path.startsWith(dep)) continue;
                            deps.push({
                                baseURI: `${this.url}/_/${dep}/`,
                                path: path.substring(dep.length + 1)
                            })
                        }
                    }
                }
            }
        }
        return {
            ...data,
            assets,
            deps
        };
    }

    async getServer(app) {
        const config = await this.getConfig();
        const server = await createServer({
            ...config as any,
            server: {
                hmr: this.target.flags.production ? false : {
                    server: app.server,
                    path: this.wsPrefix,
                },
                ws: this.target.flags.production ? false : undefined,
                // origin: 'http://127.0.0.1:9000',
                fs: {
                    strict: false
                },
                headers: {
                    'Service-Worker-Allowed': '/'

                    // 'access-control-allow-origin': '*'
                },
                allowedHosts: [
                    this.target.https?.host,
                    ...this.target.reactions.map(x => x.https?.host)
                ].filter(x => x)
            },
        });
        this.target.log(`Start dev server`);
        this.enhanceWebSocket(server);
        return server;
    }

    /**
     * Emit event on ws and proxies events from dependent dev-servers
     */
    enhanceWebSocket(server) {
        const emitChange = server.ws.send;
        server.ws.send = payload => {
            // if (this.target.isExcluded("")) return;
            this.target.log('change')
            this.target.dispatchEvent(new ChangeEvent(payload, this.target.packageJson.name));
        };
        this.target.addEventListener('change', e => {
            this.target.log('change')
            emitChange.call(server.ws, e.payload);
        });
    }


    resolveByReferrer(req, file) {
        if (!req) return;
        if (!req.headers.referer) return;
        const referrerPath = new URL(req.headers.referer).pathname;
        if (!referrerPath.startsWith(this.base)) return;
        const referrer = this.resolvePath(referrerPath.substring(this.base.length), null);
        if (!referrer) return;
        const absolute = join(referrer, '..' + file);
        if (fs.existsSync(absolute)) {
            return absolute;
        }
    }

    resolvePath(file, req) {
        if (file === '/') file = '';
        const entry = this.target.entries.find(x => x.name === '.' + file);
        if (entry){
            const path = this.target.flags.production ? entry.output : entry.relative.substring(2);
            return '/' + path;
        }
        return this.resolveByReferrer(req, file);
    }

}

export type BundleJson = {
    assets: Asset[];
    deps: {
        baseURI: string;
        path: string;
    }[]
    publicPath?: string;
    proxy?: Record<string, string>;
}
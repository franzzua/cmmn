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
import {getAssets} from "./asset-collection";
import {readdir, readFile, stat} from "node:fs/promises";
import fs from "fs";

export class TargetWebServer extends TargetServer {

    async getConfig(): Promise<InlineConfig> {
        return {
            root: this.target.rootDir,
            logLevel: 'silent',
            mode: 'debug',
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
            esbuild: false,
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
                minify: this.target.flags.minify ? 'terser' : false,
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
                const result: HtmlTagDescriptor[] = [
                    {
                        tag: "base",
                        attrs: {href: `${this.base}/`},
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
                const bundle = await (this.bundle ??= this.createBundle());
                const outputs = bundle.flatMap(x => x.output);
                if (relPath == 'bundle.json'){
                    const data = {
                        publicPath: this.target.publicPath,
                        proxy: this.target.proxy.map(x => ({
                            regex: x.regex.source,
                            replace: this.target.getEntry("."+x.replace)?.output
                        }))
                    };
                    const assets = await getAssets(bundle);
                    for (let asset of assets) {
                        asset.path = `${this.base}/${asset.path}`;
                    }
                    const publicDir = path.join(this.target.rootDir, 'public');
                    for (let file of await readdir(publicDir, {
                        recursive: true
                    }).catch(() => [])){
                        const info = await stat(path.join(publicDir, file));
                        assets.push({
                            path: `${this.base}/${file}`,
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
                                    deps.push({
                                        baseURI: this.url + '/_/@id/',
                                        path
                                    })
                                } else {
                                    for (let dep of this.target.externalDependencies) {
                                        if (!path.startsWith(dep)) continue;
                                        deps.push({
                                            baseURI: this.url + `/_/${dep}/`,
                                            path
                                        })
                                    }
                                }
                            }
                        }
                    }
                    return reply.type('application/json').send(JSON.stringify({
                        ...data,
                        assets,
                        deps
                    }));
                }
                const output = outputs.find(o => o.fileName == relPath)
                    ?? outputs.find(o => o.type == "chunk" && o.facadeModuleId == path.join(this.target.rootDir, relPath))
                if (!output) {
                    try {
                        const file = await readFile(path.join(this.target.rootDir, 'public', relPath))
                        return reply.type(mime.lookup(relPath)).send(file);
                    } catch {
                        return reply.status(404).send('Not found');
                    }
                }
                const mimeType = mime.lookup(output.fileName);
                const result = output.type == "asset"
                    ? output.source
                    : output.code;
                reply.type(mimeType).send(result);
            }
        });
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
        const resolved = this.target.entries.find(x => x.name === '.' + file)?.source ?? this.resolveByReferrer(req, file);
        if (resolved)
            return '/' + relative(this.target.rootDir, resolved);
    }

}
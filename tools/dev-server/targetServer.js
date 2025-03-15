import {createServer} from "vite";
import {join, relative} from "node:path";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import {createVitePlugin} from "unplugin";
import {ChangeEvent} from "../helpers/target.js";
import fs from "node:fs";

export class TargetServer {
    /**
     * @type {import("../helpers/target.js").Target}
     */
    target;
    prefix;
    /**
     * @type {import("./resolver.js").Resolver}
     */
    resolver;

    /**
     * @param target {import("../helpers/target.js").Target}
     * @param prefix {string}
     * @param resolver {import("./resolver.js").Resolver}
     */
    constructor(target, prefix, resolver) {
        this.target = target;
        this.prefix = prefix;
        this.resolver = resolver;
        this.base = `/${this.prefix}/${this.target.packageJson.name}`;
    }


    /** @returns {import('vite').InlineConfig} **/
    async getConfig() {
        return {
            root: this.target.rootDir,
            logLevel: 'silent',
            mode: 'production',
            optimizeDeps:{
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
            html: {
                base: this.base + '/',
            },
            base: this.base + '/',
            esbuild: false,
            build: {
                target: 'chrome89',
                emptyOutDir: false,
                rollupOptions: {
                    external: [
                        ...this.target.externalDependencies.map(x =>
                            new RegExp(`^${x}`.replace('/', '\\/'))
                        ),
                        // ...builtinModules,
                        'fsevents',
                        /@id/g,
                    ],
                },
                write: false,
                minify: this.target.flags.minify ? 'terser' : false,
                sourcemap: !this.target.flags.minify,
                commonjsOptions: {
                    transformMixedEsModules: true
                },
            },
            plugins: [...this.getPlugins()],

        };
    }

    *getPlugins(){
        yield wasm();
        yield topLevelAwait();
        yield swc.vite(this.target.swcConfig);
        yield tsconfigPaths();
        yield createVitePlugin(() => ({
            name: this.target.packageJson.name + '_pre',
            resolveId: this.resolver.resolveId,
            watchChange: (id, change) => {
                this.target.log(`change ^W${relative(this.target.rootDir, id)}`)
            },
            enforce: 'pre',
        }))();
        yield {
            name: "cmmn:html-base-tag",
            apply: "serve",
            transformIndexHtml: (_, config) => {
                const dirname = config.path.substr(0, config.path.lastIndexOf('/'));
                return [
                    {
                        tag: "base",
                        attrs: {href: `${this.base}${dirname}/`},
                        children: '/** injected **/'
                    }
                ];
            },
        }
    }
    /**
     * @param id {string}
     * @returns {*}
     */
    resolveId = id => {
        return id.startsWith(this.target.packageJson.name)
            && `/${this.prefix}/${id}`
    }

    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        app.get(`${this.base}*`, (request, reply, next) => {
            this.getServer(app).then(s => s.middlewares(request.raw, reply.raw));
        })
    }

    async getServer(app){
        if (this.devServer) return this.devServer;
        const config = await this.getConfig();
        this.devServer = await createServer({
            ...config,
            server: {
                hmr: {
                    server: app.server,
                },
                fs: {
                    strict: false
                }
            },
        });
        this.target.log(`Start dev server`);
        this.enhanceWebSocket();
        return this.devServer;
    }

    /**
     * Emit event on ws and proxies events from dependent dev-servers
     */
    enhanceWebSocket(){
        const emitChange = this.devServer.ws.send;
        this.devServer.ws.send = payload => {
            this.target.dispatchEvent(new ChangeEvent(payload));
            emitChange(payload);
        }
        for (let dep of this.target.deps) {
            dep.addEventListener('change', e => {
                emitChange.call(this.devServer.ws, e.payload);
            });
        }
    }

    /**
     * Rewrite request url before it processed
     * @param path {string}
     * @param req {import("fastify/types/request.js").FastifyRequest}
     * @returns {string}
     */
    rewritePath(path, req) {
        if (!path.startsWith(this.base))
            return path;
        let file = path.substring(this.base.length);
        if (file.startsWith(`/${this.prefix}`)) {
            return file;
        }
        const resolved = this.resolvePath(file) ?? this.resolveByReferrer(req, file);
        if (resolved)
            return join(`${this.base}/`, relative(this.target.rootDir, resolved));
        return path;
    }

    resolveByReferrer(req, file){
        if (!req.headers.referer) return;
        const referrerPath = new URL(req.headers.referer).pathname;
        if (!referrerPath.startsWith(this.base)) return;
        const referrer = this.resolvePath(referrerPath.substring(this.base.length));
        if (!referrer) return;
        const absolute = join(referrer, '..' + file);
        if (fs.existsSync(absolute)) {
            return absolute;
        }
    }

    resolvePath(file){
        if (file === '/') file = '';
        return this.target.entries["." + file];
    }
}
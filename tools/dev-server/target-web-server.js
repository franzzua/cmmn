import {TargetServer} from "./targetServer.js";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import {createVitePlugin} from "unplugin";
import {join, relative} from "node:path";
import {createServer} from "vite";
import {ChangeEvent} from "../helpers/target.ts";
import fs from "node:fs";

export class TargetWebServer extends TargetServer {


    /** @returns {import('vite').InlineConfig} **/
    async getConfig() {
        return {
            root: this.target.rootDir,
            logLevel: 'silent',
            mode: 'production',
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
                sourcemap: this.target.flags.minify ? false : 'inline',
                commonjsOptions: {
                    transformMixedEsModules: true
                },
            },
            plugins: [...this.getPlugins()],

        };
    }

    * getPlugins() {
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

    handle(app, request, reply) {
        this.getServer(app).then(s => s.middlewares(request.raw, reply.raw));
    }

    async getServer(app) {
        if (this.devServer) return this.devServer;
        const config = await this.getConfig();
        this.devServer = await createServer({
            ...config,
            server: {
                hmr: this.target.flags.production ? false : {
                    server: app.server,
                    clientPort: 9000,
                    host: '127.0.0.1',
                    protocol: 'ws',
                    path: '/@ws'
                },
                ws: this.target.flags.production ? false : undefined,
                origin: 'http://127.0.0.1:9000',
                fs: {
                    strict: false
                },
                headers: {
                    'access-control-allow-origin': '*'
                },
                allowedHosts: [
                    this.target.https?.host,
                    ...this.target.reactions.map(x => x.https?.host)
                ].filter(x => x)
            },
        });
        this.target.log(`Start dev server`);
        // this.enhanceWebSocket();
        return this.devServer;
    }

    /**
     * Emit event on ws and proxies events from dependent dev-servers
     */
    enhanceWebSocket() {
        const emitChange = this.devServer.ws.send;
        this.devServer.ws.send = payload => {
            this.target.log('change')
            this.target.dispatchEvent(new ChangeEvent(payload, this.target.packageJson.name));
        };
        this.target.addEventListener('change', e => {
            this.target.log('change')
            emitChange.call(this.devServer.ws, e.payload);
        });
    }


    resolveByReferrer(req, file) {
        if (!req) return;
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

    resolvePath(file, req) {
        if (file === '/') file = '';
        const resolved = this.target.entries["." + file] ?? this.resolveByReferrer(req, file);
        if (resolved)
            return '/' + relative(this.target.rootDir, resolved);
    }

}
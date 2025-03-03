import {Target} from "../helpers/target.js";
import {fastify} from "fastify";
import {createServer} from "vite";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const prefix = '_';

export async function dev(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const resolver = (id) => {
        // const target = targets.find(x => id.startsWith(x.packageJson.name));
        // if (target)
        //     return `/${prefix}/${id}`;
    }
    const rewriter = new UrlRewriter();
    const app = fastify({
        rewriteUrl: rewriter.rewriteUrl
    });

    await app.register(await import('@fastify/express'));
    const broadcaster = new HotUpdateBroadcaster()
    for (const target of targets) {
        target.resolver = resolver;
        const config = await target.getConfig();
        const devServer = await createServer({
            ...config,
            base: `/${prefix}/${target.packageJson.name}`,
            server: {
                ...config.server ?? {},
                hmr: {
                    ...config.server?.hmr ?? {},
                    server: app.server,
                },
                fs: {
                    strict: false
                }
            },
        });

        broadcaster.enhanceDevServer(devServer);
        rewriter.targets.push(target);
        app.register(await getTargetMiddleware(devServer, target, devServer.config.base), {
            prefix: devServer.config.base
        });
    }
    await app.listen({
        host: '0.0.0.0',
        port: 9000
    });
    console.log('Listen http://localhost:9000');
    return app;

}

class DependencyServer {
    /**
     * @param targets {Array<import("../helpers/target.js").Target>}
     */
    constructor(targets) {

        this.optimizeDeps = [...new Set([
            ...targets.flatMap(t => Object.keys(t.packageJson.dependencies ?? {})),
        ])].filter(x => targets.every(y => y.packageJson.name !== x));
    }

    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        const map = await this.build(this.optimizeDeps);
        app.get('/_/@id*', async (req, res) => {
            const [pkg, version] = req.url.substring('/_/@id:'.length).split('@');
            console.log(pkg, version);
            const pkgPath = fileURLToPath(import.meta.resolve(pkg, process.cwd()));
            res.headers({
                'Content-Type': "text/javascript"
            });
            if (map.has(pkgPath)) {
                const data = map.get(pkgPath);
                return await fs.readFile(data.file);
            } else {
                const map = await this.build([pkgPath])
                return await fs.readFile([...map.values()][0].file);
            }

        });
    }

    async build(entryPoints){
        const esbuild = await import('esbuild');
        const loader = await import('esbuild-plugin-wasm').then(x => x.wasmLoader)
        const build = await esbuild.build({
            bundle: true,
            // chunkNames: this.optimizeDeps,
            entryPoints,
            outdir: '/tmp/.vite/',
            format: 'esm',
            target: 'esnext',
            metafile: true,
            plugins: [
                loader()
            ]
        }).catch(console.error);

        return new Map(Object.entries(build.metafile.outputs)
            .filter(([file, data]) => data.entryPoint)
            .map(([file, data]) =>
                [path.resolve(process.cwd(), data.entryPoint), {
                    file: path.resolve(process.cwd(), file),
                    exports: data.exports
                }]
            ));
    }
}

class UrlRewriter {
    /**
     *
     * @type {import("../helpers/target.js").Target[]}
     */
    targets = [];

    rewritePath(path, req) {
        for (const target of this.targets) {
            if (!path.startsWith(`/${prefix}/${target.packageJson.name}`)) continue;
            const file = path.substring(`/${prefix}/${target.packageJson.name}`.length);
            if (!file || file === '/') {
                const mainEntry = target.packageJson.module
                    ?? target.packageJson.exports?.['.']
                    ?? './index.ts';
                return join(`/${prefix}/${target.packageJson.name}/`, mainEntry);
            }
            if ("." + file in (target.packageJson.exports ?? {})) {
                const entry = target.packageJson.exports["." + file];
                return join(`/${prefix}/${target.packageJson.name}/`, entry);
            }
            if (file.startsWith(`/${prefix}`)) {
                return this.rewritePath(file, req);
            }
        }
        return path;
    }

    rewriteUrl = req => {
        return this.rewritePath(req.url, req)
    }
}

class HotUpdateBroadcaster {
    #eventTarget = new EventTarget();

    enhanceDevServer(devServer) {
        const baseSend = devServer.ws.send
        this.#eventTarget.addEventListener('ws', e => baseSend(e.detail))
        devServer.ws.send = this.send;
    }

    send = payload => {
        return this.#eventTarget.dispatchEvent(new CustomEvent('ws', {detail: payload}));
    }
}


/**
 * @param devServer {import('vite/dist/node/index.d.ts').ViteDevServer}
 * @param target {import("../helpers/target.js").Target}
 * @param base {string}
 */
export async function getTargetMiddleware(devServer, target, base) {
    return async (app, options) => {
        app.get('*', (request, reply, next) => {
            // if (base !== '/' && request.url.startsWith(base + '@fs')) {
            //     reply.headers({
            //         'Content-Type': 'application/javascript'
            //     })
            //     return Promise.resolve(
            //         `export * from "/${request.url.substring(base.length).replace(/\?.*$/,'')}"`
            //     )
            // }
            devServer.middlewares(request.raw, reply.raw);
        })
    }
}
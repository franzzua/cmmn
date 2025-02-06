import {Target} from "../helpers/target.js";
import {fastify} from "fastify";
import {createServer} from "vite";
import {join} from "path";

const prefix = '_';

export async function dev(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const resolver = (id) => {
        const target = targets.find(x => id.startsWith(x.packageJson.name));
        if (target)
            return `/${prefix}/` + id;
    }
    const rewriter = new UrlRewriter();
    const app = fastify({
        rewriteUrl: rewriter.rewriteUrl
    });
    await app.register(await import('@fastify/express'));
    const broadcaster = new HotUpdateBroadcaster()
    for (let target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        target.resolver = resolver;
        const config = await target.getConfig();
        const devServer = await createServer({
            ...config,
            base: `/${prefix}/` + target.packageJson.name,
            server: {
                ...config.server ?? {},
                hmr: {
                    ...config.server?.hmr ?? {},
                    server: app.server,
                },
            },
        });

        broadcaster.enhanceDevServer(devServer);
        rewriter.targets.push(target);
        app.register(await getTargetMiddleware(devServer, target), {
            prefix: `/${prefix}/${target.packageJson.name}`
        });
    }

    await app.listen({
        host: '0.0.0.0',
        port: 9000
    });
    console.log(`Listen http://localhost:9000`);
    return app;

}

class UrlRewriter {
    /**
     *
     * @type {import("../helpers/target.js").Target[]}
     */
    targets = [];

    rewritePath(path, req){
        for (let target of this.targets) {
            if (!path.startsWith(`/${prefix}/${target.packageJson.name}`)) continue;
            const file = path.substring(`/${prefix}/${target.packageJson.name}`.length);
            if (!file || file === '/'){
                const mainEntry = target.packageJson.module
                    ?? target.packageJson.main
                    ?? target.packageJson.exports?.['.'];
                return join(`/${prefix}/${target.packageJson.name}/`, mainEntry);
            }
            if (file in (target.packageJson.exports ?? {})) {
                const entry = target.packageJson.exports[file];
                return join(`/${prefix}/${target.packageJson.name}/`, entry);
            }
            if (file.startsWith(`/${prefix}`)){
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

    send = payload => this.#eventTarget.dispatchEvent(new CustomEvent('ws', {detail: payload}))
}


/**
 * @param devServer {import('vite/dist/node/index.d.ts').ViteDevServer}
 * @param target {import("../helpers/target.js").Target}
 * @param prefix {string}
 */
export async function getTargetMiddleware(devServer, target) {
    return async (app, options) => {
        app.get('*', (request, reply, next) => {
            devServer.middlewares(request.raw, reply.raw);
        })
    }
}
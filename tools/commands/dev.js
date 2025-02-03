import {Target} from "../helpers/target.js";
import {fastify} from "fastify";
import {createServer} from "vite";
import path from "path";

const prefix = '_';

export async function dev(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const resolver = (id) => {
        const target = targets.find(x => id.startsWith(x.packageJson.name));
        if (target)
            return `/${prefix}/` + id;
    }
    const app = fastify({});
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

        app.register(await getTargetMiddleware(devServer, target, prefix), {
            prefix: `/${prefix}/${target.packageJson.name}`
        });
    }

    await app.listen({
        host: '0.0.0.0',
        port: 9000
    });
    return app;

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
export async function getTargetMiddleware(devServer, target, prefix) {
    return async (app, options) => {
        app.get('*', (request, reply, next) => {
            const file = request.params['*'] || 'index';
            function redirect(location){
                reply.status(302);
                reply.headers({ location });
                reply.send();
            }
            if (file in target.entries) {
                const entry = target.entries[file];
                return redirect(path.join(`/${prefix}/${target.packageJson.name}/`, entry));
            }
            if (file.startsWith(`/${prefix}`)){
                return redirect(file);
            }
            devServer.middlewares(request.raw, reply.raw);
        })
    }
}
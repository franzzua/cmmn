import {createServer} from "vite";
import {join, resolve} from "node:path";

export class TargetServer {
    broadcaster;
    /**
     * @type {import("../helpers/target.js").Target}
     */
    target;
    prefix;

    /**
     * @param target {import("../helpers/target.js").Target}
     * @param prefix {string}
     */
    constructor(target, prefix, broadcaster) {
        this.target = target;
        this.prefix = prefix;
        this.broadcaster = broadcaster;
        this.base = `/${this.prefix}/${this.target.packageJson.name}`;
    }

    /**
     * @param id {string}
     * @returns {*}
     */
    resolveId(id) {
        return id.startsWith(this.target.packageJson.name)
            && `/${this.prefix}/${id}`
    }

    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        const config = await this.target.getConfig();
        const devServer = await createServer({
            ...config,
            base: this.base,
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
        this.broadcaster.enhanceDevServer(devServer);
        app.get(`${this.base}*`, (request, reply, next) => {
            devServer.middlewares(request.raw, reply.raw)
        })
    }

    /**
     * @param path {string}
     * @param req {import("fastify/types/request.js").FastifyRequest}
     * @returns {*|string}
     */
    rewritePath(path, req) {
        if (!path.startsWith(this.base))
            return path;
        return this.getFile(path) ?? path;
    }

    getFile(path) {
        const file = path.substring(this.base.length);
        if (!file || file === '/') {
            const mainEntry = this.target.packageJson.module
                ?? this.target.packageJson.exports?.['.']
                ?? './index.ts';
            return join(`${this.base}/`, mainEntry);
        }
        if ("." + file in (this.target.packageJson.exports ?? {})) {
            const entry = this.target.packageJson.exports["." + file];
            return join(`${this.base}/`, entry);
        }
        if (file.startsWith(`/${this.prefix}`)) {
            return file;
        }

    }
}
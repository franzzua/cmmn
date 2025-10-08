import fs from "node:fs";
import {fastify} from "fastify";
import {join} from "node:path";

export class TargetServer {
    /**
     * @type {import("../helpers/target").Target}
     */
    target;
    prefix;
    /**
     * @type string
     */
    base
    /**
     * @type {import("./resolver.ts").Resolver}
     */
    resolver;
    url;
    wsPrefix = '/@ws';

    /**
     * @param target {import("../helpers/target").Target}
     * @param prefix {string}
     * @param resolver {import("./resolver.ts").Resolver}
     */
    constructor(target, prefix, resolver) {
        this.target = target;
        this.prefix = prefix;
        this.resolver = resolver;
        this.base = `/${this.prefix}/${this.target.packageJson.name}`;
    }

    async initProxy() {
        return ;
        const https = this.target.https;
        if (!https) return;

        const cert = await fs.promises.readFile(https.cert).catch(() => void 0);
        const key = await fs.promises.readFile(https.key).catch(() => void 0);
        if (!cert || !key)
            return this.target.error(`cert not found for ^W${https.host}:${https.port} `)
        this.target.log(`init proxy ^W${https.host}:${https.port}`)
        const proxy = fastify({
            http2: true,
            https: { cert, key },
        });
        proxy.register(await import('@fastify/http-proxy'), {
            upstream: 'http://127.0.0.1:9000',
            websocket: true,
            wsUpstream: 'ws://127.0.0.1:9000',
            logLevel: 'info',
            prefix: '/_',
            rewritePrefix: '/_'
        });
        proxy.register(await import('@fastify/http-proxy'), {
            upstream: 'http://127.0.0.1:9000',
            websocket: true,
            wsUpstream: 'ws://127.0.0.1:9000',
            logLevel: 'info',
            rewritePrefix: this.base
        });
        proxy.listen({
            host: https.host,
            port: https.port,
        }, (err, address) => {
            if (err) {
                this.target.error(err.message);
            } else {
                this.target.log(`listen ^Bhttps://${https.host}:${https.port}`);
            }
        });
    }

    /**
     * @param id {string}
     * @returns {*}
     */
    resolveId = (id, importer, options) => {
        const path = id.match(new RegExp(`^\/?${this.target.packageJson.name}(?<path>.*)$`))?.groups.path;
        if (path === undefined)
            return null;
        const entry = this.target.getEntry("." + path);
        if (!entry) {
            this.target.error(`Entry not found for path: ${path}`);
            return
        }
        const relative = this.target.flags.production ? entry.output : entry.relative.substring(2);
        const resolvedId = `${this.url}${this.base}/${relative}`;
        return {
            id: resolvedId,
            external: true
        };
    }

    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        app.all(`${this.base}*`, (request, reply, next) => {
            if (request.url.startsWith(this.base + this.wsPrefix)) return ;
            return this.handle(app, request, reply);
        });
        await this.initProxy();
    }
    handle(app, request, reply){
        throw new Error(`Not implemented`);
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
        if (file.startsWith(`/@`)) return path;
        file = this.proxy(file, req) ?? file;
        if (file.startsWith(`/${this.prefix}`)) return file;
        file = this.resolvePath(file, req) ?? file;
        return this.base + file;
    }

    resolvePath(path, req) {

    }

    /**
     * Rewrite request url before it processed
     * @param file {string}
     * @param req {import("fastify/types/request.js").FastifyRequest}
     * @returns {string|undefined}
     */
    proxy(file, req) {
        const first = this.target.proxy.find(x => x.regex.test(file))
        if (!first) return file;
        const result = file.replace(first.regex, first.replace);
        this.target.log(`proxy ^B${file}^w by ^W${first.regex.toString().replaceAll('^','^^')} to ${result}`);
        return result;
    }
}
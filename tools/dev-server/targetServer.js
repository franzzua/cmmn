import fs from "node:fs";
import {fastify} from "fastify";

export class TargetServer {
    /**
     * @type {import("../helpers/target").Target}
     */
    target;
    prefix;
    /**
     * @type {import("./resolver.js").Resolver}
     */
    resolver;
    url;

    /**
     * @param target {import("../helpers/target").Target}
     * @param prefix {string}
     * @param resolver {import("./resolver.js").Resolver}
     */
    constructor(target, prefix, resolver) {
        this.target = target;
        this.prefix = prefix;
        this.resolver = resolver;
        this.base = `/${this.prefix}/${this.target.packageJson.name}`;
    }

    async initProxy() {
        const https = this.target.https;
        if (!https) return;
        this.target.log(`init proxy ^W${https.host}:${https.port}`)
        const proxy = fastify({
            http2: true,
            https: {
                cert: fs.readFileSync(https.cert),
                key: fs.readFileSync(https.key),
            },
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
    resolveId = id => {
        if (id.match(/@(vite|react)/)) console.log(id);
        return id.startsWith(this.target.packageJson.name)
            && `${this.url}/${this.prefix}/${id}`
    }

    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        app.all(`${this.base}*`, (request, reply, next) => {
            // this.target.log(request.url);
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
import {TargetServer} from "./targetServer.js";
import {DependencyServer} from "./dependencyServer.js";
import {Resolver} from "./resolver.js";

export class DevServer {
    prefix = '_';

    /**
     * @type {import("../helpers/target.js").Target[]}
     */
    targets;

    /**
     * @param targets {import("../helpers/target.js").Target[]}
     */
    constructor(targets) {
        this.targets = targets;
        this.resolver = new Resolver(this)
        this.targetServers = targets.map(t => new TargetServer(t, this.prefix, this.resolver));
        this.depServer = new DependencyServer(targets, process.env.NODE_ENV);
    }

    rewriteUrl = (req) => {
        return this.targetServers.reduceRight(
            (path, target) => target.rewritePath(path, req),
            this.proxy(req)
        );
    }

    proxy(req){
        if (req.url === '/') return '/_/@cmmn/test/';
        return req.url;
    }
    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        app.addHook('preHandler', async (req, res) => {
            this.depServer.url = `http://${req.headers.host}`
        })
        await this.depServer.register(app);
        for (let targetServer of this.targetServers) {
            await targetServer.register(app);
        }
        app.addHook('onError', (req, res) => {
            console.log('error');
        })
        for (let targetServer of this.targetServers) {
            await targetServer.initProxy();
        }
    }
}
import {TargetServer} from "./targetServer.js";
import {DependencyServer} from "./dependencyServer.js";
import {Resolver} from "./resolver.js";
import {TargetRunner} from "./target-runnner.js";
import {TargetWebServer} from "./target-web-server.js";

export class DevServer {
    prefix = '_';

    /**
     * @type {import("../helpers/target.js").Target[]}
     */
    targets;
    /**
     * @type {import("../helpers/target.js").Target}
     */
    rootTarget;

    /**
     * @param targets {import("../helpers/target.js").Target[]}
     */
    constructor(targets) {
        this.targets = targets;
        this.rootTarget = targets.at(-1);
        this.resolver = new Resolver(this)
        this.targetServers = targets.map(t => {
            if (t.packageJson.bin){
                return new TargetRunner(t, this.prefix, this.resolver);
            }
            return new TargetWebServer(t, this.prefix, this.resolver);
        });
        this.depServer = new DependencyServer(targets, process.env.NODE_ENV);
    }

    rewriteUrl = (req) => {
        return this.targetServers.reduceRight(
            (path, target) => target.rewritePath(path, req),
            req.url
        );
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
            this.rootTarget.error(req.url);
            res.status = 422;
            res.send('Failed to process request');
        })
    }
}
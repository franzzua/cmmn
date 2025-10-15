import {DependencyServer} from "./dependencyServer.js";
import {Resolver} from "./resolver";
import {TargetRunner} from "./target-runnner.js";
import {TargetWebServer} from "./target-web-server";
import {Target} from "../model/target";
import {FastifyInstance, FastifyRequest} from "fastify";

export class DevServer {
    prefix = '_';
    rootTarget: Target = this.targets.at(-1);
    resolver = new Resolver(this.targets);
    targetServers = this.targets.map(t => {
        if (t.packageJson.bin){
            return new TargetRunner(t, this.prefix, this.resolver);
        }
        return new TargetWebServer(t, this.prefix, this.resolver);
    }).filter(x => x != null);
    depServer: DependencyServer = new DependencyServer(this.targets);
    get isBundler(){
        return this.rootTarget.flags.production;
    }

    constructor(private targets: Target[]) {
    }

    rewriteUrl = (req: FastifyRequest) => {
        return this.targetServers.reduceRight(
            (path, target) => target.rewritePath(path, req),
            req.url
        );
    }

    async register(app: FastifyInstance) {
        app.addHook('preHandler', async (req, res) => {
            this.resolver.url = `${req.headers.protocol ?? req.protocol}://${req.headers.host ?? req.host}`
            for (let targetServer of this.targetServers) {
                targetServer.url = this.resolver.url;
            }
        })
        await this.depServer.register(app);
        for (let targetServer of this.targetServers) {
            await targetServer.register(app);
        }
        app.addHook('onError', (req, res, error) => {
            this.rootTarget.error(`${req.url}: ${error}`);
            res.status(422).send('Failed to process request');
        });
        if (this.isBundler){
            app.get('/_/sw.js', (req, res) => {
                const worker = this.resolver.resolveId("@cmmn/service-worker/worker");
                res.header('Service-Worker-Allowed', '/')
                    .type('application/javascript')
                    .send(`import "${worker.id}"`);
            })
        }
    }
}
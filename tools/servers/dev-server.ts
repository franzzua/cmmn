import {Target} from "../model/target";
import {FastifyInstance, FastifyRequest} from "fastify";
import {Monorepo} from "../model/monorepo";
import {BundleServer} from "./bundle-server";
import {ViteDevelopmentServer} from "./vite-dev-server";
import {Pack} from "../model/pack";
import {PackServer} from "./pack-server";
import {Flags} from "../model/flags";
import {TargetRunner} from "./target-runnner";

export class DevServer {
    rootTarget: Target = this.monorepo.root;
    targetServers = new Map<Pack, PackServer>(
        this.monorepo.packs.map(pack => [pack, this.createServer(pack)])
    );

    get resolver() {
        return this.monorepo.resolver
    }

    private createServer(pack: Pack): PackServer {
        if (pack instanceof Target) {
            if (pack.packageJson.bin) {
                return new TargetRunner(pack);
            }
            if (this.monorepo.flags.production) {
                const bundler = this.monorepo.createBundler(pack);
                return new BundleServer(pack, bundler);
            }
            return new ViteDevelopmentServer(pack, this.monorepo);
        }
        const bundler = this.monorepo.createBundler(pack);
        return new BundleServer(pack, bundler);
    }

    get isBundler() {
        return this.monorepo.flags.production;
    }

    constructor(private monorepo: Monorepo) {
    }

    rewriteUrl = (req: FastifyRequest) => {
        if (req.url.includes('@ws'))
            return req.url;
        const [path, query] = req.url.split('?');
        const resolved = this.resolver.resolvePath(path, null, {
            attributes: {
                resolve: query?.includes('resolve') ? true : undefined,
            }
        });
        if (resolved) {
            return resolved.pack.publicPath + '/' + resolved.path + (query ? '?' + query : '');
        }
        return req.url;
    }

    async register(app: FastifyInstance) {
        for (let targetServer of this.targetServers.values()) {
            await targetServer.register(app);
        }
        app.addHook('preHandler', async (request, reply) => {

            if (request.url.endsWith('?resolve'))
                return reply.type('application/javascript')
                    .send(`export default ${JSON.stringify(request.url.split('?')[0])}`);
        })

        app.addHook('preHandler', async (req, res) => {
            this.resolver.basePath = `${req.headers.protocol ?? req.protocol}://${req.headers.host ?? req.host}`;
        });
        app.addHook('onError', (req, res, error) => {
            this.rootTarget.error(`${req.url}: ${error}`);
            res.status(422).send('Failed to process request');
        });
        if (this.isBundler) {
            app.get('/_sw.js', (req, res) => {
                const worker = this.resolver.resolveId("@cmmn/service-worker/worker");
                res.type('application/javascript')
                    .send(`import "${worker.id}"`);
            })
        }
    }


}
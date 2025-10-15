import {Target} from "../model/target";
import {FastifyInstance, FastifyRequest} from "fastify";
import {Monorepo} from "../model/monorepo";
import {Resolver} from "../model/resolver";
import {BundleServer} from "./bundle-server";
import {ViteDevelopmentServer} from "./vite-dev-server";
import {Pack} from "../model/pack";
import {PackServer} from "./pack-server";
import {RolldownBundler} from "../bundlers/rolldown-bundler";
import {Flags} from "../model/flags";
import {ViteBundler} from "../bundlers/vite.bundler";
import mime from "mime-types";

export class DevServer {
    prefix = '/_/';
    rootTarget: Target = this.monorepo.root;
    resolver = new Resolver(this.monorepo.packs);
    targetServers = new Map<Pack, PackServer>(
        this.monorepo.packs.map(pack => [pack, this.createServer(pack)])
    );

    private createServer(pack: Pack): PackServer{
        if (pack instanceof Target) {
            // if (t.packageJson.bin) {
            //     return new TargetRunner(t, this.prefix, this.resolver);
            // }
            if (Flags.Current.production){
                const bundler = new ViteBundler(pack, this.resolver);
                return new BundleServer(bundler);
            }
            return new ViteDevelopmentServer(pack, this.resolver, this.rootTarget);
        }
        const bundler = new RolldownBundler(pack, this.resolver);
        return new BundleServer(bundler);
    }

    get isBundler(){
        return this.rootTarget.flags.production;
    }

    constructor(private monorepo: Monorepo) {
    }

    rewriteUrl = (req: FastifyRequest) => {
        let url = req.url;
        return url;
    }

    async register(app: FastifyInstance) {
        app.addHook('preHandler', async (req, res) => {
            const url = `${req.headers.protocol ?? req.protocol}://${req.headers.host ?? req.host}`
            this.resolver.basePath = url;
        })
        for (let targetServer of this.targetServers.values()) {
            if (targetServer instanceof ViteDevelopmentServer) {
                await targetServer.init(app.server);
            }
        }
        app.get('*', async (req, res) => {
            const path = req.url.split('?')[0];
            const resolved = this.resolver.resolvePath(path);
            if (!resolved) {
                this.rootTarget.error(`Can't resolve ${path}`);
                return res.status(404).send('Not found');
            }
            const server = this.targetServers.get(resolved.pack);
            const mimeType = mime.lookup(resolved.path);
            res.type(mimeType);
            return await server.handle(resolved.path, req, res);
        })
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
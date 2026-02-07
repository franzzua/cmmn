import {Target} from "../model/target";
import {HttpServer} from "vite";
import {ChangeEvent} from "../model/pack";
import {Resolver} from "../model/resolver";
import {createServer, ViteDevServer} from "vite";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {PackServer} from "./pack-server";
import {ViteBuilder} from "../bundlers/vite.builder";
import {Monorepo} from "../model/monorepo";

export class ViteDevelopmentServer extends PackServer{
    readonly wsPrefix = '/@ws';
    private viteBuilder = new ViteBuilder(this.target, this.monorepo.resolver, this.monorepo.flags)
    constructor(private target: Target,
                private monorepo: Monorepo) {
        super(target);
    }


    protected async handle(request: FastifyRequest, reply: FastifyReply){
        if (request.url.startsWith(this.pack.publicPath + '/'+this.wsPrefix)) return ;

        reply.type(this.getMimeType(request.url));
        if (request.url.endsWith('?resolve')){
            return reply
                .type('application/javascript')
                .send(`export default ${JSON.stringify(request.url.split('?')[0])}`);
        }
        const devServer = await (this.devServerRequest ??= this.createServer(request.server.server));
        return new Promise<string | Uint8Array>(resolve => {
            devServer.middlewares(request.raw, reply.raw, resolve);
        });
    }

    private devServerRequest: Promise<ViteDevServer>;

    private async createServer(server: HttpServer) {
        const config = await this.viteBuilder.getConfig();
        const viteServer = await createServer({
            ...config as any,
            server: {
                hmr: this.target.flags.production ? false : {
                    server: server,
                    path: this.wsPrefix,
                },
                ws: this.target.flags.production ? false : undefined,
                fs: {
                    strict: false
                },
                allowedHosts: [
                    this.monorepo.root.https?.host,
                    this.target.https?.host,
                    ...this.target.reactions.map(x => x instanceof Target ? x.https?.host : '')
                ].filter(x => x)
            },
        });
        this.target.log(`Start dev server`);
        this.enhanceWebSocket(viteServer);
        return viteServer;
    }

    /**
     * Emit event on ws and proxies events from dependent dev-servers
     */
    private enhanceWebSocket(server: ViteDevServer) {
        const emitChange = server.ws.send;
        server.ws.send = (payload: ChangeEvent['payload']) => {
            // if (this.target.isExcluded("")) return;
            this.target.log('change')
            this.target.dispatchEvent(new ChangeEvent(payload, this.target.packageJson.name));
        };
        this.target.addEventListener('change', (e: ChangeEvent) => {
            this.target.log('change')
            emitChange.call(server.ws, e.payload);
        });
    }
}
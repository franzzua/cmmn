import {Target} from "../model/target";
import {HttpServer} from "vite";
import {ChangeEvent} from "../model/pack";
import {Resolver} from "../model/resolver";
import {createServer, ViteDevServer} from "vite";
import {FastifyReply, FastifyRequest} from "fastify";
import {PackServer} from "./pack-server";
import {ViteBuilder} from "../bundlers/vite.builder";

export class ViteDevelopmentServer implements PackServer{
    readonly wsPrefix = '/@ws';
    private viteBuilder = new ViteBuilder(this.target, this.resolver)
    constructor(private target: Target,
                private resolver: Resolver,
                private rootTarget: Target) {
    }

    async init(server: HttpServer) {
        this.devServer = await this.createServer(server);
    }

    async handle(path: string, request: FastifyRequest, reply: FastifyReply){
        return new Promise<string | Uint8Array>(resolve => {
            this.devServer.middlewares(request.raw, reply.raw, resolve);
        });
    }

    private devServer: ViteDevServer;

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
                    this.rootTarget.https?.host,
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
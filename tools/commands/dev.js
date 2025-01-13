import {Target} from "../helpers/target.js";
import {createCompiler, createDevServer, Server} from "@farmfe/core";
import path from "node:path";

export async function dev(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    if (targets.length === 1) {
        const target = targets[0];
        const config = await target.getViteConfig();
        const compiler = await createCompiler(config, target.logger);
        const devServer = await createDevServer(compiler, config, target.logger);
        await compiler.compile();
        await devServer.listen();
    } else {
        const rootTarget = new Target(process.cwd(), flags);
        const config = await rootTarget.getViteConfig();
        const compiler = await createCompiler(config, rootTarget.logger);
        const rootServer = await createDevServer(compiler, config, rootTarget.logger);

        /** @type{Map<string, ProxyServer>} **/
        const devServers = new Map();
        for (let target of targets) {
            if (target.tsConfig.include?.length === 0)
                continue;
            const config = await target.getViteConfig();
            const compiler = await createCompiler(config, target.logger);
            const deps = target.deps.map(x => devServers.get(x.packageJson.name));
            const devServer = new ProxyServer({
                compiler,
                logger: target.logger,
                server: rootServer,
                deps
            });
            devServers.set(target.packageJson.name, target);
            await devServer.createDevServer(config.server);
            await compiler.compile();
        }

        await rootServer.listen();
    }
}

class ProxyServer extends Server {
    baseServer;
    /** @type Array<ProxyServer> **/
    deps;
    /** @type Array<ProxyServer> **/
    children = [];

    constructor(options) {
        super(options);
        this.baseServer = options.server;
        this._app = this.baseServer._app;
        this.deps = options.deps;
        for (let dep of this.deps) {
            dep.children.push(this);
        }
    }

    async createServer(options) {
        const { https, host } = options;
        const protocol = https ? 'https' : 'http';
        const publicPath = this.compiler?.config.config.output?.publicPath;
        // TODO refactor previewServer If it's preview server, then you can't use create server. we need to create a new one because hmr is false when you preview.
        const hmrPath = path.join(publicPath, options.hmr.path);
        this.config = {
            ...options,
            hmr: {
                ...options.hmr,
                path: hmrPath
            }
        };
        this.server = this.baseServer.server;
        const old = this.baseServer.hmrEngine.hmrUpdate;
        this.baseServer.hmrEngine.hmrUpdate = path => {
            this.hmrEngine.hmrUpdate(path);
            old.call(this.baseServer.hmrEngine, path);
        }
    }

    initializeKoaServer() {
    }

    // createWebSocket() {
    //     if (!this.server) {
    //         throw new Error('Websocket requires a server.');
    //     }
    //     this.ws = this.baseServer.ws;
    //     this.ws.wss.on('connection', (socket) => {
    //         socket.on('message', (raw) => {
    //             const parsed = JSON.parse(String(raw));
    //             return this.hmrUpdate(parsed.path, true);
    //         });
    //     });
    //     // this.ws = new WsServer(this.server, this.config, this.hmrEngine);
    // }

    // async hmrUpdate(path, force) {
    //     await this.hmrEngine.hmrUpdate(path, force);
    //     for (let child of this.children) {
    //         await child.hmrUpdate(path, force);
    //     }
    // }
}
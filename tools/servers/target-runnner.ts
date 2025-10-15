import { spawn} from "node:child_process";
import {Watcher} from "../helpers/watcher.js";
import {PackServer} from "./pack-server";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {ChangeEvent, FileChangeEvent} from "../model/pack";
import {Target} from "../model/target";
import {createProxyMiddleware} from "http-proxy-middleware";
import {IncomingMessage} from "node:http";
import {Socket} from "node:net";

export class TargetRunner extends PackServer {
    static port = 9010;
    port = TargetRunner.port++;
    /** @type {Promise<import('node:child_process').ChildProcess> | undefined} **/
    cp;

    watcher = new Watcher();

    protected handle(req: FastifyRequest, reply: FastifyReply): Promise<unknown> {
        return Promise.resolve(undefined);
    }

    async register(app: FastifyInstance) {
        if (!app.use)
            await app.register(await import('@fastify/express'))
        const proxy = createProxyMiddleware<Request, Response>({
            target: `http://127.0.0.1:${this.port}`,
            changeOrigin: true,
            pathFilter: (path, req) => {
                return !req['upgrade'];
            },
        });
        const wsProxy = createProxyMiddleware<Request, Response>({
            target: `ws://127.0.0.1:${this.port}`,
            changeOrigin: true,
        });
        await app.use(this.pack.publicPath, async (req, res, next) => {
            if (req.url.endsWith('?resolve')){
                return res.type('application/javascript').send(`export default "${this.pack.publicPath}"`);
            }
            await (this.cp ??= this.runServer())
            proxy(req, res, next);
        });
        app.server.on('upgrade', async (req, socket, head) => {
            if (req.url?.startsWith(this.pack.publicPath)) {
                await (this.cp ??= this.runServer())
                wsProxy.upgrade(req, socket as Socket, head)
            }
        })
        this.pack.log(`proxy to ${this.port}`);

        this.pack.addEventListener('change', async e => {
            const cp = await this.cp;
            if (!cp) return;
            if (cp.connected)
                cp.disconnect();
            cp.kill();
            this.pack.log(`Stopping due to change...`);
            this.cp = null;
        });
        this.watcher.watchTarget(this.pack as Target);
        this.pack.addEventListener('file', (e: FileChangeEvent) => {
            this.pack.dispatchEvent(new ChangeEvent({
                type: 'full-reload',
                triggeredBy: e.files
            }, this.pack.name))
        });
    }


    async runServer() {
        this.pack.log('starting...');

        const [command, ...params] = this.pack.packageJson.scripts.run
            // .replace('@cmmn/tools/import', '@cmmn/tools/import-dev')
            .split(' ');

        const cp = spawn(command, params, {
            env: {
                ...process.env,
                PORT: this.port
            },
            cwd: this.pack.rootDir,
            stdio: 'pipe'
        });
        cp.stderr!.pipe(process.stderr);
        cp.stdout!.pipe(process.stdout);
        await new Promise<void>(res => (cp.stdout!.on('data', e => {
            if (e?.includes(`http://127.0.0.1:${this.port}`))
                res();
        })));
        return cp;
    }

}
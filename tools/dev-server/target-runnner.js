import {TargetServer} from "./targetServer";
import {exec, spawn} from "node:child_process";
import {join} from "node:path";
import {watch} from "chokidar"
import {ChangeEvent} from "../helpers/target";
import {Watcher} from "../helpers/watcher.js";

export class TargetRunner extends TargetServer {
    static port = 9010;
    port = TargetRunner.port++;
    /** @type {Promise<import('node:child_process').ChildProcess> | undefined} **/
    cp;

    watcher = new Watcher();

    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        await app.register(await import('@fastify/http-proxy'), {
            upstream: `http://127.0.0.1:${this.port}`,
            websocket: true,
            wsUpstream: `ws://127.0.0.1:${this.port}`,
            logLevel: 'verbose',
            prefix: this.base,
            rewritePrefix: '',
            wsHooks: {
                onConnect: async (context, source, target) => {
                    await (this.cp ??= this.runServer());
                }
            }
        });
        this.target.log(`proxy to ${this.port}`);
        app.addHook('onRequest', async (req) => {
            if (!req.url.startsWith(this.base)) return;
            await (this.cp ??= this.runServer());
        })
        // await this.initProxy();

        this.target.addEventListener('change', async e => {
            const cp = await this.cp;
            if (!cp) return;
            if (cp.connected)
                cp.disconnect();
            cp.kill();
            this.target.log(`Stopping due to change...`);
            this.cp = null;
        });
        this.watcher.watchTarget(this.target);
        this.target.addEventListener('file', e => {
            this.target.dispatchEvent(new ChangeEvent({
                type: 'full-reload',
                triggeredBy: e.files
            }, this.target.packageJson.name))
        });
    }


    async runServer() {
        this.target.log('starting...');

        const [command, ...params] = this.target.packageJson.scripts.run
            // .replace('@cmmn/tools/import', '@cmmn/tools/import-dev')
            .split(' ');

        const cp = spawn(command, params, {
            env: {
                ...process.env,
                PORT: this.port
            },
            cwd: this.target.rootDir,
            stdio: 'pipe'
        });
        cp.stderr.pipe(process.stderr);
        cp.stdout.pipe(process.stdout);
        await new Promise(res => (cp.stdout.on('data', e => {
            if (e?.includes(`http://127.0.0.1:${this.port}`))
                res();
        })));
        return cp;
    }

}
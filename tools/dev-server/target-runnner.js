import {TargetServer} from "./targetServer.js";
import {exec, spawn} from "node:child_process";
import {join} from "node:path";
import {watch} from "chokidar"
import {ChangeEvent} from "../helpers/target.js";

export class TargetRunner extends TargetServer {
    port = 9010;
    /** @type {import('node:child_process').ChildProcess | undefined} **/
    cp;

    watcher = watch(this.target.rootDir, {
        cwd: this.target.rootDir,
        depth: 99,
        ignored: /node_modules|dist/,
        ignoreInitial: true
    });
    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        await app.register(await import('@fastify/http-proxy'), {
            upstream: `http://127.0.0.1:${this.port}`,
            logLevel: 'verbose',
            prefix: this.base,
            rewritePrefix: ''
        });
        app.addHook('onRequest', async (req) => {
            if (!req.url.startsWith(this.base)) return;
            await (this.cp ??= await this.runServer());
        })
        await this.initProxy();

        this.target.addEventListener('change', async e => {
            const cp = await this.cp;
            if (!cp) return;
            if (cp.connected)
                cp.disconnect();
            cp.kill();
            this.target.log(`Stopping due to change...`);
            this.cp = null;
        });
        this.watcher.addListener('change', e => this.target.dispatchEvent(new ChangeEvent({
            type: 'full-reload',
            triggeredBy: e
        }, this.target.packageJson.name)))
    }


    async runServer() {
        this.target.log('starting...');

        const bin = join(this.target.rootDir, this.target.packageJson.bin);

        const cp = spawn('node',`--import @cmmn/tools/import-dev ${bin}`.split(' '), {
            env: {
                ...process.env,
                PORT: this.port
            },
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
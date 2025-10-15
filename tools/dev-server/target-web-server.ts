import {TargetServer} from "./targetServer";
import path, {join} from "node:path";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import mime from "mime-types";
import {Asset, getAssets} from "./asset-collection";
import {readdir, readFile, stat} from "node:fs/promises";
import fs from "fs";
import {Output, ViteBuilder} from "./vite.builder";
import {BundleJsonBuilder} from "./bundle.json.builder";

export class TargetWebServer extends TargetServer {

    private viteBuilder = new ViteBuilder(this.target, this.resolver, this.base);

    async handle(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
        if (!this.target.flags.production) {
            const server = await this.viteBuilder.getServer(app.server);
            return new Promise(resolve => server.middlewares(request.raw, reply.raw, resolve));
        } else {
            const relPath = path.relative(this.base, request.url).split('?')[0];
            const bundle = await this.getBundle();
            const mimeType = mime.lookup(relPath);
            if (relPath in bundle)
                return reply.type(mimeType).send(bundle[relPath]);
            try {
                const file = await readFile(path.join(this.target.publicDir, relPath))
                return reply.type(mime.lookup(relPath)).send(file);
            } catch {
                return reply.status(404).send('Not found');
            }
        }
    }
    async getBundle(){
        const bundle = await this.viteBuilder.getBundle();
        const bundleJsonBuilder = new BundleJsonBuilder(this.target, this.url)
        const bundleJson = await bundleJsonBuilder.getBundleJson(bundle);
        for (let dep of bundleJson.deps) {
            const target = this.resolver.getTarget(dep.baseURI.substring(this.url.length + 3));
            if (target){
                dep.baseURI = `${this.url}/${this.prefix}/${target.target.packageJson.name}/`;
                dep.path = target.path;
            }
        }
        const result: Bundle = {
            '@_/bundle.json': JSON.stringify(bundleJson)
        };
        for (let output of bundle) {
            const entry = this.target.entries.find(x => x.relative == './'+output.fileName);
            result[entry?.output ?? output.fileName] = output.data;
        }
        return result;
    }



    resolveByReferrer(req, file) {
        if (!req) return;
        if (!req.headers.referer) return;
        const referrerPath = new URL(req.headers.referer).pathname;
        if (!referrerPath.startsWith(this.base)) return;
        const referrer = this.resolvePath(referrerPath.substring(this.base.length), null);
        if (!referrer) return;
        const absolute = join(referrer, '..' + file);
        if (fs.existsSync(absolute)) {
            return absolute;
        }
    }

    resolvePath(file: string, req: FastifyRequest) {
        if (file === '/') file = '';
        const entry = this.target.entries.find(x => x.name === '.' + file);
        if (entry){
            const path = this.target.flags.production ? entry.output : entry.relative.substring(2);
            return '/' + path;
        }
        return this.resolveByReferrer(req, file);
    }

    async register(app: FastifyInstance){
        app.all(`${this.base}*`, (request, reply) => {
            if (request.url.startsWith(this.base + this.viteBuilder.wsPrefix)) return ;
            return this.handle(app, request, reply);
        });
    }
}
export type Bundle = Record<string, string | Uint8Array>;
export type BundleJson = {
    assets: Asset[];
    deps: {
        baseURI: string;
        path: string;
    }[]
    publicPath?: string;
    proxy?: {
        regex: string;
        replace: string;
    }[]
}
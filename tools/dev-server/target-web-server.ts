import {TargetServer} from "./targetServer";
import path, {join} from "node:path";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import mime from "mime-types";
import {Asset, getAssets} from "./asset-collection";
import {readdir, readFile, stat} from "node:fs/promises";
import fs from "fs";
import {Output, ViteBuilder} from "./vite.builder";

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
        const result: Bundle = {
            '@_/bundle.json': await this.getBundleJson().then(JSON.stringify)
        };
        for (let output of bundle) {
            const entry = this.target.entries.find(x => x.relative == './'+output.fileName);
            result[entry?.output ?? output.fileName] = output.data;
        }
        return result;
    }
    async getBundleJson(): Promise<BundleJson> {
        const bundle = await this.viteBuilder.getBundle();
        const data = {
            publicPath: this.target.publicPath,
            proxy: this.target.proxy.map(x => ({
                regex: x.regex.source,
                replace: this.target.getEntry("."+x.replace)?.output
            }))
        };
        const assets = await getAssets(bundle);
        for (let asset of assets) {
            const entry = this.target.entries.find(x => x.relative == './'+asset.path);
            if (entry){
                asset.path = entry.output;
            }
        }
        for (let file of await readdir(this.target.publicDir, {
            recursive: true
        }).catch(() => [])){
            const info = await stat(path.join(this.target.publicDir, file));
            assets.push({
                path: file,
                hash: info.mtimeMs.toString(36),
                size: info.size,
                optional: true
            });
        }
        const deps = new Set<string>();
        for (let output of bundle) {
            for (let dependency of output.deps) {
                if (!dependency.package.startsWith(`${this.url}/${this.prefix}/`)) continue;
                const path = dependency.package.replace(`${this.url}/${this.prefix}/`, '');
                if (path.startsWith('@id')){
                    deps.add(`${this.url}/_/${path}/`)
                } else {
                    for (let dep of this.target.externalDependencies) {
                        if (!path.startsWith(dep)) continue;
                        deps.add(`${this.url}/_/${dep}/`)
                    }
                }
            }
        }
        return {
            ...data,
            assets,
            deps: Array.from(deps).map(x => ({
                baseURI: x,
                path: ''
            }))
        };
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
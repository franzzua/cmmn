import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import mime from "mime-types";
import {RolldownDependencyBuilder} from "./rolldown-dependency-builder";
import {getHash} from "./asset-collection";
import {Target} from "../helpers/target";
import {FastifyInstance} from "fastify";

export class DependencyServer {
    base = '/_/@id'
    url: string;
    target: Target;
    optimizeDeps: string[];
    builder: RolldownDependencyBuilder;

    constructor(targets: Target[], mode: "development"|"production") {
        this.target = targets.at(-1);
        this.optimizeDeps = [...new Set([
            ...targets.flatMap(t => t.externalDependencies),
            // '@vite/client',
            // '@react-refresh'
        ])].filter(x => targets.every(y => y.packageJson.name !== x));
        this.builder = new RolldownDependencyBuilder(this.optimizeDeps, this.base, this.target.flags.minify);
    }

    resolveId(id: string, importer, options) {
        if (id.startsWith(`${this.base}`))
            return {
                id: `${this.url}${id}`,
                external: true
            };
        if (this.optimizeDeps.some(x => id.startsWith(x))) {
            return {
                id: `${this.url}${this.base}/${id}`,
                external: true
            };
        }
    }

    async getPackageJSON(pkg: string) {
        const resolved = import.meta.resolve(pkg);
        const file = fileURLToPath(resolved);
        let dir = path.dirname(file);
        while (true) {
            const packageJsonText = await fs.readFile(path.resolve(dir, 'package.json'), {encoding: 'utf-8'}).catch(() => null);
            if (packageJsonText)
                return JSON.parse(packageJsonText);
            dir = path.resolve(dir, '..');
        }
    }

    cache = new Map();
    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app: FastifyInstance) {
        app.get('/_/@id/*', async (req, res) => {
            try {
                let param = req.params['*'];
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Content-Type', mime.lookup(param) || 'text/javascript');
                return await this.getAsset(param);
            } catch (e) {
                console.error(e);
                res.statusCode = 404;
                return e.toString();
            }
        });
    }
    async getAsset(asset: string){
        let [pkg, path] = asset.split('/@_/');
        path ??= '';
        if (pkg.endsWith('/')) pkg = pkg.substring(0, pkg.length - 1);
        const pkgJSON = await this.getPackageJSON(pkg);
        const exports = pkgJSON.exports;
        if (exports && (`.${path}` in exports)){
            pkg += path;
            path = '';
        }
        if (!this.cache.has(pkg)){
            const start = +performance.now();
            await this.getBundle(pkg);
            const end = +performance.now();
            this.target.log(`^Wbundle ^R${pkg} ^Wfor ^R${((end - start) / 1000).toFixed(2)}s`)
        }
        return this.cache.get(pkg)[path] ?? this.cache.get(pkg)['@_/'+path];
    }

    async getBundle(pkg: string){
        const pkgJSON = await this.getPackageJSON(pkg);
        const isModule = pkgJSON.type === 'module' || pkgJSON.module;
        const items = await this.builder.build(pkg, isModule).catch(console.error);
        if (!items) return {};
        const bundle = {
            assets: [],
            deps: []
        };
        for (let key in items){
            bundle.assets.push({
                path: key,
                size: items[key].length,
                hash: await getHash(items[key])
            })
        }
        items['@_/bundle.json'] = JSON.stringify(bundle);
        this.cache.set(pkg, items);
        return items;
    }
}
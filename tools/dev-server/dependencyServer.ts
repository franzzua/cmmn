import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import mime from "mime-types";
import {RolldownDependencyBuilder} from "./rolldown-dependency-builder";
import {getHash} from "./asset-collection";
import {Target} from "../model/target";
import {FastifyInstance} from "fastify";
import {BundleJsonBuilder} from "./bundle.json.builder";

export class DependencyServer {
    base = '/_/@id'
    target: Target;
    optimizeDeps: string[];
    builder: RolldownDependencyBuilder;

    constructor(targets: Target[]) {
        this.target = targets.at(-1);
        this.optimizeDeps = [...new Set([
            ...targets.flatMap(t => t.externalDependencies),
            // '@vite/client',
            // '@react-refresh'
        ])].filter(x => targets.every(y => y.packageJson.name !== x));
        this.builder = new RolldownDependencyBuilder(this.optimizeDeps, this.base, this.target.flags.minify);
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
                const data = await this.getAsset(param);
                return data;
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
        const cached = this.cache.get(pkg)
        return cached[path];
    }

    async getBundle(pkg: string){
        const pkgJSON = await this.getPackageJSON(pkg);
        const isModule = pkgJSON.type === 'module' || pkgJSON.module;
        const bundle = await this.builder.build(pkg, isModule).catch(console.error);
        if (!bundle) return {};
        const bundleJson = {
            assets: [],
            deps: [...new Set(bundle.flatMap(output => output.deps))]
                .filter(x => x.package.startsWith('http'))
                .map(x => ({
                    baseURI: x.package,
                    path: x.path,
                })),
        };
        const result = {} as Record<string, string | Uint8Array>;
        for (let output of bundle){
            bundleJson.assets.push({
                path: output.fileName,
                size: output.data.length,
                hash: await getHash(output.data)
            });
            result[output.fileName.startsWith('@_/')
                ? output.fileName.substring(3)
                : output.fileName] = output.data;
        }
        result['bundle.json'] = JSON.stringify(bundleJson);
        this.cache.set(pkg, result);
    }
}
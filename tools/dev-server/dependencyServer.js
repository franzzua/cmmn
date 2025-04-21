import {DependencyBuilder} from "./dependency-builder.js";
import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import mime from "mime-types";

export class DependencyServer {
    base = '/_/@id'
    url;
    /**
     * @param targets {Array<import("../helpers/target").Target>}
     * @param mode {"development"|"production"}
     */
    constructor(targets, mode) {
        this.target = targets.at(-1);
        this.optimizeDeps = [...new Set([
            ...targets.flatMap(t => t.externalDependencies),
            // '@vite/client',
            // '@react-refresh'
        ])].filter(x => targets.every(y => y.packageJson.name !== x));
        this.builder = new DependencyBuilder(this.optimizeDeps, this.base, mode);
    }

    resolveId(id, importer, options) {
        if (id.startsWith(`${this.base}`))
            return `${this.url}${id}`;
        if (this.optimizeDeps.some(x => id.startsWith(x))) {
            return `${this.url}${this.base}/${id}`;
        }
    }

    async getPackageJSON(pkg) {
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
    async register(app) {
        app.get('/_/@id/*', async (req, res) => {
            try {
                let param = req.params['*'];
                let [pkg, path] = param.split('/_');
                path ??= '/';

                const pkgJSON = await this.getPackageJSON(pkg);
                const exports = pkgJSON.exports;
                if (exports && (`.${path}` in exports)){
                    pkg += path;
                    path = '/';
                }
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Content-Type', mime.lookup(path) || 'text/javascript');
                if (!this.cache.has(pkg)) {
                    const start = +performance.now();
                    const buffer = await this.builder.build(pkg, pkgJSON).catch(console.error);
                    const end = +performance.now();
                    this.target.log(`^Wbundle ^R${pkg} ^Wfor ^R${((end - start) / 1000).toFixed(2)}s`)
                    this.cache.set(pkg, buffer);
                }
                return this.cache.get(pkg)[path];
            } catch (e) {
                console.error(e);
                res.statusCode = 404;
                return e.toString();
            }
        });
    }
}
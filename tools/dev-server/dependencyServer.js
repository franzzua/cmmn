import {DependencyBuilder} from "./dependency-builder.js";
import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

export class DependencyServer {
    base = '/_/@id'
    url;
    /**
     * @param targets {Array<import("../helpers/target.js").Target>}
     * @param mode {"development"|"production"}
     */
    constructor(targets, mode) {
        this.optimizeDeps = [...new Set([
            ...targets.flatMap(t => Object.keys(t.packageJson.dependencies ?? {})),
        ])].filter(x => targets.every(y => y.packageJson.name !== x));
        this.builder = new DependencyBuilder(this.optimizeDeps, this.base, mode);
    }

    resolveId(id, importer, options) {
        if (this.optimizeDeps.some(x => id.startsWith(x))) {
            return `${this.url}${this.base}/${id}`;
        }
    }

    async getExports(pkg) {
        const resolved = import.meta.resolve(pkg);
        const file = fileURLToPath(resolved);
        let dir = path.dirname(file);
        while (true) {
            const packageJsonText = await fs.readFile(path.resolve(dir, 'package.json'), {encoding: 'utf-8'}).catch(() => null);
            if (packageJsonText)
                return JSON.parse(packageJsonText).exports;
            dir = path.resolve(dir, '..');
        }
    }

    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        const map = new Map();
        app.get('/node\\:*', async (req, res) => {
            res.header('Content-Type', "text/javascript");
            return '{}';
        });
        app.get('/_/@id/*', async (req, res) => {
            try {
                let param = req.params['*'];
                let [pkg, path] = param.split('/_');
                path ??= '/';
                const exports = await this.getExports(pkg);
                if (exports && (`.${path}` in exports)){
                    pkg += path;
                    path = '/';
                }
                if (path.endsWith('.wasm')){
                    res.header('Content-Type', "application/wasm");
                }else {
                    res.header('Content-Type', "text/javascript");
                }
                if (!map.has(pkg)) {
                    const buffer = await this.builder.build(pkg).catch(console.error);
                    map.set(pkg, buffer);
                }
                return map.get(pkg)[path];
            } catch (e) {
                console.error(e);
                res.statusCode = 404;
                return e.toString();
            }
        });
    }
}
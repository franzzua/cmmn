import {DependencyBuilder} from "./dependency-builder.js";
import {fileURLToPath} from "node:url";

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
        return this.optimizeDeps.some(x => id.startsWith(x))
            && `${this.url}${this.base}/${id}`;
    }

    /**
     * @param app {import("fastify/types/instance.js").FastifyInstance}
     * @returns {Promise<void>}
     */
    async register(app) {
        const map = new Map();
        app.get('/_/@id*', async (req, res) => {
            try {
                const [pkg, version] = req.url.substring('/_/@id:'.length)
                    .replace(/\?.*$/, '')
                    .split('@');
                res.header('Content-Type', "text/javascript");
                if (req.query.format !== 'es') {
                    const res = await import(pkg);
                    const exports = Object.keys(res);
                    const hasDefault = exports.includes('default');
                    return [
                        `import { __webpack_exports__ } from '${req.url}?format=es';`,
                        hasDefault ? 'export default __webpack_exports__;': '',
                        `export const {${exports.filter(x => x !== 'default').join(',')}} = __webpack_exports__;`,
                    ].join('\n')
                }
                const pkgPath = fileURLToPath(import.meta.resolve(pkg, process.cwd()));
                if (!map.has(pkgPath)) {
                    const buffer = await this.builder.build(pkgPath).catch(console.error);
                    map.set(pkgPath, buffer);
                }
                return map.get(pkgPath);
            } catch (e) {
                return e.toString();
            }
        });
    }
}
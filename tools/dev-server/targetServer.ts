import {Target} from "../helpers/target";
import {Resolver} from "./resolver";
import {FastifyInstance, FastifyRequest} from "fastify";

export abstract class TargetServer {

    base = `/${this.prefix}/${this.target.packageJson.name}`;
    url: string;

    constructor(protected target: Target, protected prefix: string, protected resolver: Resolver) {
    }
    resolveId = (id: string, importer: string, options) => {
        const path = id.match(new RegExp(`^\/?${this.target.packageJson.name}(?<path>.*)$`))?.groups.path;
        if (path === undefined)
            return null;
        const entry = this.target.getEntry("." + path);
        if (!entry) {
            this.target.error(`Entry not found for path: ${path}`);
            return
        }
        const relative = this.target.flags.production ? entry.output : entry.relative.substring(2);
        const resolvedId = `${this.url}${this.base}/${relative}`;
        return {
            id: resolvedId,
            external: true
        };
    }

    abstract register(app: FastifyInstance): Promise<void>

    public rewritePath(path: string, req: FastifyRequest) {
        if (!path.startsWith(this.base))
            return path;
        let file = path.substring(this.base.length);
        if (file.startsWith(`/@`)) return path;
        file = this.proxy(file, req) ?? file;
        if (file.startsWith(`/${this.prefix}`)) return file;
        file = this.resolvePath(file, req) ?? file;
        return this.base + file;
    }

    protected resolvePath(path: string, req: FastifyRequest): string | undefined {
        return undefined;
    }

    protected proxy(file: string, req: FastifyRequest) {
        const first = this.target.proxy.find(x => x.regex.test(file))
        if (!first) return file;
        const result = file.replace(first.regex, first.replace);
        this.target.log(`proxy ^B${file}^w by ^W${first.regex.toString().replaceAll('^','^^')} to ${result}`);
        return result;
    }
}
import {Target} from "../model/target";
import {Resolver} from "./resolver";
import {FastifyInstance, FastifyRequest} from "fastify";

export abstract class TargetServer {

    base = `/${this.prefix}/${this.target.packageJson.name}`;
    url: string;

    constructor(protected target: Target, protected prefix: string, protected resolver: Resolver) {
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
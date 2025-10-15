import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {Pack} from "../model/pack";
import mime from "mime-types";

export abstract class PackServer {
    constructor(protected pack: Pack) {

    }

    protected abstract handle(req: FastifyRequest, reply: FastifyReply): Promise<unknown>;

    async register(app: FastifyInstance) {
        app.get(this.pack.publicPath, (req, res) => {
            return this.handle(req, res);
        })
        app.get(this.pack.publicPath + '/*', (req, res) => {
            return this.handle(req, res);
        })
    }

    getMimeType(path: string){
        if (path.match(/\.([tj]sx?|cjs|mjs)$/))
            return 'application/javascript';
        return mime.lookup(path);
    }
}
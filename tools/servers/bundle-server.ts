import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {Bundle} from "../model/bundle";
import {PackServer} from "./pack-server";
import {IBundler} from "../bundlers/types";
import mime from "mime-types";
import {Pack} from "../model/pack";

export class BundleServer extends PackServer {

    constructor(pack: Pack, private bundler: IBundler) {
        super(pack)
    }

    private bundleRequest: Promise<Bundle>;
    protected async handle(request: FastifyRequest, reply: FastifyReply){
        const path = request.url.substring(this.pack.publicPath.length)
            .replace(/^\//, '')
            .split('?')[0];
        reply.type(this.getMimeType(path));
        // if (path.startsWith('/_/'))
        //     return reply.code(404).send('Not found');
        this.pack.log(
            `^B${request.method}^w ^B${path}^w`
        )
        const bundle = await (this.bundleRequest ??= this.bundler.bundle());
        if (path== "bundle.json")
            return JSON.stringify(await bundle.getBundleJson());
        const result = bundle.get(path) ?? await bundle.getPublicAsset(path);
        if (result === undefined)
            return reply.code(404).send('Not found');
        return result;
    }

}
import {FastifyReply, FastifyRequest} from "fastify";
import {Bundle} from "../model/bundle";
import {PackServer} from "./pack-server";
import {IBundler} from "../bundlers/types";

export class BundleServer implements PackServer{

    constructor(private bundler: IBundler) {
    }

    private bundleRequest: Promise<Bundle>;
    async handle(path: string, request: FastifyRequest, reply: FastifyReply){
        const bundle = await (this.bundleRequest ??= this.bundler.bundle());
        if (path == "bundle.json")
            return JSON.stringify(await bundle.getBundleJson());
        const result = bundle.get(path) ?? await bundle.getPublicAsset(path);
        if (!result)
            return reply.code(404).send('Not found');
        return result;
    }
}
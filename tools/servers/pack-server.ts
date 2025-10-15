import {FastifyReply, FastifyRequest} from "fastify";

export interface PackServer {
    handle(path: string, req: FastifyRequest, reply: FastifyReply): Promise<unknown>;
}
import type {FastifyInstance, FastifyServerOptions} from "fastify";
import {Container} from "@cmmn/core";
import {FastifyWrapper} from "./wrappers/FastifyWrapper.js";
import http from "http";

export class Server extends http.Server {
    private static container = new Container();
    private static wrapper: FastifyWrapper;

    static withFastify(fastify: (opts: FastifyServerOptions<Server>) => FastifyInstance) {
        this.wrapper = new FastifyWrapper(fastify({
            logger: true,
        }), this.container);
        return this;
    }

    static withControllers(...controllers){
        this.container.provide(controllers);
        return this;
    }
    static with(container: Container){
        this.container.provide(container.getProviders());
        return this;
    }

    static async start(port: number): Promise<ServerType> {
        const server = await this.wrapper.start(port);
        const ext = new Server();
        // @ts-ignore
        ext.__proto__ = Object.assign(server, ext.__proto__);
        return ext;
    }
}

export type ServerType = Server & http.Server;
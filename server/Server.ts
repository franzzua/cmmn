import type {FastifyInstance} from "fastify";
import {Container} from "@cmmn/core";
import {FastifyWrapper} from "./wrappers/FastifyWrapper";

export class Server {
    private container = new Container();
    private wrapper: FastifyWrapper;

    withFastify(fastify: FastifyInstance): this {
        this.wrapper = new FastifyWrapper(fastify, this.container);
        return this;
    }

    withControllers(...controllers){
        this.container.provide(controllers);
        return this;
    }

    async start(port: number) {
        await this.wrapper.start(port);
    }
}
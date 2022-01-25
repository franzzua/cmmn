import {FastifyInstance, HTTPMethods} from "fastify";
import {RouteInfo} from "../decorators/controller";
import {Container} from "@cmmn/core";

export class FastifyWrapper {

    constructor(private fastify: FastifyInstance, private container: Container) {
        for (let [controller, info] of RouteInfo) {
            for (let route of info.routes) {
                const path = [info.baseRoute, route.route].filter(x => x).join('/');
                console.warn(`register ${route.method}: ${path}`);
                fastify.route({
                    url: path,
                    method: route.method.toUpperCase() as HTTPMethods,
                    async handler(request, reply) {
                        const instance = container.get(controller);
                        return await route.action(instance)(request, reply);
                    }
                })
            }
        }
    }


    async start(port: number) {
        console.log('listen', port);
        await this.fastify.listen(port);
    }
}
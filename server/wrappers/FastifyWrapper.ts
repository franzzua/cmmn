import {FastifyInstance, HTTPMethods} from "fastify";
import {RouteInfo} from "../decorators/controller";
import {Container} from "@cmmn/core";
import wsPlugin from "fastify-websocket";
export class FastifyWrapper {

    constructor(private fastify: FastifyInstance, private container: Container) {
        fastify.register(wsPlugin);

        for (let [controller, info] of RouteInfo) {
            for (let route of info.routes) {
                const path = [info.baseRoute, route.route].filter(x => x).join('/');

                async function handler(request, reply) {
                    const instance = container.get(controller);
                    return await route.action(instance)(request, reply);
                };
                if (route.options.webSocket){
                    console.warn('register web socket', path);
                    // @ts-ignore
                    fastify.get(path, {websocket: true}, handler);
                }else {
                    console.warn(`register ${route.method}: ${path}`);
                    fastify.route({
                        url: path, handler,
                        method: route.method.toUpperCase() as HTTPMethods,
                    } as any);
                }
            }
        }
    }


    async start(port: number) {
        console.log('listen', port);
        await this.fastify.listen(port);
        return this.fastify.server;
    }
}
import type {FastifyInstance, HTTPMethods} from "fastify";
import {RouteInfo} from "../decorators/controller.js";
import {Container} from "@cmmn/core";

export class FastifyWrapper {

    constructor(private fastify: FastifyInstance, private container: Container) {
        for (let [controller, info] of RouteInfo) {
            for (let route of info.routes) {
                const path = [info.baseRoute, route.route].filter(x => x).join('/');
                if (route.options.webSocket){
                    console.warn('register web socket', path);
                    fastify.register(async function (fastify) {
                        fastify.get(path, {
                            // @ts-ignore
                            websocket: true,
                            exposeHeadRoute: false
                        }, function handler(connection, request) {
                            try {
                                const instance = container.get(controller);
                                route.action(instance)(connection, request);
                            } catch (e) {
                                // @ts-ignore
                                connection.send('exception: ' + e.message);
                                // @ts-ignore
                                connection.close();
                            }
                        });
                    });
                }else {
                    function handler(request, reply) {
                        const instance = container.get(controller);
                        return route.action(instance)(request, reply);
                    }
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
        await this.fastify.listen(port, '0.0.0.0');
        return this.fastify.server;
    }
}

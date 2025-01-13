import { FastifyInstance, HTTPMethods, fastify } from 'fastify';
import { routes } from './decorators';
import {Container} from "@cmmn/core";
import {HttpError} from "./http-error";

export function registerRoutes(app: FastifyInstance, authHandler, di: Container) {
	for (let x of routes) {
		console.log(`register [${x.method}]: ${x.route}`);
		app.route({
			method: x.method,
			url: x.route,
			preHandler:
				x.options.auth == 'optional'
					? (r) => authHandler(r).catch(() => null)
					: x.options.auth
						? authHandler
						: undefined,
			handler: async function (req, reply) {
				const container = di.child();
				try {
					// container.const(HttpContext, new HttpContext(req, reply));
					container.const(fastify, this);
					const instance = container.resolve(x.ctrl as never);
					const hasBody = !httpMethodsWithoutBody.includes(x.method);
					const result = await x.handler.call(
						instance,
						hasBody ? req.body : req.params,
						req,
						reply
					);
					if (!result) {
						return reply.status(204).send();
					}
					if (result instanceof Blob) {
						reply.type(result.type);
						reply.header('content-length', result.size);
						return reply.send(result.stream());
					}
					return result;
				} catch (e) {
					// container.resolve(Logger).send({
					// 	action: 'error',
					// 	data: {
					// 		path: req.routeOptions.url,
					// 		params: req.params,
					// 		stack: (e as Error).stack ?? '',
					// 	},
					// 	error: (e as Error).message ?? e,
					// });
					if (e instanceof HttpError)
						return reply.status(e.statusCode).send(e.message ?? e.toString());
					return reply.status((e as any).http_code ?? 422).send((e as Error).message ?? e);
				}
			},
		});
	}
}

const httpMethodsWithoutBody: Array<HTTPMethods> = [
	'get',
	'delete',
	'head',
	'GET',
	'DELETE',
	'HEAD',
];

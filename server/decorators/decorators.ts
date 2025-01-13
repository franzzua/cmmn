import { HTTPMethods } from 'fastify';

const routesSymbol = Symbol('routes');
function getRoutes(metadata: DecoratorMetadata) {
	return (metadata[routesSymbol] ??= []) as Array<{
		handler: Function;
		method: HTTPMethods;
		route: string;
		options: RouteOptions;
	}>;
}
export function request(method: HTTPMethods, route: string = '', options: RouteOptions = defaultRouteOptions) {
	return function (handler: Function, context: ClassMethodDecoratorContext) {
		getRoutes(context.metadata).push({
			handler,
			method,
			route,
			options,
		});
	};
}

export function ctrl(route: string) {
	return function (ctrl: unknown, context: ClassDecoratorContext) {
		routes.push(
			...getRoutes(context.metadata).map((x) => ({
				route: `/api/${route}${x.route}`,
				method: x.method,
				ctrl,
				handler: x.handler,
				options: x.options,
			}))
		);
	};
}
export function post(route: string = '', options: RouteOptions = defaultRouteOptions) {
	return request('post', route, options);
}
export function put(route: string = '', options: RouteOptions = defaultRouteOptions) {
	return request('put', route, options);
}
export function get(route: string = '', options: RouteOptions = defaultRouteOptions) {
	return request('get', route, options);
}


export type RouteOptions = {
	auth: boolean | 'optional';
};
const defaultRouteOptions: RouteOptions = {
	auth: true,
};
export const routes: Array<{
	ctrl: unknown;
	handler: Function;
	method: HTTPMethods;
	route: string;
	options: RouteOptions;
}> = [];

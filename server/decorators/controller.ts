import {getOrAdd} from "@cmmn/core";

export const RouteInfo = new Map<Object, RouteInfo>();

export function controller(baseRoute = '/'): ClassDecorator {
    return target => {
        getOrAdd(RouteInfo, target, x => ({
            baseRoute: undefined,
            routes: []
        })).baseRoute = baseRoute;
        return target;
    }
}


export function Route(route: string, method: string, options = {}): MethodDecorator {
    return <T extends Function>(target, key, descriptor) => {
        getOrAdd(RouteInfo, target.constructor, x => ({
            baseRoute: undefined,
            routes: []
        })).routes.push({
            method, route, options,
            action: instance => descriptor.value.bind(instance)
        });
    }
}

export function Put(route = '', options = {}): MethodDecorator {
    return Route(route, 'put', options);
}

export function Delete(route = '', options = {}): MethodDecorator {
    return Route(route, 'delete', options);
}

export function Post(route = '', options = {}): MethodDecorator {
    return Route(route, 'post', options);
}

export function Get(route = '', options = {}): MethodDecorator {
    return Route(route, 'get', options);
}


export type RouteInfo = {
    baseRoute: string,
    routes: {
        options: any,
        method: string,
        route: string,
        action(instance): (req, reply) => Promise<any> | void
    }[]
}
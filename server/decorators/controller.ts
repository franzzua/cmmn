export const RouteInfo = new Map<Object, RouteInfo>();

export function controller(baseRoute = '/'): ClassDecorator {
    return target => {
        RouteInfo.getOrAdd(target, x => ({
            baseRoute: undefined,
            routes: []
        })).baseRoute = baseRoute;
        return target;
    }
}

export function Route(route: string, method: string): MethodDecorator {
    return <T extends Function>(target, key, descriptor) => {
        RouteInfo.getOrAdd(target.constructor, x => ({
            baseRoute: undefined,
            routes: []
        })).routes.push({
            method, route,
            action: instance => descriptor.value.bind(instance)
        });
    }
}

export function Put(route = ''): MethodDecorator {
    return Route(route, 'put');
}

export function Delete(route = ''): MethodDecorator {
    return Route(route, 'delete');
}

export function Post(route = ''): MethodDecorator {
    return Route(route, 'post');
}

export function Get(route = ''): MethodDecorator {
    return Route(route, 'get');
}


export type RouteInfo = {
    baseRoute: string,
    routes: {
        method: string,
        route: string,
        action(instance): (req, reply) => Promise<any> | void
    }[]
}
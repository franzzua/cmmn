import {createRouter, Options, Route, RouteNode, Router as Router5, State as RouterState} from 'router5';
import browserPlugin from 'router5-plugin-browser';
import {Injectable} from "@cmmn/core";
import {Cell} from "@cmmn/cell";

export {RouterState, Route};

export class IRouterOptions {
    routes: Route[] | RouteNode;
    options: Options;
}

@Injectable()
export class Router {
    public router: Router5 = (() => {
        const router = createRouter(this.routerInit.routes, this.routerInit.options);
        router.usePlugin((browserPlugin as any)());
        router.start();
        router.subscribe(change => this.cell.set(change.route as RouterState))
        return router;
    })();
    private cell = new Cell<RouterState>(this.router.getState());

    constructor(private routerInit: IRouterOptions) {
    }

    public get Route(): Pick<RouterState, "name" | "params"> {
        return this.cell.get();
    }

    public get Path(): string {
        return this.cell.get().path;
    }

    public get RouteName(): string {
        return this.cell.get().name;
    }

    public set Route(value: Pick<RouterState, "name" | "params">) {
        this.router.navigate(value.name, value.params);
    }

    public get Query(): any {
        return this.cell.get().params;
    }

    destroy() {
        this.router.stop();
    }
}

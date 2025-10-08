import Route from "route-parser";
import {AsyncCell, BaseCell, cell} from "@cmmn/core";

export class Router<TRoute extends string = string, TData extends BaseRouteData = BaseRouteData> {
	protected location = new LocationCell();

	constructor(protected base: string) {
	}
	@cell()
	private get currentRoute(): {
		route: TRoute;
		data: TData;
		params: Record<string, string>;
		url: URL;
	} {
		const url = this.location.get();
		for (let [id, { route, data }] of this.routes) {
			if (url.pathname.endsWith('/'))
				url.pathname = url.pathname.substring(0, url.pathname.length - 1);
			const match = route.match(url.pathname + url.search);
			if (!match) continue;

			return {
				route: id,
				data,
				url,
				params: match
			}
		}
	}

	protected activatedRoute = AsyncCell.query(() => this.activate(this.currentRoute))

	@cell()
	protected accessor routes = new Map<TRoute, {
		route: Route,
		data: TData
	}>();

	public addRoute(route: TRoute, data: TData = undefined){
		this.routes.set(route, {
			data, route: new Route(this.base + data.route)
		});
	}

	public async go(route: TRoute, params: Record<string, string | number> = {}, data = {}){
		const res = this.routes.get(route);
		if (!res)
			throw new Error(`Route ${route} not registered`);
		const path = res.route.reverse(params);
		if (!path)
			throw new Error(`Route ${route} not accept params ${JSON.stringify(params)}`);
		this.location.goTo(new URL(path, location.origin));
	}

	protected async activate(){
		if (!this.currentRoute) return null;
		await this.currentRoute.data.load?.(this.currentRoute.params)
		if (await this.currentRoute.data.guard?.(this.currentRoute.params) === false){
			return null;
		}
		return this.currentRoute;
	}
}

export type BaseRouteData = {
	route: string;
	load?(params: Record<string, string>): Promise<void>;
	guard?(params: Record<string, string>): Promise<boolean>;
}

class LocationCell extends BaseCell<URL> {
	private abort: AbortController;
	constructor() {
		super(new URL(location.href));
	}

	active() {
		super.active();
		this.abort?.abort();
		this.abort = new AbortController();
		window.addEventListener('popstate', (evt) => {
			this.set(new URL(location.href));
		}, this.abort);
	}

	protected disactive() {
		super.disactive();
		this.abort?.abort();
		this.abort = null;
	}

	goTo(url: URL){
		this.set(url);
		window.history.pushState(null, '', url);
	}
}
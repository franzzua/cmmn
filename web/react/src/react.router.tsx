import {Router, BaseRouteData} from "@cmmn/ui";
import {FC} from "react";

export class ReactRouter<TRoute extends string> extends Router<TRoute, ReactRouteData> {
	public static fromTable<TRoute extends string>(table: Record<TRoute, ReactRouteData | FC | {
		loadFC(): Promise<FC>
	}>, base: string) {
		const result = new ReactRouter<TRoute>(base);
		for (let [route, data] of Object.entries(table)) {
			if (typeof data === "function")
				data = { fc: data } as ReactRouteData;
			if (!data.fc && data.loadFC){
				data.load = async () => {
					data.fc = await data.loadFC()
				}
			}
			result.addRoute(route as TRoute, data as ReactRouteData);
		}
		return result;
	}

	public get Current(){
		const current = this.activatedRoute.result;
		if (!current) return 'Loading...';
		return (<current.data.fc {...current.params}/>)
	}
}

export type ReactRouteData = BaseRouteData & {
	fc: FC;
};
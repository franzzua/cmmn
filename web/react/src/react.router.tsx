import {Router, BaseRouteData} from "@cmmn/ui";
import {FC} from "react";

export class ReactRouter<TRoute extends string> extends Router<TRoute, ReactRouteData> {
	public static fromTable<TRoute extends string>(table: {
		[route in TRoute]: ReactRouteData | FC | { loadFC(): Promise<FC> }
	}, base: string) {
		const result = new ReactRouter<TRoute>(base);
		for (let [route, data] of Object.entries(table)) {
			if (typeof data === "function")
				data = { fc: data } as ReactRouteData;
			const info = data as ReactRouteData & { loadFC(): Promise<FC> };
			if (!info.fc && info.loadFC){
				info.load = async () => {
					info.fc = await info.loadFC()
				}
			}
			result.addRoute(route as TRoute, info);
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
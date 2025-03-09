import {type InjectionToken} from "@cmmn/core";
import {useMemo, useEffect} from "react";
import {di} from "@cmmn/core";

export function useInjected<T, TArgs extends unknown[] = []>(token: InjectionToken<T, TArgs>, deps: TArgs = [] as TArgs): T {
	const result = useMemo(() => di.resolve<T, TArgs>(token, ...deps), deps);
	useEffect(() => {
		result
	}, []);
	return result;
}
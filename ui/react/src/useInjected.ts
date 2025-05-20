import {Container, type InjectionToken} from "@cmmn/core";
import {useMemo, useEffect, useContext} from "react";
import {DIContext} from "./DIContext";

export function useInjected<T, TArgs extends unknown[] = []>(token: InjectionToken<T, TArgs>, deps: TArgs = [] as TArgs): T {
	const di = useContext(DIContext);
	return useInjectedFrom(di, token, deps);
}

export function useInjectedFrom<T, TArgs extends unknown[] = []>(di: Container, token: InjectionToken<T, TArgs>, deps: TArgs = [] as TArgs): T {
	const result = useMemo(() => di.resolve<T, TArgs>(token, ...deps), deps);
	useEffect(() => {
		// token is scoped to container therefore container is responsible for disposing this token
		if (!di.isScoped(token)){
			return () => {
				result[Symbol.dispose]?.();
				result[Symbol.asyncDispose]?.();
			}
		}
	}, []);
	return result;
}
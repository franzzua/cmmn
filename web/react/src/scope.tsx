import {InjectionToken} from "@cmmn/core";
import {ReactNode, useContext, useMemo} from "react";
import {DIContext} from "./di.context";

export type InjectionParams<T> = T extends InjectionToken<unknown, infer TArgs> ? (
	TArgs extends [] ? T : [T, ...TArgs]
) : never;
export type ScopeProps = {
	children: ReactNode;
	provide: InjectionParams<any>
}
export function Scope(props: ScopeProps) {
	const di = useContext(DIContext);
	const child = useMemo(() => {
		const child = di.child();
		if (!Array.isArray(props.provide)) {
			child.scoped(props.provide);
		} else {
			const [token, ...args] = props.provide;
			child.scoped(token, ...args);
		}
		return child;
	}, [di]);
	return <DIContext.Provider value={child}>
		{props.children}
	</DIContext.Provider>
}
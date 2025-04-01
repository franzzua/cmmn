import {ReactNode, useContext, useEffect, useMemo} from "react";
import {DIContext} from "./DIContext";
import {Component} from "./component";

export function ChildContainer(props: { children: ReactNode }) {
	const di = useContext(DIContext);
	const child = useMemo(() => di.child(), [di]);
	useEffect(() => {
		child[Symbol.asyncDispose]()
	}, [child]);
	return <DIContext.Provider value={child}>
		<Component {...props}/>
	</DIContext.Provider> as ReactNode;
}
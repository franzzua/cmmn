import {ForwardRefRenderFunction, useMemo} from "react";
import {Cell} from "@cmmn/core";

export function celled<T, P>(component: ForwardRefRenderFunction<T, P>, options: {} = {}){
    const celledComponent = (props, context) => {

        const cell = useMemo(() => new Cell(() => component(props, context)), [])
    }
}
import "./reflect";
import {Container} from "./container";

export function Injectable(multiple: boolean = false): (target: any) => void {
    return ((target: any) => {
        const deps = Reflect.getMetadata("design:paramtypes", target) ?? [];
        Container.StaticDepsMap.set(target, ({
            deps: deps,
            multiple
        }));
    }) as (target: any) => void;
}


export const Inject: (token: any) => ParameterDecorator = (injectionToken) => {
    return (target, deps, index) => {
        if (!Container.StaticDepsMap.has(target)) {
            Container.StaticDepsMap.set(target, {deps: [], multiple: false});
        }
        Container.StaticDepsMap.get(target)!.deps[index] = injectionToken;
    };
}


import {Container} from "./container";
import {getMetadata} from "./reflect";

export function Injectable(multiple: boolean = false): (target: any) => void {
    return ((target: any) => {
        const deps = getMetadata("design:paramtypes", target) ?? [];
        const data = Container.StaticDepsMap.getOrAdd(target, () => ({
            deps: [],
            multiple: false
        }));
        if (data.deps){
            for(let i = 0; i < data.deps.length; i++){
                if (data.deps[i])
                    deps[i] = data.deps[i];
            }
        }
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


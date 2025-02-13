import { Container } from "./container";
import { ConstructorOf } from "./types";
import * as console from "node:console";

export const inject =
    <T>(dep: ConstructorOf<T, any[]> | Symbol) => {
        return (initial: T | undefined, ctx: ClassFieldDecoratorContext | ClassAccessorDecoratorContext) => {
            if (ctx.kind == 'field')
                return function (this: any) {
                    return resolve(dep) as T;
                };
            if (ctx.kind == 'accessor'){
                return {
                    init(){
                        return resolve(dep);
                    }
                }
            }
        };
    };

export function singleton<TClass extends ConstructorOf<any>>() {
    return function (target: any, context: ClassDecoratorContext<TClass>) {
        di.factory(target, () => new target());
    };
}

export function factory<T>(dep: ConstructorOf<T>, factory: (c: Container) => T) {
    di.factory(dep, factory);
}

// const singletons = new Set<ConstructorOf<any>>();

export const di = Container.Default;
export const resolve = <T>(dep: ConstructorOf<T> | Symbol) => Container.Default.resolve(dep);
export { Container };
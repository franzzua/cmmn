import { Container } from "./container";
import { ConstructorOf } from "./types";

export const inject =
    <T>(dep: ConstructorOf<T, any[]> | Symbol) =>
        (initial: T | undefined, ctx: ClassFieldDecoratorContext) =>
            function (this: any) {
                return resolve(dep) as T;
            };

export function singleton<TClass extends ConstructorOf<any>>() {
    return function (target: any, context: ClassDecoratorContext<TClass>) {
        defaultContainer.factory(target, () => new target());
    };
}

export function factory<T>(dep: ConstructorOf<T>, factory: (c: Container) => T) {
    defaultContainer.factory(dep, factory);
}

// const singletons = new Set<ConstructorOf<any>>();

export const defaultContainer = Container.Default;
export const resolve = <T>(dep: ConstructorOf<T> | Symbol) => Container.Default.resolve(dep);

import {Provider, ProviderOrValue} from "./types";
import {Store} from "./store";

export class Container {

    public static StaticDepsMap: Map<any, { deps: any[], multiple: boolean }> = new Map();

    constructor() {
    }

    private store = new Store();


    public getProviders() {
        return this.store.getProviders()
            .map(provider => {
                if (!provider.provide)
                    provider = {provide: provider};
                if (!provider.useClass && !provider.useValue && !provider.useFactory)
                    provider.useClass = provider.provide;
                if (Container.StaticDepsMap.has(provider.useClass)) {
                    const {deps, multiple} = Container.StaticDepsMap.get(provider.useClass);
                    provider.deps = deps;
                    provider.multiple = multiple;
                }
                return provider;
            });
    }

    public get<T>(target: any, overrides: Provider[] = []): T {
        if (target === Container)
            return this as unknown as T;
        const existing = overrides.find(x => x.provide == target) ?? this.store.find(target);
        try {
            return this.resolve(existing, overrides);
        }catch (e){
            const err = new Error(`Could not resolve provider ${target}`);
            err.cause = e;
            // @ts-ignore
            err.original_error = e;
            err.stack = err.stack.split('\n').slice(0,2).join('\n') + '\n' +
                e.stack
            throw err;
        }
    }

    public static withProviders(...providers: ProviderOrValue[]) {
        const result = new Container();
        result.provide(providers);
        return result;
    }

    public provide(providers: ProviderOrValue[] | Container) {
        if (providers instanceof Container) {
            this.store.register(providers.store);
        } else {
            providers.forEach(p => this.store.register(p));
        }
    }

    private getInjectionInfo(classInfo): { deps, multiple } {
        if (classInfo === Function.prototype)
            return null;
        return Container.StaticDepsMap.get(classInfo) ?? Container.StaticDepsMap.get(Object.getPrototypeOf(classInfo));
    }

    private resolve(provider: Provider, overrides: Provider[]) {
        if ('useValue' in provider)
            return provider.useValue;
        if (!provider.useClass) {
            provider.useClass = provider.provide;
        }
        if (!provider.deps) {
            Object.assign(provider, this.getInjectionInfo(provider.useClass));
        }

        if (provider.useFactory){
            const instance = provider.useFactory(this);
            if (!provider.multiple) {
                provider.useValue = instance;
            }
            return instance;
        }
        if (provider.useClass && typeof provider.useClass === "function") {
            if (!provider.deps) {
// console.warn('no deps in provider', provider.provide, provider.useClass);
                provider.deps = (provider.useClass && provider.useClass.deps) || provider.provide.deps || [];
            }
            const deps = provider.deps.map(dep => {
                return this.get(dep, overrides);
            });
            const instance = new provider.useClass(...deps);
            if (!provider.multiple) {
                provider.useValue = instance;
            }
            return instance;
        }
        throw new Error(`Could not resolve provider ${JSON.stringify(provider)}`)
    }
}

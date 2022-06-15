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
        return this.resolve(existing, overrides);
    }

    public static withProviders(...providers: ProviderOrValue[]) {
        const result = new Container();
        result.provide(providers);
        return result;
    }

    public withProviders(...providers: ProviderOrValue[]) {
        return Container.withProviders(...this.getProviders(), ...providers);
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
        if (provider.useValue)
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
        if (provider.useClass) {
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
        throw new Error('need useClass or useValue')
    }
}

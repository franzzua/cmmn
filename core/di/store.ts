import {Provider, ProviderOrValue} from "./types";


export class Store {


    private readonly providers: Provider[] = [];

    constructor(global = false) {
        if (!global) {
            this.providers = [...GlobalStore.providers];
        }
    }



    register(provider: ProviderOrValue | Store) {
        if (provider instanceof Store) {
            provider.providers.forEach(p => this.register(p));
        } else {
            if (!('provide' in provider))
                provider = {provide: provider};
            this.providers.push(provider);
            return provider;
        }
    }

    find(type: any) {
        let result = this.providers.filter(p => p.provide == type).pop();
        if (!result){
            this.providers.push(result = {provide: type});
        }
        return result;
    }

    public getProviders() {
        return this.providers;
    }
}

export const GlobalStore = new Store(true);
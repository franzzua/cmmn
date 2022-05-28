import {Container, Provider, ProviderOrValue} from "@cmmn/core";
import {IRouterOptions, Router} from "./router";
import {setDefaultContainer} from "@cmmn/ui";

export class Builder{
    private container: Container = new Container();

    constructor() {
    }

    public withUI(components:  ProviderOrValue[] | Container){
        this.container.provide(components);
        return this;
    }
    public with(container: Container){
        this.container.provide(container);
        return this;
    }

    public withRoutes(options: IRouterOptions){
        this.container.provide([{
            provide: IRouterOptions, useValue: options
        }, Router]);
        return this;
    }

    build<T>(app: {
        new(...args: any[]): T
    }):T {
        this.container.provide([app]);
        setDefaultContainer(this.container);
        return this.container.get<T>(app)
    }
}

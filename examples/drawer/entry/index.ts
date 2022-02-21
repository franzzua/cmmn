import {Application, Builder} from "@cmmn/app";
import {AppRootComponent} from "../app-root/app-root.component";
import "../drawer";
import {AppDrawerComponent} from "../drawer";
import {StoreFactory} from "../services/store.factory";
import {ModelProxy, proxy, useWorkerDomain} from "@cmmn/domain/proxy";

async function build() {
    return new Builder()
        .with(await useWorkerDomain('./worker-umd.js'))
        // .with(InfrContainer)
        // .with(DomainContainer)
        // .with(Container.withProviders(
        //     RouterService,  TreeReducers, TreePresenter, DomainProxy, AccountManager
        // ))
        .withUI(AppRootComponent, AppDrawerComponent, StoreFactory)
        // .withRoutes({
        //     options: null,
        //     routes: Routes
        // })
        .build(Application);

}

const app = build();

import {Application, Builder} from "@cmmn/app";
import {AppRootComponent} from "../ui/app-root/app-root.component";
import "../ui/drawer";
import {AppDrawerComponent} from "../ui/drawer";

async function build()
{
    return new Builder()
        // .with(InfrContainer)
        // .with(DomainContainer)
        // .with(Container.withProviders(
        //     RouterService,  TreeReducers, TreePresenter, DomainProxy, AccountManager
        // ))
        .withUI(AppRootComponent, AppDrawerComponent)
        // .withRoutes({
        //     options: null,
        //     routes: Routes
        // })
        .build(Application);

}

const app = build();

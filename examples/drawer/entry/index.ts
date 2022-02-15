import {Application, Builder} from "@cmmn/app";
import {DrawingContainer} from "../ui/drawer";
import {AppRootComponent} from "../ui/app-root/app-root.component";

async function build()
{
    return new Builder()
        // .with(InfrContainer)
        // .with(DomainContainer)
        // .with(Container.withProviders(
        //     RouterService,  TreeReducers, TreePresenter, DomainProxy, AccountManager
        // ))
        .with(DrawingContainer)
        .withUI(AppRootComponent)
        // .withRoutes({
        //     options: null,
        //     routes: Routes
        // })
        .build(Application);

}

const app = build();

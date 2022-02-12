import {Application, Builder} from "@cmmn/app";
import {AppRootComponent} from "../ui/app-root/app-root.component";
import {DrawingContainer} from "../ui/drawer";
import {useWorkerDomain} from "@cmmn/domain/proxy";

async function build()
{
    return new Builder()
        // .with(InfrContainer)
        // .with(DomainContainer)
        .with(await useWorkerDomain("./worker.js"))
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

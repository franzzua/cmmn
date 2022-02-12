import {Container} from "@cmmn/core";
import {DrawingStore} from "./drawing.store";
import {AppDrawerComponent} from "./app-drawer/app-drawer.component";
import {PointDrawerComponent} from "./point-drawer/point-drawer.component";
import {LineDrawerComponent} from "./line-drawer/line-drawer.component";

export const DrawingContainer = Container.withProviders(
    DrawingStore,
    AppDrawerComponent,
    PointDrawerComponent, LineDrawerComponent
)

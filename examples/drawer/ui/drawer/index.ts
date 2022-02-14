import {Container} from "@cmmn/core";
import {DrawingStore} from "./drawing.store";
import {AppDrawerComponent} from "./app-drawer/app-drawer.component";
import {PointDrawerComponent} from "./creators/point-drawer/point-drawer.component";
import {LineFigureComponent} from "./presentors/line-figure/line-figure.component";
import {LineDrawerComponent} from "./creators/line-drawer/line-drawer.component";
import {PointEditorComponent} from "./editors/point-editor/point-editor.component";
import {PointFigureComponent} from "./presentors/point-figure/point-figure.component";
import {CreatorService} from "./services/creator.service";
import {HoverService} from "./services/hover.service";
import {SelectionService} from "./services/selection.service";

export const DrawingContainer = Container.withProviders(
    DrawingStore,
    CreatorService,
    HoverService,
    SelectionService,
    AppDrawerComponent,
    LineFigureComponent,
    PointFigureComponent,
    PointDrawerComponent,
    LineDrawerComponent,
    PointEditorComponent
)

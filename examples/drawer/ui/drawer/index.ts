import {AppDrawerComponent} from "./app-drawer/app-drawer.component";
import "./presentors/line-figure/line-presentor";
import "./presentors/point-figure/point-figure.component";
import {LinePresentor} from "./presentors/line-figure/line-presentor";
import {PointFigureComponent} from "./presentors/point-figure/point-figure.component";
import {LineDrawerComponent} from "./creators/line-drawer/line-drawer.component";
import {PointDrawerComponent} from "./creators/point-drawer/point-drawer.component";

const components = [
    LinePresentor,
    PointFigureComponent,
    LineDrawerComponent,
    PointDrawerComponent
]

export {AppDrawerComponent}

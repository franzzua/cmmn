import {AppDrawerComponent} from "./app-drawer/app-drawer.component";
import "./presentors/line-figure/line-presentor";
import "./presentors/point-figure/point-presentor.service";
import {LinePresentor} from "./presentors/line-figure/line-presentor";
import {PointPresentor} from "./presentors/point-figure/point-presentor.service";
import {LineDrawerComponent} from "./creators/line-drawer/line-drawer.component";
import {PointDrawerComponent} from "./creators/point-drawer/point-drawer.component";

const components = [
    LinePresentor,
    PointPresentor,
    LineDrawerComponent,
    PointDrawerComponent
]

export {AppDrawerComponent}

import {Observable} from "cellx-decorators";
import {DrawingFigureBase} from "./drawing-figure-base";
import {DrawingItemType, IPoint, PointInfo, PointItem} from "../drawing.store";
import {SelectionService} from "../services/selection.service";

export class PointFigure extends DrawingFigureBase {
    constructor(point: PointItem) {
        super(point);
        this.figure = point.figure;
    }

    type: DrawingItemType.point = DrawingItemType.point;
    id: string;
    @Observable
    figure: IPoint;
    @Observable
    hover: null | {} = null;
    @Observable
    selection: null | {} = null;

    move(shift: IPoint) {
        this.figure = {
            X: this.figure.X + shift.X,
            Y: this.figure.Y + shift.Y
        };
    }
}

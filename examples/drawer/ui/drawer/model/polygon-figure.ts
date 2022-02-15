import {DrawingFigureBase} from "./drawing-figure-base";
import {DrawingItemType, IPoint, PointInfo} from "../drawing.store";
import {Observable} from "cellx-decorators";
import {Fn} from "@cmmn/core/helpers/Fn";

export class PolygonFigure extends DrawingFigureBase {
    type: DrawingItemType.polygone = DrawingItemType.polygone;
    id: string;
    @Observable
    figure: IPoint[][];
    @Observable
    hover: null | PointInfo = null;
    @Observable
    selection: null | PointInfo = null;

    move(shift: IPoint, index?: number, contour?: number) {
        if (contour === undefined) {
            this.figure = this.figure.map(points => points.map(p => ({
                X: p.X + shift.X,
                Y: p.Y + shift.Y
            })));
        }
        if (index === undefined) {
            this.figure = this.figure.map(points => points.map(p => ({
                X: p.X + shift.X,
                Y: p.Y + shift.Y
            })));
        }
    }

    public with(point: IPoint): PolygonFigure {
        return new PolygonFigure({
            type: 'polygon',
            id: this.id,
            figure: [
                ...this.figure.slice(0, -1),
                [
                    ...this.figure[this.figure.length - 1],
                    point
                ]
            ]
        })
    }


}

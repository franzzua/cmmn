import {DrawingFigureBase} from "./drawing-figure-base";
import {Observable} from "cellx-decorators";
import {Fn} from "@cmmn/core/helpers/Fn";
import {DrawingItemType, IPoint, PointInfo} from "../types";

export class PolygonFigure extends DrawingFigureBase {

    constructor(id: string, contours: IPoint[][]) {
        super(id);
        this.figure = contours;
    }

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

    public toJson() {
        return {
            id: this.id,
            type: this.type,
            figure: this.figure
        };
    }
}

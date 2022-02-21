import {Observable} from "cellx-decorators";
import {DrawingFigureBase} from "./drawing-figure-base";
import {DrawingFigureJson, DrawingItemType} from "../types";
import {IPoint} from "@cmmn/ui";

export class PointFigure extends DrawingFigureBase {
    constructor(id: string, point: IPoint) {
        super(id);
        this.figure = point;
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
    public toJson() {
        return {
            id: this.id,
            type: this.type,
            figure: this.figure
        };
    }
    public fromJson(json: DrawingFigureJson) {
        this.figure = json.figure as IPoint;
    }

}
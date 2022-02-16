import {Observable} from "cellx-decorators";
import {DrawingFigureBase} from "./drawing-figure-base";
import {ObservableList} from "cellx-collections";
import {DrawingItemType, IPoint, PointInfo} from "../types";

export class LineFigure extends DrawingFigureBase {
    constructor(id: string, figure: IPoint[]) {
        super(id);
        this.figure = new ObservableList<IPoint>(figure);
    }

    type: DrawingItemType.line = DrawingItemType.line;
    id: string;
    @Observable
    figure: ObservableList<IPoint>;
    @Observable
    hover: null | PointInfo = null;
    @Observable
    selection: null | PointInfo = null;

    public toJson() {
        return {
            id: this.id,
            type: this.type,
            figure: this.figure.toArray()
        }
    }
}


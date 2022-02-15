import {Observable} from "cellx-decorators";
import {DrawingFigureBase} from "./drawing-figure-base";
import {DrawingItemType, IPoint, LineItem, PointInfo} from "../drawing.store";
import {ObservableList} from "cellx-collections";

export class LineFigure extends DrawingFigureBase {
    constructor(item: LineItem) {
        super(item);
        this.figure = new ObservableList<IPoint>(item.figure);
    }

    type: DrawingItemType.line = DrawingItemType.line;
    id: string;
    @Observable
    figure: ObservableList<IPoint>;
    @Observable
    hover: null | PointInfo = null;
    @Observable
    selection: null | PointInfo = null;

}


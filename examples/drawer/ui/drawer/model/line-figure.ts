import {Observable} from "cellx-decorators";
import {DrawingFigureBase} from "./drawing-figure-base";
import {ObservableList} from "cellx-collections";
import {DrawingFigureJson, DrawingItemType, PointInfo} from "../types";
import {Fn} from "@cmmn/core";
import {IPoint} from "@cmmn/ui";

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

    public fromJson(json: DrawingFigureJson) {
        const newPoints = json.figure as IPoint[];
        const changeType = newPoints.length > this.figure.length ? 'add' :
            newPoints.length < this.figure.length ? 'remove' : 'update';
        switch (changeType) {
            case "update":
                for (let i = 0; i < this.figure.length; i++) {
                    if (Fn.compare(this.figure.get(i), newPoints[i]))
                        continue;
                    this.figure.set(i, newPoints[i]);
                }
                break;
            case "add":
                for (let i = 0; i < newPoints.length; i++) {
                    if (Fn.compare(this.figure.get(i), newPoints[i]))
                        continue;
                    this.figure.insert(i, newPoints[i]);
                }
                if (newPoints.length < this.figure.length)
                    this.figure.removeRange(newPoints.length, this.figure.length - newPoints.length);
                break;
            case "remove":
                for (let i = 0; i < this.figure.length; i++) {
                    if (Fn.compare(this.figure.get(i), newPoints[i]))
                        continue;
                    this.figure.removeRange(i, 1);
                }
                if (newPoints.length > this.figure.length)
                    this.figure.addRange(newPoints.slice(this.figure.length));
                break;
        }
        const length = Math.max(newPoints.length, this.figure.length);

    }

    public addPoint(point: IPoint) {
        if (!this.hover?.segment)
            return;
        this.figure.insert(this.hover.segment[1], point);
        this.hover.index = this.hover.segment[1];
        this.hover.segment = undefined;
        this.selection = this.hover;
    }
}


import {Fn, Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {ObservableList} from "cellx-collections";
import {Mode} from "./types";
import {DrawingFigure} from "./model";
import {LineFigure} from "./model/line-figure";

@Injectable()
export class DrawingStore {

    constructor() {
        this.Items.add(new LineFigure({
            type: 'line',
            id: Fn.ulid(),
            figure: [
                {X: 100, Y: 100},
                {X: 200, Y: 200},
                {X: 300, Y: 100},
                {X: 300, Y: 200},
            ]
        }))
    }

    public async add(item: DrawingFigure) {
        await Promise.resolve();
        this.Items.add(item);
    }

    @Observable
    Mode: Mode = Mode.line;

    @Observable
    Items = new ObservableList<DrawingFigure>();

}


export enum DrawingItemType {
    point,
    line,
    polygone
}

export type DrawingItem = PointItem | LineItem | PolygonItem;

export type PointItem = {
    type: 'point';
    id: string;
    figure: IPoint;
}
export type LineItem = {
    type: 'line';
    id: string;
    figure: IPoint[]
}
export type PolygonItem = {
    type: 'polygon';
    id: string;
    figure: IPoint[][]
}


export type IPoint = {
    X: number;
    Y: number;
}

export type PointInfo = {
    index?: number;
    contour?: number
}

import {Fn, Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {DrawingFigureJson, IPoint, Mode} from "../drawer/types";
import {LineFigure} from "../drawer/model/line-figure";
import {SyncStore} from "@cmmn/sync";

@Injectable()
export class DrawingStore extends SyncStore<DrawingFigureJson> {

    constructor() {
        super();
        const figure = new LineFigure(Fn.ulid(), [
            {X: 100, Y: 100},
            {X: 200, Y: 200},
            {X: 300, Y: 100},
            {X: 300, Y: 200},
        ]);
        this.Items.set(figure.id, figure.toJson());
    }

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



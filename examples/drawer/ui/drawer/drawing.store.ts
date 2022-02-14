import {Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {ObservableList} from "cellx-collections";
import {Pointer} from "@cmmn/ui";
import {Mode} from "./types";

@Injectable()
export class DrawingStore {

    constructor() {

    }

    public async add(item: DrawingItem) {
        await Promise.resolve();
        this.Items.add(item);
    }

    @Observable
    Mode: Mode = Mode.line;

    @Observable
    Items = new ObservableList<DrawingItem>();

}

export type DrawingItem = PointItem | LineItem | PolygonItem;

export type PointItem = {
    type: 'point';
    id: string;
    figure: IPoint
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

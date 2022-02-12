import {Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {ObservableList} from "cellx-collections";
import {Pointer} from "@cmmn/ui";

@Injectable()
export class DrawingStore {

    constructor() {
    }

    public add(item: DrawingItem): any {
        this.Items.add(item)
    }

    @Observable
    Items = new ObservableList()
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

import {Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {ObservableList} from "cellx-collections";
import {Pointer} from "@cmmn/ui";
import {Mode} from "./types";

@Injectable()
export class DrawingStore {

    constructor() {
        document.addEventListener('keydown', e => {
            console.log(e.code)
            switch (e.code) {
                case "Escape":
                    this.CreatingItem = null;
                    this.Mode = Mode.idle;
                    break;
                case "Enter":
                case "NumpadEnter":
                    this.create();
                    this.CreatingItem = null;
                    break;
            }
        })
    }

    public async add(item: DrawingItem) {
        await Promise.resolve();
        this.Items.add(item);
    }

    @Observable
    Mode: Mode = Mode.line;

    @Observable
    Items = new ObservableList<DrawingItem>();

    @Observable
    CreatingItem: DrawingItem;

    get CreatingItemWithLastPosition(): DrawingItem {
        if (!Pointer.Position || !this.CreatingItem)
            return this.CreatingItem;
        const point = {
            X: Pointer.Position.x,
            Y: Pointer.Position.y,
        };
        switch (this.CreatingItem.type) {
            case "point":
                return {
                    ...this.CreatingItem,
                    figure: point
                };
            case "line":
                return {
                    ...this.CreatingItem,
                    figure: [
                        ...this.CreatingItem.figure,
                        point
                    ]
                };
            case "polygon":
                return {
                    ...this.CreatingItem,
                    figure: [
                        ...this.CreatingItem.figure.slice(0, -1),
                        [
                            ...this.CreatingItem.figure.slice(-1)[0],
                            point
                        ]
                    ]
                };
        }
    }

    public create(): void {
        this.add(this.CreatingItemWithLastPosition);
    }
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

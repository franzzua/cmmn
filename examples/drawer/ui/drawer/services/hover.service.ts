import {bind, Injectable} from "@cmmn/core";
import {DrawingItem, DrawingStore, IPoint, LineItem} from "../drawing.store";
import {Pointer} from "@cmmn/ui";
import {Const} from "../const";
import {Mode} from "../types";

@Injectable()
export class HoverService {
    constructor(private store: DrawingStore) {

    }

    public get HoveredItems() {
        if (!Pointer.Position)
            return [];
        return this.store.Items.filter(this.check)
    }

    @bind
    public check(item: DrawingItem) {
        if (this.store.Mode !== Mode.idle)
            return false;
        switch (item.type) {
            case "point":
                return this.checkPoint(item.figure);
            case "line":
                return this.checkLine(item);
        }
        return false;
    }

    @bind
    public checkPoint(point: IPoint) {
        if (!point || !Pointer.PositionPoint)
            return false;
        return Math.abs(Pointer.PositionPoint.X - point.X) < Const.hoverRadius &&
            Math.abs(Pointer.PositionPoint.Y - point.Y) < Const.hoverRadius;
    }

    private checkLine(item: LineItem) {
        if (!item.figure || !Pointer.PositionPoint)
            return false;
        return item.figure.some(this.checkPoint);
    }

    public getHoveredPointIndex(item: DrawingItem): number | null {
        if (!item)
            return null;
        switch (item.type) {
            case "line":
                return item.figure
                    .map((point, index) => this.checkPoint(point) ? index : null)
                    .find(x => x !== null)
        }
    }

}


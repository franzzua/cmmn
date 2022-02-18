import {Fn, Injectable} from "@cmmn/core";
import {IPoint, Pointer} from "@cmmn/ui";
import { Computed } from "cellx-decorators";
import {Const} from "../const";
import {DrawingFigure} from "../model";
import {LineFigure} from "../model/line-figure";
import {PolygonFigure} from "../model/polygon-figure";
import {DrawingItemType, PointInfo} from "../types";
import {DrawingStore} from "./drawing.store";

@Injectable()
export class HoverService {
    constructor(private store: DrawingStore) {
        this.store.pointer.on('move', event => {
            for (let item of this.store.Items.values()) {
                this.setHover(item, event.point)
            }
        });
    }

    @Computed
    public get HoveredItems(): DrawingFigure[] {
        return Array.from(this.store.Items.values()).filter(x => x.hover != null);
    }

    private setHover(item: DrawingFigure, position: IPoint) {
        switch (item.type) {
            case DrawingItemType.point:
                item.hover = this.checkPointHover(item.figure, position) ? {} : null;
                break;
            case DrawingItemType.line:
                item.hover = this.getLineHover(item, position);
                break;
            case DrawingItemType.polygone:
                item.hover = this.getPolygonHover(item, position);
                break;

        }
    }


    private getPolygonHover(item: PolygonFigure, position: IPoint) {
        // TODO: implement
        return item.figure.map((points, contour) => {
            return points.map((point, index) => {
                if (this.checkPointHover(point, position)) {
                    return {
                        index, contour
                    } as PointInfo;
                }
            }).filter(Fn.Ib)[0];
        }).filter(Fn.Ib)[0];
    }

    private getLineHover(item: LineFigure, position: IPoint) {
        let hover = null;
        item.figure.some((point, index) => {
            if (this.checkPointHover(point, position)) {
                hover = {index};
                return true;
            }
        });
        if (hover) {
            return hover;
        }
        const hovered = item.figure.some((point, index) => {
            if (index == 0)
                return false;
            const prevPoint = item.figure.get(index - 1);
            if (checkPointOnSegment(position, point, prevPoint)) {
                hover = {segment: [index - 1, index]};
                return true;
            }
        });
        if (hovered)
            return hover;
        return null;
    }

    private checkPointHover(point: IPoint, position: IPoint) {
        if (!point || !position)
            return false;
        return Math.abs(position.X - point.X) < Const.hoverRadius &&
            Math.abs(position.Y - point.Y) < Const.hoverRadius;
    }
}


function checkPointOnSegment(x: IPoint, a: IPoint, b: IPoint): boolean {
    const ab = {X: b.X - a.X, Y: b.Y - a.Y};
    const vecSquare = (x.X - a.X) * ab.Y - ab.X * (x.Y - a.Y);
    const lenSquare = ab.X ** 2 + ab.Y ** 2;
    if (vecSquare ** 2 > lenSquare * (Const.lineHoverDistance ** 2))
        return false;
    return Math.abs(ab.X) > Math.abs(ab.Y)
        ? x.X <= a.X && x.X >= b.X || x.X >= a.X && x.X <= b.X
        : x.Y <= a.Y && x.Y >= b.Y || x.Y >= a.Y && x.Y <= b.Y;
}

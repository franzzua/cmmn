import {Fn, Injectable} from "@cmmn/core";
import {Pointer} from "@cmmn/ui";
import {Const} from "../const";
import {DrawingFigure} from "../model";
import {LineFigure} from "../model/line-figure";
import {PolygonFigure} from "../model/polygon-figure";
import {DrawingItemType, IPoint, PointInfo} from "../types";
import {DrawingStore} from "./drawing.store";

@Injectable()
export class HoverService {
    constructor(private store: DrawingStore) {
        Pointer.on('move', event => {
            for (let item of this.store.Items) {
                this.setHover(item, {
                    X: event.x,
                    Y: event.y
                })
            }
        });
    }

    setHover(item: DrawingFigure, position: IPoint) {
        switch (item.type) {
            case DrawingItemType.point:
                item.hover = this.checkPointHover(item.figure, position);
                break;
            case DrawingItemType.line:
                item.hover = this.getLineHover(item, position);
                break;
            case DrawingItemType.polygone:
                item.hover = this.getPolygonHover(item, position);
                break;

        }
    }


    public getPolygonHover(item: PolygonFigure, position: IPoint) {
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

    public getLineHover(item: LineFigure, position: IPoint) {
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
                return true;
            }
        });
        if (hovered)
            return {};
        return null;
    }

    checkPointHover(point: IPoint, position: IPoint) {
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
    if (vecSquare ** 2 > lenSquare * (Const.hoverDistance ** 2))
        return false;
    return Math.abs(ab.X) > Math.abs(ab.Y)
        ? x.X <= a.X && x.X >= b.X || x.X >= a.X && x.X <= b.X
        : x.Y <= a.Y && x.Y >= b.Y || x.Y >= a.Y && x.Y <= b.Y;
}

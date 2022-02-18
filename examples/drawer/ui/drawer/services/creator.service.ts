import {Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {DrawingItemType, IPoint, Mode} from "../types";
import {Pointer} from "@cmmn/ui";
import {DrawingFigure} from "../model";
import {LineFigure} from "../model/line-figure";
import {PointFigure} from "../model/point-figure";
import {PolygonFigure} from "../model/polygon-figure";
import {MagnetismService} from "./magnetism.service";
import {DrawingStore} from "./drawing.store";

@Injectable()
export class CreatorService {
    constructor(private store: DrawingStore,
                private magnet: MagnetismService) {
        document.addEventListener('keydown', e => {
            console.log(e.code)
            switch (e.code) {
                case "Escape":
                    this.cancel();
                    this.store.Mode = Mode.idle;
                    break;
                case "Enter":
                case "NumpadEnter":
                    this.create();
                    break;
            }
        });
    }

    @Observable
    CreatingItem: DrawingFigure;

    get CreatingItemWithLastPosition(): DrawingFigure {
        if (!Pointer.Position || !this.CreatingItem)
            return this.CreatingItem;
        const point = this.magnet.getMagnetPoint(this.CreatingItem, this.store.getRelativePoint(Pointer.Position));
        const ex = this.clone();
        this.setLastPoint(ex, point);
        return ex;
    }

    private setLastPoint(figure: DrawingFigure, point: IPoint) {
        switch (figure.type) {
            case DrawingItemType.line:
                figure.figure.set(figure.figure.length - 1, point);
                break;
            case DrawingItemType.point:
                figure.figure = point;
                break;
            case DrawingItemType.polygone:
                break;
        }
    }

    private clone() {
        switch (this.CreatingItem.type) {
            case DrawingItemType.line:
                return new LineFigure(this.CreatingItem.id, [...this.CreatingItem.figure.toArray(), {X: 0, Y: 0}]
                )
            case DrawingItemType.point:
                return new PointFigure(this.CreatingItem.id, this.CreatingItem.figure);
            case DrawingItemType.polygone:
                // TODO: app point
                return new PolygonFigure(this.CreatingItem.id, this.CreatingItem.figure)
        }
    }

    public create(): void {
        if (!this.isValid(this.CreatingItemWithLastPosition))
            return;
        this.store.add(this.CreatingItemWithLastPosition);
        this.CreatingItem = null;
    }

    public cancel(): void {
        this.CreatingItem = null;
    }

    private isValid(item: DrawingFigure): Boolean {
        if (!item || !item.figure)
            return false;
        switch (item.type) {
            case DrawingItemType.line:
                return item.figure.length >= 2;
        }
        return true;
    }
}

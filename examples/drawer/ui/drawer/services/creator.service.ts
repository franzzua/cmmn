import {Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {DrawingItemType, Mode} from "../types";
import {IPoint} from "@cmmn/ui";
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
        this.store.keyboard.on('keydown', e => {
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
        if (!this.store.pointer.Position || !this.CreatingItem)
            return this.CreatingItem;
        const point = this.magnet.getMagnetPoint(this.CreatingItem, this.store.pointer.Position.point);
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
        if (!this.CreatingItemWithLastPosition.isValid())
            return;
        this.store.add(this.CreatingItemWithLastPosition);
        this.CreatingItem = null;
    }

    public cancel(): void {
        this.CreatingItem = null;
    }

}

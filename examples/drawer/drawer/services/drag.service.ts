import {Injectable} from "@cmmn/core";
import {IPoint} from "@cmmn/ui";
import {Observable} from "cellx-decorators";
import {HoverService} from "./hover.service";
import {DrawingFigure} from "../model";
import {MagnetismService} from "./magnetism.service";
import {LineFigure} from "../model/line-figure";
import {DrawingItemType} from "../types";
import {DrawingStore} from "./drawing.store";

@Injectable()
export class DragService {
    public isMoving = false;

    constructor(private hover: HoverService,
                private store: DrawingStore,
                private magnet: MagnetismService) {
        let start: IPoint;
        this.store.pointer.on('down', event => {
            this.DraggedItems = Array.from(this.store.Items.values()).filter(x => !!x.hover);
            (event.event.target as HTMLElement).setPointerCapture(event.event.pointerId);
            start = event.point;
            this.isMoving = true;

            for (let x of this.DraggedItems) {
                x.isMoving = true;
            }
        });
        this.store.pointer.on('move', event => {
            if (!this.DraggedItems.length)
                return;
            const shift = {
                X: event.event.movementX,
                Y: event.event.movementY
            };
            const current = event.point;
            for (let x of this.DraggedItems) {
                this.move(x, {shift, start, current});
                this.store.update(x.id);
            }
        });
        this.store.pointer.on('up', event => {
            (event.event.target as HTMLElement).releasePointerCapture(event.event.pointerId);
            this.isMoving = false;
            for (let x of this.DraggedItems) {
                x.isMoving = false;
            }
            this.DraggedItems = [];
        });
    }

    move(item: DrawingFigure, info: ShiftInfo){
        switch (item.type){
            case DrawingItemType.line:
                this.moveLine(item, info);
                break;
            case DrawingItemType.point:
                item.figure = info.current;
                break;
            case DrawingItemType.polygone:
                break;
        }
    }

    @Observable
    public DraggedItems: DrawingFigure[] = [];


    moveLine(line: LineFigure, info: ShiftInfo) {
        if (!line.selection)
            return;
        if (line.selection.index === undefined) {
            line.figure.setRange(0, line.figure.map(p => ({
                X: p.X + info.shift.X,
                Y: p.Y + info.shift.Y
            })));
        } else {
            let target = info.current;
            if (line.selection.index === 0 || line.selection.index === line.figure.length - 1) {
                target = this.magnet.getMagnetPoint(line, target);
            }
            line.figure.set(line.selection.index, target);
        }
    }
}

type ShiftInfo = {
    shift: IPoint;
    start: IPoint;
    current: IPoint;
}

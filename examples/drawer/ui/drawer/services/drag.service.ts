import {Injectable} from "@cmmn/core";
import {Pointer} from "@cmmn/ui";
import {Observable} from "cellx-decorators";
import {HoverService} from "./hover.service";
import {DrawingFigure} from "../model";
import {MagnetismService} from "./magnetism.service";
import {LineFigure} from "../model/line-figure";
import {DrawingItemType, IPoint} from "../types";
import {DrawingStore} from "./drawing.store";

@Injectable()
export class DragService {
    constructor(private hover: HoverService,
                private store: DrawingStore,
                private magnet: MagnetismService) {
        let isDrag = false;
        let start: IPoint;
        Pointer.on('down', event => {
            this.DraggedItems = Array.from(this.store.Items.values()).filter(x => !!x.hover);
            (event.target as HTMLElement).setPointerCapture(event.pointerId);
            start = this.store.getRelativePoint(event);
        });
        Pointer.on('move', event => {
            if (!this.DraggedItems.length)
                return;
            const shift = {
                X: event.movementX,
                Y: event.movementY
            };
            const current = this.store.getRelativePoint(event);
            for (let x of this.DraggedItems) {
                this.move(x, {shift, start, current});
                this.store.update(x.id);
            }
        });
        Pointer.on('up', event => {
            (event.target as HTMLElement).releasePointerCapture(event.pointerId);
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

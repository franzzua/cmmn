import {Injectable} from "@cmmn/core";
import {IPoint} from "@cmmn/ui";
import {cell} from "@cmmn/cell";
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
        this.store.pointer.on('drag', event => {
            if (event.isStart){
                this.DraggedItems = Array.from(this.store.Items.values()).filter(x => !!x.hover);
                this.isMoving = true;
                for (let x of this.DraggedItems) {
                    x.isMoving = true;
                }
                return;
            }
            if (event.isEnd){
                this.isMoving = false;
                for (let x of this.DraggedItems) {
                    x.isMoving = false;
                }
                this.DraggedItems = [];
                return;
            }
            for (let x of this.DraggedItems) {
                this.move(x, {shift: event.shift, start: event.start, current: event.point});
                this.store.update(x.id);
            }
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

    @cell
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

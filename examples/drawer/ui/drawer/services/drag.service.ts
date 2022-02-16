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
        Pointer.on('down', event => {
            this.DraggedItems = this.store.Items.filter(x => !!x.hover);
            (event.target as HTMLElement).setPointerCapture(event.pointerId);
        });
        Pointer.on('move', event => {
            if (!this.DraggedItems.length)
                return;
            const shift = {
                X: event.movementX,
                Y: event.movementY
            };
            for (let x of this.DraggedItems) {
                this.move(x, shift);
            }
        });
        Pointer.on('up', event => {
            (event.target as HTMLElement).releasePointerCapture(event.pointerId);
            this.DraggedItems = [];
        });
    }

    move(item: DrawingFigure, shift: IPoint){
        switch (item.type){
            case DrawingItemType.line:
                this.moveLine(item, shift);
                break;
            case DrawingItemType.point:
                item.figure = {
                    X: item.figure.X + shift.X,
                    Y: item.figure.Y + shift.Y
                };
                break;
            case DrawingItemType.polygone:
                break;
        }
    }

    @Observable
    public DraggedItems: DrawingFigure[] = [];


    moveLine(line: LineFigure, shift: IPoint) {
        if (!line.selection)
            return;
        if (line.selection.index === undefined) {
            line.figure.setRange(0, line.figure.map(p => ({
                X: p.X + shift.X,
                Y: p.Y + shift.Y
            })));
        } else {
            const p = line.figure.get(line.selection.index);
            const newPoint = {
                X: p.X + shift.X,
                Y: p.Y + shift.Y
            };
            const magnetPoint = this.magnet.getMagnetPoint(line, newPoint);
            line.figure.set(line.selection.index, magnetPoint);
        }
    }
}

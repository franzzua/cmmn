import {Injectable} from "@cmmn/core";
import {Const} from "../const";
import {DrawingFigure} from "../model";
import {DrawingItemType, IPoint} from "../types";
import {DrawingStore} from "./drawing.store";

@Injectable()
export class MagnetismService {

    constructor(private store: DrawingStore) {

    }

    public getMagnetPoint(figure: DrawingFigure, point: IPoint){
        for (let item of this.store.Items.values()) {
            if (figure === item)
                continue;
            switch (item.type) {
                case DrawingItemType.line:
                    if (item.selection)
                        continue;
                    const first = item.figure.get(0);
                    if (this.checkPoint(first, point))
                        return first;
                    const last = item.figure.get(item.figure.length - 1);
                    if (this.checkPoint(last, point))
                        return last;
            }
        }
        return point;
    }

    private checkPoint(point: IPoint, position: IPoint){

        if (!point || !position)
            return false;
        return Math.abs(position.X - point.X) < Const.magnetRadius &&
            Math.abs(position.Y - point.Y) < Const.magnetRadius;
    }
}

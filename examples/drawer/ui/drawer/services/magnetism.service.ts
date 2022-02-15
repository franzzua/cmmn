import {DrawingItemType, DrawingStore, IPoint} from "../drawing.store";
import {Injectable} from "@cmmn/core";
import {Const} from "../const";
import {DrawingFigure} from "../model";

@Injectable()
export class MagnetismService {

    constructor(private drawerStore: DrawingStore) {

    }

    public getMagnetPoint(figure: DrawingFigure, point: IPoint){
        for (let item of this.drawerStore.Items) {
            if (figure === item)
                continue;
            switch (item.type) {
                case DrawingItemType.line:
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

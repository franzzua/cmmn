import {Injectable} from "@cmmn/core";
import {HoverService} from "./hover.service";
import {Pointer} from "@cmmn/ui";
import {Mode, PointInfo} from "../types";
import {Observable} from "cellx-decorators";
import {ObservableList} from "cellx-collections";
import {DrawingFigure} from "../model";
import {DrawingStore} from "./drawing.store";

@Injectable()
export class SelectionService {

    constructor(private store: DrawingStore) {
        Pointer.on('down', event => {
            if (store.Mode !== Mode.idle)
                return;
            for (let item of this.store.Items) {
                item.selection = item.hover;
            }
        });
    }

    @Observable
    public SelectedItems = new ObservableList<DrawingFigure>();

    @Observable
    public SelectedPoints = new ObservableList<PointInfo>();

}

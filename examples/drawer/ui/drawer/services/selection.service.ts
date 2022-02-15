import {Injectable} from "@cmmn/core";
import {DrawingItem, DrawingStore, PointInfo} from "../drawing.store";
import {HoverService} from "./hover.service";
import {Pointer} from "@cmmn/ui";
import {Mode} from "../types";
import {Observable} from "cellx-decorators";
import {ObservableList} from "cellx-collections";
import {DrawingFigure} from "../model";

@Injectable()
export class SelectionService {

    constructor(private store: DrawingStore,
                private hoverService: HoverService) {
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

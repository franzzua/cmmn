import {Injectable} from "@cmmn/core";
import {DrawingItem, DrawingStore} from "../drawing.store";
import {HoverService} from "./hover.service";
import {Pointer} from "@cmmn/ui";
import {Mode} from "../types";
import {Observable} from "cellx-decorators";
import {ObservableList} from "cellx-collections";

@Injectable()
export class SelectionService {

    constructor(private store: DrawingStore,
                private hoverService: HoverService) {
        Pointer.on('directClick', event => {
            if (store.Mode !== Mode.idle)
                return;
            this.SelectedItems.clear();
            this.SelectedItems.addRange(this.hoverService.HoveredItems);
        });
    }

    @Observable
    public SelectedItems = new ObservableList<DrawingItem>();

}

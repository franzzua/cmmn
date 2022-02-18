import {Injectable} from "@cmmn/core";
import {Pointer} from "@cmmn/ui";
import {DrawingFigureJson, Mode} from "../types";
import {Computed, Observable} from "cellx-decorators";
import {ObservableList} from "cellx-collections";
import {DrawingStore} from "./drawing.store";

@Injectable()
export class SelectionService {

    constructor(private store: DrawingStore) {
        Pointer.on('down', event => {
            if (!this.store.filterEvent(event))
                return;
            if (store.Mode !== Mode.idle)
                return;
            for (let item of this.store.Items.values()) {
                item.selection = item.hover;
            }
        });
    }

    @Computed
    public get SelectedItems(){
        return Array.from(this.store.Items.values()).filter(x => x.selection != null).map(x => x.toJson());
    }

}

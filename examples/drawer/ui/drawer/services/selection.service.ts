import {Injectable} from "@cmmn/core";
import {Keyboard, Pointer} from "@cmmn/ui";
import {DrawingItemType, Mode} from "../types";
import {Computed} from "cellx-decorators";
import {DrawingStore} from "./drawing.store";
import {DrawingFigure} from "../model";

@Injectable()
export class SelectionService {

    constructor(private store: DrawingStore) {

        this.store.pointer.on('down', event => {
            if (store.Mode !== Mode.idle)
                return;
            for (let item of this.store.Items.values()) {
                item.selection = item.hover;
            }
        });
    }
    @Computed
    public get SelectedItems(): DrawingFigure[] {
        return Array.from(this.store.Items.values()).filter(x => x.selection != null);
    }

    public deleteSelected() {

        for (let selectedItem of this.SelectedItems) {
            switch (selectedItem.type) {
                case DrawingItemType.point:
                    this.store.Items.delete(selectedItem.id);
                    break;
                case DrawingItemType.line:
                    if (selectedItem.selection.index !== undefined) {
                        selectedItem.figure.removeAt(selectedItem.selection.index);
                        this.store.update(selectedItem.id);
                    } else {
                        this.store.Items.delete(selectedItem.id);
                    }
                    break;
                case DrawingItemType.polygone:
                    if (selectedItem.selection.contour !== undefined) {
                        if (selectedItem.selection.index !== undefined) {
                            //todo: implement polygone
                            // selectedItem.figure.removeAt(selectedItem.selection.index);
                        }else{
                            //todo: implement polygone
                            // selectedItem.figure.removeAt(selectedItem.selection.index)
                        }
                        this.store.update(selectedItem.id);
                    }else {
                        this.store.Items.delete(selectedItem.id);
                    }
                    break;

            }
        }
    }


}

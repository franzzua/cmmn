import {Injectable} from "@cmmn/core";
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

    public* getSelectedItems(): Iterable<DrawingFigure> {
        for (let value of this.store.Items.values()) {
            if (value.hover)
                yield value;
        }
    }

    public deleteSelected() {

        for (let selectedItem of this.getSelectedItems()) {
            switch (selectedItem.type) {
                case DrawingItemType.point:
                    this.store.Items.delete(selectedItem.id);
                    break;
                case DrawingItemType.line:
                    if (selectedItem.selection.index !== undefined && selectedItem.figure.length > 2) {
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
                        } else {
                            //todo: implement polygone
                            // selectedItem.figure.removeAt(selectedItem.selection.index)
                        }
                        this.store.update(selectedItem.id);
                    } else {
                        this.store.Items.delete(selectedItem.id);
                    }
                    break;

            }
        }
    }


}

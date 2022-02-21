import {DrawingStore} from "./drawing.store";
import {Injectable} from "@cmmn/core";
import {SelectionService} from "./selection.service";
import {HoverService} from "./hover.service";
import {DrawingItemType} from "../types";

@Injectable()
export class EditorService {
    constructor(private store: DrawingStore,
                private hover: HoverService,
                private selection: SelectionService) {

        this.store.keyboard.on('keydown', e => {
            switch (e.code) {
                case "Backspace":
                case "Delete":
                    this.selection.deleteSelected();
                    break;
            }
        });

        this.store.pointer.on('dblclick', e => {
            for (let hoveredItem of this.hover.getHoveredItems()) {
                switch (hoveredItem.type) {
                    case DrawingItemType.line:
                        hoveredItem.addPoint(e.point);
                        break;
                }
            }
        });
    }
}
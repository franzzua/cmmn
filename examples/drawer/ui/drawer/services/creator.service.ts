import {cellx, Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {DrawingItem, DrawingStore} from "../drawing.store";
import {Mode} from "../types";
import {Pointer} from "@cmmn/ui";

@Injectable()
export class CreatorService {
    constructor(private store: DrawingStore) {
        document.addEventListener('keydown', e => {
            console.log(e.code)
            switch (e.code) {
                case "Escape":
                    this.cancel();
                    break;
                case "Enter":
                case "NumpadEnter":
                    this.create();
                    this.CreatingItem = null;
                    break;
            }
        });
    }

    @Observable
    CreatingItem: DrawingItem;

    get CreatingItemWithLastPosition(): DrawingItem {
        if (!Pointer.Position || !this.CreatingItem)
            return this.CreatingItem;
        const point = {
            X: Pointer.Position.x,
            Y: Pointer.Position.y,
        };
        switch (this.CreatingItem.type) {
            case "point":
                return {
                    ...this.CreatingItem,
                    figure: point
                };
            case "line":
                return {
                    ...this.CreatingItem,
                    figure: [
                        ...this.CreatingItem.figure,
                        point
                    ]
                };
            case "polygon":
                return {
                    ...this.CreatingItem,
                    figure: [
                        ...this.CreatingItem.figure.slice(0, -1),
                        [
                            ...this.CreatingItem.figure.slice(-1)[0],
                            point
                        ]
                    ]
                };
        }
    }

    public create(): void {
        if (!this.isValid(this.CreatingItem))
            return;
        this.store.add(this.CreatingItem);
        this.CreatingItem = null;
    }

    public cancel(): void {
        this.CreatingItem = null;
        this.store.Mode = Mode.idle;
    }

    private isValid(item: DrawingItem): Boolean {
        if (!item || !item.figure)
            return false;
        switch (item.type) {
            case "line":
                return item.figure.length >= 2;
        }
        return true;
    }
}

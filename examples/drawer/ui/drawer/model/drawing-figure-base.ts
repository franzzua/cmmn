import {DrawingItem} from "../drawing.store";


export abstract class DrawingFigureBase {
    constructor(item: DrawingItem) {
        this.id = item.id;
    }

    id: string;

}

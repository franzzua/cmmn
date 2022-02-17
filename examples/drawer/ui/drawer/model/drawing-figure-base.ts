import {DrawingFigureJson, DrawingItemType, IPoint} from "../types";

export abstract class DrawingFigureBase {
    constructor(id: string) {
        this.id = id;
    }

    id: string;

    public abstract toJson(): DrawingFigureJson;
    public abstract fromJson(json: DrawingFigureJson);
}

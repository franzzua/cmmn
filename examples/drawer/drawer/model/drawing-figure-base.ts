import {DrawingFigureJson} from "../types";
import { Observable } from "cellx-decorators";

export abstract class DrawingFigureBase {
    constructor(id: string) {
        this.id = id;
    }

    id: string;

    public abstract toJson(): DrawingFigureJson;

    public abstract fromJson(json: DrawingFigureJson);

    public isMoving = false;

    public isValid(): boolean {
        return true;
    }
}

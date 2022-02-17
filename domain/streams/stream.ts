import {ICellx} from "cellx";
import {Action, ModelPath} from "../shared/types";

export abstract class Stream {
    public abstract Invoke(action: Action): Promise<any>;
    public abstract getCell<T>(path: ModelPath): ICellx<T>;
}


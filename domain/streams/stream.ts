import {BaseCell} from "@cmmn/cell";
import {Action, ModelPath} from "../shared/types";

export abstract class Stream {
    public abstract Invoke(action: Action): Promise<any>;
    public abstract getCell<T>(path: ModelPath): BaseCell;
    public getSubStream(path: ModelPath): Stream{
        return new SubStream(this, path)
    }
}

export class SubStream extends Stream{
    constructor(private stream: Stream, private path: ModelPath) {
        super();
    }

    Invoke(action: Action): Promise<any> {
        return this.stream.Invoke({
            ...action,
            path: this.path.concat(action.path)
        });
    }

    getCell<T>(path: ModelPath): BaseCell {
        return this.stream.getCell(this.path.concat(path));
    }

}


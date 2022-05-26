import {BaseCell, Cell} from "@cmmn/cell";
import {Injectable} from "@cmmn/core";
import {Stream} from "./stream";
import {Action} from "../shared/types";
import {Locator} from "../worker";

@Injectable()
export class DirectStream extends Stream {
    constructor(private locator: Locator) {
        super();
    }

    async Invoke(action: Action): Promise<any> {
        await Promise.resolve();
        const model = this.locator.get<any, any>(action.path);
        if (!model) throw new Error("model not found at path " + action.path.join(':'))
        return model.Actions[action.action](...action.args);
    }

    getCell<T>(path: (string | number)[]): BaseCell {
        const model = this.locator.get(path);
        const cell = new Cell(() => {
            return model.State as T;
        }, {
            put: value => model.State = value
        });
        return cell;
    }
}

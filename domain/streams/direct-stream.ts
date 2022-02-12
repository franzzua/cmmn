import {cellx, Injectable, ICellx} from "@cmmn/core";
import {Stream} from "./stream";
import {IFactory} from "../shared/factory";
import {Action} from "../shared/types";

@Injectable()
export class DirectStream extends Stream {
    constructor(private factory: IFactory) {
        super();
    }

    async Invoke(action: Action): Promise<any> {
        await Promise.resolve();
        const model = this.factory.GetModel<any, any>(action.path);
        if (!model) throw new Error("model not found at path " + action.path.join(':'))
        return model.Actions[action.action](...action.args);
    }

    getCell<T>(path: (string | number)[]): ICellx<T> {
        return cellx<T>(() => {
            return this.factory.GetModel(path).State as T;
        }, {
            put: async (cell, value: T) => {
                this.factory.GetModel(path).State = value;
            }
        });
    }
}

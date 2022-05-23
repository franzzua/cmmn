import {IFactory} from "../shared/factory";
import {Model} from "./model";
import {ModelAction, ModelPath} from "../shared/types";
import {Injectable} from "@cmmn/core";

@Injectable()
export class RootFactory implements IFactory {
    constructor(private model: Model<any>) {

    }

    GetModel<TState, TActions extends ModelAction>(path: ModelPath): Model<TState, TActions> {
        return this.model.QueryModel<TState, TActions>(path);
    }

    get Root(): Model<any, any> {
        return this.model;
    }

}
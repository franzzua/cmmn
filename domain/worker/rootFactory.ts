// import {IFactory} from "../shared/factory.js";
// import {Model} from "./model.js";
// import {ModelAction, ModelPath} from "../shared/types.js";
// import {Injectable} from "@cmmn/core";
//
// @Injectable()
// export class RootFactory implements IFactory {
//     constructor(private model: Model<any>) {
//
//     }
//
//     GetModel<TState, TActions extends ModelAction>(path: ModelPath): Model<TState, TActions> {
//         return this.model.QueryModel<TState, TActions>(path);
//     }
//
//     get Root(): Model<any, any> {
//         return this.model;
//     }
//
// }
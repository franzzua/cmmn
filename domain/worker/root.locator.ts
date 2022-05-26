import {ModelAction, ModelLike, ModelPath} from "../shared/types";
import {Injectable} from "@cmmn/core";
import {Model} from "./model";
import {ObservableList} from "@cmmn/cell";
import {Locator} from "./locator";

@Injectable()
export class RootLocator implements Locator {
    constructor(private root: ModelLike<any, any>) {
    }

    public get<TState, TActions extends ModelAction>(path: ModelPath): ModelLike<TState, TActions> {
        return this.QueryModel<TState, TActions>(path);
    }

    private _queryModel<TState, TActions extends ModelAction>(path: ModelPath, current: ModelLike<any, any>): ModelLike<TState, TActions> | undefined {
        if (path.length == 0)
            return current as ModelLike<TState, TActions>;
        const first = path.shift()!;
        if (current instanceof Map) {
            return this._queryModel(path, current.get(first));
        }
        if (Array.isArray(current)) {
            const result = current.find(x => x.id === first || x.Id === first);
            return this._queryModel(path, result);
        }
        if (current instanceof ObservableList) {
            const result = current.toArray().find(x => x.id === first || x.Id === first);
            return this._queryModel(path, result);
        }
        if (first in current)
            return this._queryModel(path, current[first]);
        return undefined;
    }

    public QueryModel<TState, TActions extends ModelAction>(path: ModelPath): ModelLike<TState, TActions> | undefined {
        try {
            return this._queryModel<TState, TActions>(path.slice(), this.root);
        } catch (e) {
            throw new Error('Failed to find model with path ' + path.join(' - '))
        }
    }
}
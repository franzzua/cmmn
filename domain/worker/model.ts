import {cellx} from "cellx";
import {ModelAction, ModelPath} from "../shared/types";

export abstract class Model<TState, TActions extends ModelAction = {}> {

    public $state = cellx(() => this.State, {
        put: (cell, value) => {
            this.State = value;
        }
    })

    public get State(): Readonly<TState> {
        return this.$state();
    }

    public set State(value: Readonly<TState>) {
        this.$state(value);
    }

    public Actions: TActions = this as any;
    protected Factory: (path: ModelPath) => Model<any>;

    private _queryModel<TState, TActions extends ModelAction>(path: ModelPath, current: any): Model<TState, TActions> | undefined {
        if (path.length == 0)
            return current;
        const first = path.shift()!;
        if (current instanceof Map) {
            return this._queryModel(path, current.getOrAdd(first, this.Factory));
        }
        if (Array.isArray(current)) {
            const result = current.find(x => x.id === first || x.Id === first);
            return this._queryModel(path, result);
        }
        if (first in current)
            return this._queryModel(path, current[first]);
        return undefined;
    }

    public QueryModel<TState, TActions extends ModelAction>(path: ModelPath): Model<TState, TActions> | undefined {
        return this._queryModel<TState, TActions>(path, this);
    }
}

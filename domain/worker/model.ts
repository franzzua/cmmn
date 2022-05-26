import {Cell, ObservableList} from "@cmmn/cell";
import {ModelAction, ModelPath} from "../shared/types";
import {Fn} from "@cmmn/core";

export abstract class Model<TState, TActions extends ModelAction = {}> {

    public $state = new Cell(() => this.State, {
        put: value => {
            // TODO: enable
            // this.State = value
        },
        compare: Fn.compare
    })

    public get State(): Readonly<TState> {
        return this.$state.get();
    }

    public set State(value: Readonly<TState>) {
        this.$state.set(value);
    }

    public Actions: TActions = this as any;

}

import {Stream} from "./streams/stream";
import {ModelAction, ModelPath} from "./shared/types";
import {AsyncQueue, Fn} from "@cmmn/core";
import {Cell} from "@cmmn/cell";

export class ModelProxy<TState, TActions extends ModelAction = {}> {

    constructor(protected stream: Stream, public path: ModelPath) {
    }

    public $remoteState = this.stream.getCell<Readonly<TState>>(this.path);
    public $localState = new Cell(null);
    public $state = this.$remoteState;
    // public $state = new Cell<TState>(() => {
    //     if (this.asyncQueue.IsEmpty) {
    //         this.$localState.set(null);
    //         return this.$remoteState.get();
    //     }
    //     return this.$localState.get() ?? this.$remoteState.get();
    // });

    public get State(): TState {
        return this.$state.get();
    }

    public Diff(change: (state: TState) => TState) {
        const current = this.$remoteState.get();
        this.$localState.set(change(current));
        this.asyncQueue.Invoke(() => {
            const current = this.$remoteState.get();
            this.$remoteState.set(change(current));
        });
    }

    public set State(state: TState) {
        this.$localState.set(state);
        this.asyncQueue.Invoke(() => {
            this.$remoteState.set(state);
        });
        // this.asyncQueue.Invoke(() => {
        //     return this.$remoteState(state);
        // });
    }

    private asyncQueue = new AsyncQueue();

    public Actions: TActions = new Proxy({} as any as TActions, {
        get: (target: any, key: string) => {
            if (key in target)
                return target[key];
            return target[key] = function () {
                return this.Invoke(key, Array.from(arguments))
            }.bind(this);
        }
    });

    public Invoke(action: string, args: any[]): Promise<any> {
        return this.asyncQueue.Invoke(() => this.stream.Invoke({
            path: this.path,
            args, action
        }));
    }

    public QueryModel(path: (string | number)[]): any {
        return new ModelProxy(this.stream, [this.path, path].flat());
    }

}

export type DeepPartial<TState> = {
    [key in keyof TState]?: DeepPartial<TState[key]>;
}
import {Stream} from "./streams/stream";
import {ModelAction, ModelPath} from "./shared/types";
import {AsyncQueue} from "@cmmn/core";
import {cell, Cell} from "@cmmn/cell";
import {VersionState} from "./streams/versionState";

export class ModelProxy<TState, TActions extends ModelAction = {}> {

    constructor(protected stream: Stream, public path: ModelPath) {
    }
    public $state: VersionState<TState> = this.stream.getCell<Readonly<TState>>(this.path) as VersionState<TState>;
    // public $localState = new Cell(null);
    // public $state = this.$remoteState;
    // public $state = new Cell<TState>(() => {
    //     if (!this.isInvoking) {
    //         this.$localState.set(null);
    //         return this.$remoteState.get();
    //     }
    //     return this.$localState.get() ?? this.$remoteState.get();
    // });

    // @cell
    // protected isInvoking = false;

    public get State(): TState {
        return this.$state.get();
    }

    public Diff(change: (state: TState) => TState) {
        const current = this.$state.get();
        this.$state.setLocal(change(current));
        // this.$localState.set(change(current));
        // this.isInvoking = true;
        // this.asyncQueue.Invoke(() => {
        //     // this.isInvoking = false;
        //     this.$remoteState.set(change(current));
        // });
    }

    public set State(state: TState) {
        this.Diff(() => state);
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
        if (action === 'equals')
            return Promise.resolve(false);
        if (!action.startsWith('Get'))
            this.$state.up();
        const version = this.$state.localVersion;
        return this.asyncQueue.Invoke(() => this.stream.Invoke({
            path: this.path,
            version,
            args, action
        }));
    }

    public QueryModel<TState, TActions extends ModelAction>(path: ModelPath): ModelProxy<TState, TActions> | undefined {
        return new ModelProxy<TState, TActions>(this.stream, [this.path, path].flat());
    }

    public GetSubProxy<TState, TActions extends ModelAction, TModelProxy extends ModelProxy<TState, TActions> = ModelProxy<TState, TActions>>(
        path: ModelPath, modelProxyConstructor: {
            new(stream, path): TModelProxy
        } = ModelProxy as any): TModelProxy {
        return new modelProxyConstructor(this.stream, [this.path, path].flat());
    }
    public equals(x: any) {
        return this === x;
    }

}

export type DeepPartial<TState> = {
    [key in keyof TState]?: DeepPartial<TState[key]>;
}
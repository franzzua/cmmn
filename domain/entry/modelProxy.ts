import {Stream} from "../streams/stream";
import {ModelAction, ModelLike, ModelPath} from "../shared/types";
import {AsyncQueue, Injectable} from "@cmmn/core";
import {VersionState} from "../streams/versionState";
import {Locator} from "../shared/locator";
import {EntityLocator} from "./entity-locator.service";

@Injectable(true)
export class ModelProxy<TState, TActions extends ModelAction = {}> implements ModelLike<TState, TActions>{

    constructor(protected stream: Stream,
                /** @internal **/
                public locator: Locator) {
    }
    public $state: VersionState<TState> = this.stream.getCell<Readonly<TState>>([]) as VersionState<TState>;
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
            // для примитивов
            if (typeof key !== "string")
                return () => null;
            if (key === "then") // работает await, тут надо сообщить, что нет метода .then
                return undefined;
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
            path: [],
            version,
            args, action
        }));
    }

    public GetSubProxy<TState, TActions extends ModelAction, TModelProxy extends ModelProxy<TState, TActions> = ModelProxy<TState, TActions>>(
        path: ModelPath, modelProxyConstructor: {
            new(...args): TModelProxy
        } = ModelProxy as any): TModelProxy {
        return this.locator.get<TState, TActions>(path, modelProxyConstructor) as TModelProxy;
    }
    public equals(x: any) {
        return this === x;
    }

}

export type DeepPartial<TState> = {
    [key in keyof TState]?: DeepPartial<TState[key]>;
}

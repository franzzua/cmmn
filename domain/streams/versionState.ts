import {Fn, ResolvablePromise} from "@cmmn/core";
import {cell, Cell} from "@cmmn/cell";

export class VersionState<T> extends Cell<T> {
    @cell
    remoteVersion: string;
    @cell
    localVersion: string;
    @cell
    localState: T;
    @cell
    remoteState: T;
    public waitLoaded = new ResolvablePromise<void>();
    private isLoaded: boolean;
    constructor() {
        super(() => {
            if (this.localVersion && this.remoteVersion < this.localVersion)
                return this.localState;
            return this.remoteState;
        });
    }

    public up() {
        // this.localVersion = Fn.ulid();
    }

    setRemote(version: string, state: T) {
        this.remoteState = state;
        this.remoteVersion = version;
        if (!this.isLoaded){
            this.waitLoaded.resolve();
        }
    }

    setLocal(value: T){
        this.localState = value;
        this.localVersion = Fn.ulid();
    }
}
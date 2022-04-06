import { Fn } from "@cmmn/core";
import {Cell} from "cellx";

export class VersionState<T> extends Cell<T> {
    remoteVersion: string;
    remoteState: T;

    public Version: string;

    constructor() {
        super(null);
    }

    public up() {
        this.Version = Fn.ulid();
    }

    setRemote(version: string, state: T) {
        if (!this.Version || version >= this.Version) {
            this.Version = version;
            this.set(state);
        }
    }
}
import {WorkerStream} from "./workerStream";
import {Lazy} from "@cmmn/core";
import {BaseStreamWindow} from "./base-stream.window";

export class ChildWindowStream extends WorkerStream{

    @Lazy
    protected get BaseStream() {
        return new BaseStreamWindow(this.target);
    }
}
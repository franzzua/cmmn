import {EventEmitter} from "@cmmn/core";

export abstract class Transport<In, Out = In> extends EventEmitter<Record<string, In>> {
    abstract send(channel: string, message: Out): void;
}
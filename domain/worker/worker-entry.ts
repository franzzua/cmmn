import {IFactory} from "../shared/factory";
import {AsyncQueue, Fn, Injectable} from "@cmmn/core";
import {BaseStream} from "../streams/base.stream";
import {Connector} from "../streams/connector";

@Injectable()
export class WorkerEntry extends Connector{

    constructor(private factory: IFactory) {
        super(new BaseStream(self), factory.Root);
    }
}



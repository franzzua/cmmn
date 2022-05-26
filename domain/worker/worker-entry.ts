import {Injectable} from "@cmmn/core";
import {BaseStream} from "../streams/base.stream";
import {Connector} from "../streams/connector";
import {Locator} from "./locator";

@Injectable()
export class WorkerEntry extends Connector {

    constructor(locator: Locator) {
        super(new BaseStream(self), locator);
    }

}



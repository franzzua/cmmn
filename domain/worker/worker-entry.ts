import {Injectable} from "@cmmn/core";
import { Locator } from "../shared/locator";
import {BaseStream} from "../streams/base.stream";
import {Connector} from "../streams/connector";

/**
 * Обертка над Stream, который находится на стороне Worker-thread
 */
@Injectable()
export class WorkerEntry extends Connector {

    constructor(locator: Locator) {
        super(new BaseStream(self), locator);
    }

}



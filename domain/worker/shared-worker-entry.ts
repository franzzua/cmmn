import {Injectable} from "@cmmn/core";
import { Locator,WorkerEntry } from "@cmmn/domain/worker";
import {BaseStream} from "../streams/base.stream";
import {Connector} from "../streams/connector";
// @ts-ignore
declare const globalThis: SharedWorkerGlobalScope;
/**
 * Обертка над Stream на стороне Worker-thread.
 * Со стороны Main-thread работает WorkerStream.
 */
@Injectable()
export class SharedWorkerEntry {

    private connectors = new Set<Connector>;
    constructor(private locator: Locator) {
        globalThis.addEventListener('connect', ev => {
            for (let port of ev.ports) {
                this.connectors.add(new Connector(new BaseStream(port), this.locator));
            }
            console.log(ev.data, ev.ports, ev);
        })
        globalThis.addEventListener('rejectionhandled', ev => {
            console.log(ev);
        })
        globalThis.addEventListener('unhandledrejection', ev => {
            console.log(ev);
        })
    }

}



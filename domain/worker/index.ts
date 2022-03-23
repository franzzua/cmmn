import { registerSerializer } from "@cmmn/core";
import {Transferable} from "../streams/transferable";

export {WorkerEntry} from "./worker-entry";
export {IFactory} from "../shared/factory";
export {Model} from "./model";
export * from "../shared/types"

if (!('document' in globalThis)) {
    registerSerializer<Transferable, number>(10, Transferable,
        x => x.index,
        index => new Transferable(index)
    );
}
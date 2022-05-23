import {Container, registerSerializer} from "@cmmn/core";
import {Transferable} from "../streams/transferable";
import {IFactory} from "../entry/proxy";
import {Model} from "./model";
import {RootFactory} from "./rootFactory";

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
export {RootFactory}

export function useDomain() {
    return Container.withProviders(RootFactory);
}


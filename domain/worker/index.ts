import {Container, registerSerializer} from "@cmmn/core";
import {Transferable} from "../streams/transferable";
import {ModelLike} from "../entry/proxy";
import {Model} from "./model";
import {RootLocator} from "./root.locator";
import {Locator} from "./locator";

export {WorkerEntry} from "./worker-entry";
export {Model} from "./model";
export * from "../shared/types"

if (!('document' in globalThis)) {
    registerSerializer<Transferable, number>(10, Transferable,
        x => x.index,
        index => new Transferable(index)
    );
}

export function useDomain(root: Model<any>) {
    return Container.withProviders([
        {provide: Locator, useValue: new RootLocator(root)},
    ]);
}

export {Locator, RootLocator, ModelLike}
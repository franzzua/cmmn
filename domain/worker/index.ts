import {Container, registerSerializer} from "@cmmn/core";
import {Transferable} from "../streams/transferable.js";
import {Locator} from "../shared/locator.js";
import {Model} from "./model.js";
import {RootLocator} from "./root.locator.js";
import {ModelLike} from "../shared/types.js";

export {WorkerEntry} from "./worker-entry.js";
export {Model} from "./model.js";
export * from "../shared/types.js"

if (!('document' in globalThis)) {
    registerSerializer<Transferable, number>(10, Transferable,
        x => x.index,
        index => new Transferable(index)
    );
}

export function useDomain(root: ModelLike<any, any>) {
    return Container.withProviders(
        {provide: Locator, useValue: new RootLocator(root)},
    );
}

export {Locator, RootLocator, ModelLike}
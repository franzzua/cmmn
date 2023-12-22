import {Container} from "@cmmn/core";
import {Transferable} from "../streams/transferable";
import {Locator} from "../shared/locator";
import {RootLocator} from "./root.locator";
import {ModelLike} from "../shared/types";
import {registerSerializer} from "../serialize";

export {WorkerEntry} from "./worker-entry";
export {SharedWorkerEntry} from "./shared-worker-entry";
export {Model} from "./model";
export * from "../shared/types"

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
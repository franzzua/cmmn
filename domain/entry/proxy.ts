import {Container, registerSerializer} from "@cmmn/core";
import {Stream} from "../streams/stream.js";
import {DirectStream} from "../streams/direct-stream.js";
import {WorkerStream} from "../streams/workerStream.js";
import {Transferable} from "../streams/transferable.js";
import {Locator} from "../shared/locator.js";
import {EntityLocator} from "./entity-locator.service.js";
import {ChildWindowStream} from "../window/child-window.stream.js";

export {proxy} from "../shared/domain.structure.js";
export {ModelProxy} from "./modelProxy.js";
export {Stream} from "../streams/stream.js";
export {WorkerStream} from "../streams/workerStream.js";
export {ModelMap} from "../model-map.js";
export {ChildWindowConnector} from "../window/child-window.connector.js";
export * from "../shared/types.js"

//
export function useStreamDomain(): Container {
    return Container.withProviders(
        {provide: Stream, useClass: DirectStream}
    );
}

export function useWorkerDomain(worker: Worker): Container {
    const stream = new WorkerStream(worker);
    return Container.withProviders({
        provide: Locator, useClass: EntityLocator
    }, {
        provide: Stream, useValue: stream
    });
}
export function useOpenerDomain(): Container {
    const stream = new ChildWindowStream();
    return Container.withProviders({
        provide: Locator, useClass: EntityLocator
    }, {
        provide: Stream, useValue: stream
    });
}

if ('document' in globalThis) {
    registerSerializer<Transferable, number>(10, Transferable,
        x => x.index,
        index => new Transferable(index)
    );
}
export {EntityLocator, Locator};

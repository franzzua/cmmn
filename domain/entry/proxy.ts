import {Container} from "@cmmn/core";
import {Stream} from "../streams/stream";
import {DirectStream} from "../streams/direct-stream";
import {WorkerStream} from "../streams/workerStream";
import {Transferable} from "../streams/transferable";
import {Locator} from "../shared/locator";
import {EntityLocator} from "./entity-locator.service";
import {ChildWindowStream} from "../window/child-window.stream";
import {registerSerializer} from "../serialize";

export {ModelProxy} from "./modelProxy";
export {Stream} from "../streams/stream";
export {WorkerStream} from "../streams/workerStream";
export {ModelMap} from "../model-map";
export {ChildWindowConnector} from "../window/child-window.connector";
export * from "../shared/types"

//
export function useStreamDomain(): Container {
    return Container.withProviders(
        {provide: Stream, useClass: DirectStream}
    );
}

export function useWorkerDomain(worker: Worker | SharedWorker): Container {
    const stream = new WorkerStream(worker instanceof SharedWorker ? worker.port : worker) ;
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

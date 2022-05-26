import {Container, registerSerializer} from "@cmmn/core";
import {Stream} from "../streams/stream";
import {DirectStream} from "../streams/direct-stream";
import {WorkerStream} from "../streams/workerStream";
import {Transferable} from "../streams/transferable";
import {Locator} from "../shared/locator";
import {ModelLike} from "../shared/types";
import {EntityLocator} from "./entity-locator.service";

export {proxy} from "../shared/domain.structure";
export {ModelProxy} from "./modelProxy";
export {Stream} from "../streams/stream";
export {WorkerStream} from "../streams/workerStream";
export {ModelMap} from "../model-map";
export {ChildWindowConnector} from "../window/child-window";
export * from "../shared/types"
//
// export function useStreamDomain(root: ModelLike<any, any>): Container {
//     return Container.withProviders(
//         {provide: Locator, useValue: new RootLocator(root)},
//         {provide: Stream, useClass: DirectStream}
//     );
// }

export function useWorkerDomain(workerUrl: string): Container {
    const stream = new WorkerStream(workerUrl);
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
import {IFactory} from "../shared/factory";
import {Container, registerSerializer} from "@cmmn/core";
import {ProxyFactory} from "../proxyFactory";
import {Stream} from "../streams/stream";
import {DirectStream} from "../streams/direct-stream";
import {WorkerStream} from "../streams/workerStream";
import {Transferable} from "../streams/transferable";
export {proxy} from "../shared/domain.structure";
export {IFactory} from "../shared/factory";
export {ProxyFactory} from "../proxyFactory";
export {ModelProxy} from "../modelProxy";
export {Stream} from "../streams/stream";
export {WorkerStream} from "../streams/workerStream";
export {ModelMap} from "../model-map";
export {ChildWindowConnector} from "../window/child-window";
export * from "../shared/types"

export function useStreamDomain(Factory: {new(...args: any[]):IFactory}) {
    return Container.withProviders({
        provide: IFactory, useClass: ProxyFactory
    }, Factory, {
        provide: Stream, useClass: DirectStream, deps: [Factory]
    });
}

export async function useWorkerDomain(workerUrl: string) {
    const stream = new WorkerStream(workerUrl);
    return Container.withProviders({
        provide: IFactory, useClass: ProxyFactory
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
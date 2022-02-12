import {IFactory} from "../shared/factory";
import {Container} from "@cmmn/core";
import {ProxyFactory} from "../proxyFactory";
import {Stream} from "../streams/stream";
import {DirectStream} from "../streams/direct-stream";
import {WorkerStream} from "../streams/workerStream";
export {proxy} from "../shared/domain.structure";
export {IFactory} from "../shared/factory";
export {ProxyFactory} from "../proxyFactory";
export {ModelProxy} from "../modelProxy";
export {Stream} from "../streams/stream";
export {WorkerStream} from "../streams/workerStream";
export {ModelMap} from "../model-map";
export * from "../shared/types"

export function useDomain(factory: IFactory) {
    return Container.withProviders({
        provide: IFactory, useValue: factory
    });
}
export function useStreamDomain(Factory: {new(...args: any[]):IFactory}) {
    return Container.withProviders({
        provide: IFactory, useClass: ProxyFactory
    }, Factory, {
        provide: Stream, useClass: DirectStream, deps: [Factory]
    });
}

export async function useWorkerDomain(workerUrl: string) {
    const stream = new WorkerStream(workerUrl);
    await stream.Connected;
    return Container.withProviders({
        provide: IFactory, useClass: ProxyFactory
    }, {
        provide: Stream, useValue: stream
    });
}

import {Container, inject, ResolvablePromise, singleton, uuid} from "@cmmn/core";
import {Transport} from "../../transport/transport";
import {RpcMessage, RpcService} from "./types";

@singleton()
export class RpcClient {

    @inject(Transport<RpcMessage>) transport!: Transport<RpcMessage>;

    private answers: Record<string, ResolvablePromise> = {};

    getProxy<T extends RpcService>(name: string) {
        return new Proxy<T>({} as T, {
            get: (target: any, p: string, receiver: any): any => {
                if (typeof p === "symbol") return undefined;
                return (target[p] ??= (...args) => {
                    const id = uuid();
                    this.transport.send('rpc', {
                        service: name,
                        args,
                        method: p,
                        id
                    });
                    return this.answers[id] = new ResolvablePromise();
                });
            }
        })
    }

    static factory<T extends RpcService>(name: string): (c: Container) => T {
        return c => c.resolve(RpcClient).getProxy(name);
    }

    private unsubscribe = this.transport.on('rpc', e => {
        if ('args' in e) return;
        if (!(e.id in this.answers)) return;
        if ('error' in e) {
            this.answers[e.id].reject(e.error);
        } else {
            this.answers[e.id].resolve(e.result);
        }
    });

    [Symbol.dispose]() {
        this.unsubscribe();
    }
}
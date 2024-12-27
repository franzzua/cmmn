import {Container, inject, singleton} from "@cmmn/core";
import {Transport} from "../../transport/transport";
import {RpcMessage} from "./types";

@singleton()
export class RpcServer {
    @inject(Transport<RpcMessage>) transport!: Transport<RpcMessage>;
    @inject(Container) container!: Container;

    private unsubscribe = this.transport.on('rpc', async e => {
        if (!('args' in e)) return;
        const service = this.container.resolve(e.service as any);
        try {
            const result = await service[e.method].apply(service, e.args);
            this.transport.send('rpc', {
                id: e.id,
                result,
            });
        } catch (e) {
            this.transport.send('rpc', {
                id: e.id,
                error: e.message,
            });
        }
    });

    [Symbol.dispose]() {
        this.unsubscribe();
    }
}
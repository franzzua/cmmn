import { LoroMessage } from "../crdt/loro.message";
import {LoroProtocol} from "../crdt/loroProtocol";
import {getOrAdd} from "@cmmn/core";

export class BroadcastLoroProtocol extends LoroProtocol<string> implements AsyncDisposable {
    private bcMap = new Map<string, BroadcastChannel & Disposable>();

    constructor(private peerId: string) {
        super();
    }

    public send(topic: string, message: LoroMessage) {
        this.getChannel(topic).postMessage({
            message: LoroMessage.serialize(message),
            from: this.peerId
        });
    }
     join(topic: string): void {
        this.getChannel(topic);
    }
     leave(topic: any): void {
        this.getChannel(topic)[Symbol.dispose]();
        this.bcMap.delete(topic);
    }

    private getChannel(name: string){
        return getOrAdd(this.bcMap, name, () => {
            const bc = new BroadcastChannel(name);
            const abort = new AbortController();
            bc.addEventListener("message", e => {
                const { message, from } = e.data;
                this.onMessage(LoroMessage.deserialize(message), from, name);
            }, abort);
            bc[Symbol.dispose] = () => {
                abort.abort();
                bc.close();
            };
            return bc;
        });
    }
    async [Symbol.asyncDispose](){
        for (let topic of this.bcMap.keys()) {
            this.leave(topic);
        }
    }
}
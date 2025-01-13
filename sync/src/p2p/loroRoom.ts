import {Libp2p, PeerId} from "@libp2p/interface";
import {LoroDoc} from "loro-crdt";
import {bind, Fn} from "@cmmn/core";
import {LoroMessage, LoroMessageType} from "./loro.message";
import {LibP2PServices} from "./p2p.node";

export class LoroRoom implements AsyncDisposable {
    private static protocol = 'loro:v1'

    constructor(private p2p: Libp2p<LibP2PServices>,
                private peerId: PeerId,
                private topic: string,
                private doc: LoroDoc) {
        this.p2p.services.pubsub.subscribe(this.topic);
        this.p2p.services.pubsub.addEventListener('message', this.topicListener);

        this.p2p.handle(LoroRoom.protocol, async e => {
            for await (let [uint8] of e.stream.source) {
                const message = LoroMessage.deserialize(uint8);
                switch (message.type) {
                    case LoroMessageType.Update:
                        this.doc.import(message.update);
                        break;
                    case LoroMessageType.Request: {
                        await e.stream.sink([LoroMessage.serialize({
                            type: LoroMessageType.Update,
                            update: this.doc.export({
                                mode: "update",
                                from: message.version
                            })
                        })]);
                        break;
                    }
                }
            }
        });
        this.sendVersion();
    }

    @bind()
    async topicListener(e: Event & { detail: { data: Uint8Array }}) {
        const message = LoroMessage.deserialize(e.detail.data);
        switch (message.type) {
            case LoroMessageType.Update:
                this.doc.import(message.update);
                break;
            case LoroMessageType.Join:
                const compare = this.doc.version().compare(message.version);
                if (compare == 0) return;
                if (compare === undefined || compare < 0) {
                    await this.sendTo(message.peerId, {
                        type: LoroMessageType.Request,
                        version: this.doc.version()
                    });
                }
                if (compare === undefined || compare > 0) {
                    await this.sendTo(message.peerId, {
                        type: LoroMessageType.Update,
                        update: this.doc.export({
                            mode: "update",
                            from: message.version
                        })
                    });
                }
        }
    }
    private version = this.doc.version();
    private docUnsubscribe = this.doc.subscribe(async e => {
        const update = this.doc.export({
            mode: 'update',
            from: this.version
        });
        this.version = this.doc.version();
        await this.send({type: LoroMessageType.Update, update: update});
    });
    private async sendVersion() {
        await Fn.asyncDelay(5);
        await this.send({
            type: LoroMessageType.Join,
            peerId: this.peerId,
            version: this.doc.version()
        });
    }

    private send(message: LoroMessage) {
        return this.p2p.services.pubsub.publish(this.topic, LoroMessage.serialize(message));
    }

    private async sendTo(peerId: PeerId, message: LoroMessage) {
        const conn = await this.p2p.dialProtocol(peerId, LoroRoom.protocol);
        await conn.sink([LoroMessage.serialize(message)]);
        if (message.type == LoroMessageType.Request){
            for await (const [update] of conn.source){
                const msg = LoroMessage.deserialize(update);
                if (msg.type == LoroMessageType.Update){
                    this.doc.import(msg.update);
                }
            }
        }
    }

    async [Symbol.asyncDispose]() {
        this.p2p.services.pubsub.unsubscribe(this.topic);
        this.p2p.services.pubsub.removeEventListener('message', this.topicListener);
        this.docUnsubscribe();
    }
}

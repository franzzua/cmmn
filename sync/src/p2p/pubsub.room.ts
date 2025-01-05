import {Libp2p, PeerId} from "@libp2p/interface";
import {LoroDoc} from "loro-crdt";
import {Fn} from "@cmmn/core";
import {LoroMessage, LoroMessageType} from "./loro.message";
import {LibP2PServices} from "./p2p.node";
import * as console from "node:console";

export class PubsubRoom implements AsyncDisposable {
    private static protocol = 'loro:v1'
    private doc: LoroDoc;

    constructor(private p2p: Libp2p<LibP2PServices>,
                private peerId: PeerId,
                private topic: string) {
        this.p2p.services.pubsub.subscribe(this.topic);
        this.p2p.addEventListener('connection:open', e => {
            console.log(e);
        })
        this.p2p.handle(PubsubRoom.protocol, async e => {
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
        })
    }

    async handle(message: LoroMessage) {
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

    async sync(doc: LoroDoc): Promise<AsyncDisposable> {
        this.doc = doc;
        const listener = async e => {
            const message = LoroMessage.deserialize(e.detail.data);
            await this.handle(message);
        }
        this.p2p.services.pubsub.addEventListener('message', listener);
        const docUnsubscribe = doc.subscribe(async e => {
            const update = doc.export({
                mode: 'update'
            });
            await this.send({type: LoroMessageType.Update, update: update});
        });
        await Fn.asyncDelay(5);

        await this.send({
            type: LoroMessageType.Join,
            peerId: this.peerId,
            version: doc.version()
        });
        return {
            [Symbol.asyncDispose]: async () => {
                docUnsubscribe();
                this.p2p.services.pubsub.removeEventListener('message', listener);
            }
        }
    }

    send(message: LoroMessage) {
        return this.p2p.services.pubsub.publish(this.topic, LoroMessage.serialize(message));
    }

    async [Symbol.asyncDispose]() {
        this.p2p.services.pubsub.unsubscribe(this.topic);
    }

    private async sendTo(peerId: PeerId, message: LoroMessage) {
        const conn = await this.p2p.dialProtocol(peerId, PubsubRoom.protocol);
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
}

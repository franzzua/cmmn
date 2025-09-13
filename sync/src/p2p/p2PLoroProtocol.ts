import {LoroMessage} from "../crdt/loro.message";
import {bind, Fn} from "@cmmn/core";
import {LoroProtocol} from "../crdt/loroProtocol";
import {PeerId, PubSub} from "@libp2p/interface";

export class P2PLoroProtocol extends LoroProtocol implements AsyncDisposable {

    topics = new Set();

    constructor(private peerId: string, private pubsub: PubSub) {
        super();
        this.topics.add(peerId);
        pubsub.addEventListener('message', this.topicListener);
        pubsub.subscribe(peerId);
    }

    @bind()
    async topicListener(e: Event & { detail: { data: Uint8Array; from?: PeerId; topic?: string } }) {
        if (!this.topics.has(e.detail.topic))
            return;
        const from = e.detail.from;
        const message = LoroMessage.deserialize(e.detail.data);
        if (!message) {
            // console.log(`Unknown message from `, e.detail.topic ?? from, e.detail.data);
            return;
        }
        this.onMessage(message, from.toString(), e.detail.topic)
    }

    public async send(topic: string, message: LoroMessage) {
        return this.pubsub.publish(topic, LoroMessage.serialize(message))
    }

    join(topic: string) {
        this.topics.add(topic)
        this.pubsub.subscribe(topic);
    }

    leave(topic: string) {
        this.topics.delete(topic);
        this.pubsub.unsubscribe(topic);
    }

    async getPeers(topic: string) {
        return this.pubsub.getSubscribers(topic);
    }

    abort = new AbortController();

    async [Symbol.asyncDispose]() {
        this.abort.abort();
        this.pubsub.removeEventListener('message', this.topicListener);
        this.pubsub.unsubscribe(this.peerId);
        await this.peersAwaiter;
    }


    peersAwaiter: Promise<void> | undefined;

    async waitPeers(protocol: LoroProtocol, count: number, topic: string) {
        while (!this.abort.signal.aborted) {
            const peers = await this.getPeers(topic);
            if (peers.length >= count)
                return peers;
            // return [];
            // TODO: change to events
            await (this.peersAwaiter = Fn.asyncDelay(1000));
            this.peersAwaiter = undefined;
        }
    }
}
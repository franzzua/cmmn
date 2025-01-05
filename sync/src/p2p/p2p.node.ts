import {singleton} from "@cmmn/core";
import {Libp2p, PubSub} from "@libp2p/interface";
import {LoroDoc} from "loro-crdt";
import {PubsubRoom} from "./pubsub.room";

@singleton()
export abstract class P2PNode implements AsyncDisposable {

    protected p2p: Libp2p<LibP2PServices>;
    protected init: Promise<void> = this.createLibp2p().then(p2p => {
        this.p2p = p2p;
    });
    private rooms: Record<string, PubsubRoom> = {};
    abstract createLibp2p(): Promise<Libp2p<LibP2PServices>>;

    async getPeers() {
        await this.init;
        return this.p2p.getPeers();
    }

    /** @internal **/
    async join(uri: string, doc: LoroDoc): Promise<AsyncDisposable> {
        await this.init;
        const room = this.rooms[uri] ??= new PubsubRoom(this.p2p, this.p2p.peerId, uri);
        return await room.sync(doc);
    }

    async [Symbol.asyncDispose](){
        await this.init;
        await this.p2p.stop();
    }
}


export type LibP2PServices = {
    pubsub: PubSub
}
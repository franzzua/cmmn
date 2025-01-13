import {cell, ObservableSet, singleton} from "@cmmn/core";
import type {Libp2p, PeerId, PubSub} from "@libp2p/interface";
import {LoroDoc} from "loro-crdt";
import {LoroRoom} from "./loroRoom";

@singleton()
export abstract class P2PNode implements AsyncDisposable {

    protected p2p: Libp2p<LibP2PServices>;
    public readonly init: Promise<void> = this.initP2P();
    abstract createLibp2p(): Promise<Libp2p<LibP2PServices>>;

    private accessor _peers = new ObservableSet<PeerId>();

    @cell()
    public get peers(): Set<PeerId> { return this._peers; }

    private async initP2P(){
        this.p2p = await this.createLibp2p();
        for (let peer of this.p2p.getPeers()) {
            this._peers.add(peer);
        }
        this.p2p.addEventListener('peer:connect', e => this._peers.add(e.detail));
        this.p2p.addEventListener('peer:disconnect', e => this._peers.delete(e.detail));
    }

    async getPeers() {
        await this.init;
        return this.p2p.getPeers();
    }

    /** @internal **/
    async join(uri: string, doc: LoroDoc): Promise<AsyncDisposable> {
        await this.init;
        return new LoroRoom(this.p2p, this.p2p.peerId, uri, doc);
    }

    async [Symbol.asyncDispose](){
        await this.init;
        await this.p2p.stop();
    }
}


export type LibP2PServices = {
    pubsub: PubSub
}
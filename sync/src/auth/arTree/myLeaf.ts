import {Node} from "./node";

import {utils} from "./utils";
import {VirtualNode} from "./virtualNode";
import {Leaf} from "./leaf";
import {MyPeer, Peer} from "./peer";

export class MyLeaf extends Node {
    size = 1;

    constructor(public readonly peer: MyPeer) {
        super(peer.ephemeral.publicKey, peer.ephemeral.privateKey);
    }

    static async create(): Promise<MyLeaf> {
        return new MyLeaf(await MyPeer.generate());
    }

    getPublicKey() {
        return this.peer.export();
    }


    public async add(node: Node): Promise<Node> {
        const sk = await utils.getSharedKey(this.sk, node.pk);
        const pk = await utils.getPublicKey(sk);
        return new VirtualNode(this, node, pk, sk);
    }

    getSharedKey(): Promise<CryptoKey> {
        return Promise.resolve(undefined);
    }

    *getPublicKeys(): Iterable<CryptoKey> {
        yield this.pk;
    }

    getLeafKeys(): Iterable<CryptoKey> {
        return this.getPublicKeys();
    }
}
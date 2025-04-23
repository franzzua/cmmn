import {Node} from "./node";

import {utils} from "./utils";
import {VirtualNode} from "./virtualNode";
import {Deserializer} from "../../p2p/deserializer";
import {Peer} from "./peer";

export class Leaf extends Node {
    size = 1;

    constructor(public readonly peer: Peer,
                pk: CryptoKey,
                sk: CryptoKey) {
        super(pk, sk);
    }

    getSharedKey(): Promise<CryptoKey> {
        throw new Error('Not implemented');
    }

    public async add(node: Node): Promise<Node> {
        const sk = await utils.getSharedKey(node.sk, this.pk);
        const pk = await utils.getPublicKey(sk);
        return new VirtualNode(node, this, pk, sk);
    }

    *getPublicKeys(): Iterable<CryptoKey> {
        yield this.pk;
    }
    getLeafKeys(): Iterable<CryptoKey> {
        return this.getPublicKeys();
    }
}
import {Node} from "./node";
import {Leaf} from "./leaf";

import {utils} from "./utils";

export class VirtualNode extends Node {
    size = this.left.size + this.right.size + 1;

    constructor(private left: Node,
                private right: Node,
                pk: CryptoKey,
                sk: CryptoKey) {
        super(pk, sk);
    }

    public async add(node: Node): Promise<Node> {
        if (this.right.size > this.left.size) {
            this.right = await this.right.add(node);
        } else {
            this.left = await this.left.add(node);
        }
        this.size++;
        return this;
    }

    static async create(left: Node, right: Node): Promise<VirtualNode> {
        const sk: CryptoKey = await utils.hkdf((left instanceof Leaf)
            ? await utils.getSharedKey(right.sk, left.pk)
            : await utils.getSharedKey(left.sk, right.pk));
        const pk = await utils.getPublicKey(sk);
        return new VirtualNode(left, right, pk, sk);
    }

    getSharedKey() {
        if (this.left instanceof Leaf) {
            return utils.getSharedKey(this.right.sk, this.left.pk);
        }
        return utils.getSharedKey(this.left.sk, this.right.pk);
    }

    *getPublicKeys(): Iterable<CryptoKey> {
        yield * this.left.getPublicKeys()
        yield this.pk;
        yield * this.right.getPublicKeys()
    }

    *getLeafKeys(): Iterable<CryptoKey> {
        yield * this.left.getLeafKeys();
        yield * this.right.getLeafKeys();
    }
}
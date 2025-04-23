import {MyLeaf} from "./myLeaf";
import { Node } from "./node";
import {Leaf} from "./leaf";
import {utils} from "./utils";
import {Peer} from "./peer";

export class ArTree {
    private exchange = utils.createKey()
    private readonly me = MyLeaf.create();
    private root: Promise<Node> = this.me;
    private stage: Promise<CryptoKeyPair> = this.getStage();

    constructor() {
    }

    public async getPublicKey(){
        return this.me.then(x => x.getPublicKey())
    }

    async add(peerData: Uint8Array): Promise<void> {
        const peer = await Peer.parse(peerData);
        const me = await this.me;
        const sk = await utils.X3DH.send(me.peer.identity, peer.identity, await this.exchange, peer.ephemeral);
        const pk = await utils.getPublicKey(sk);
        const leaf = new Leaf(peer, pk, sk);
        this.root = (await this.root).add(leaf);
    }

    async getSharedKey() {
        return this.stage.then(x => x.privateKey).then(utils.export);
    }


    async getStage(): Promise<CryptoKeyPair> {
        const stage = await this.stage;
        const root = await this.root;
        const keys = await utils.concat([
            stage ? stage.privateKey : null,
            root.sk,
            ...root.getPublicKeys()
        ].filter(x => x));
        const info = await utils.concat([
            ...root.getLeafKeys()
        ]);
        const privateKey = await utils.hkdf(keys, info);
        const publicKey = await utils.getPublicKey(privateKey);
        return {
            privateKey, publicKey
        };
    }
}

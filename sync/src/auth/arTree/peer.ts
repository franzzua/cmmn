import {Deserializer} from "../../p2p/deserializer";
import {utils} from "./utils";
import {Serializer} from "../../p2p/serializer";

export class Peer {
    protected constructor(
        public readonly identity: CryptoKey,
        public readonly ephemeral: CryptoKey,
        public readonly signature: Uint8Array,
    ) {
    }

    static async parse(peerData: Uint8Array) {
        const des = new Deserializer(peerData);
        return new Peer(
            await crypto.subtle.importKey("raw", des.readUint8Array(), utils.curve, true, []),
            await crypto.subtle.importKey("raw", des.readUint8Array(), utils.curve, true, []),
            des.readUint8Array()
        );
    }

    private exported: Uint8Array;
    async export() {
        return this.exported ??= Serializer.serialize([
            new Uint8Array(await crypto.subtle.exportKey('raw', this.identity)),
            new Uint8Array(await crypto.subtle.exportKey('raw', this.ephemeral)),
            this.signature,
        ])
    }
}
export class MyPeer  {
    protected constructor(
        public readonly identity: CryptoKeyPair,
        public readonly ephemeral: CryptoKeyPair,
        public readonly signature: Uint8Array
    ) {
    }
    static async generate(): Promise<MyPeer>{
        const identity = await utils.createKey();
        const ephemeral = await utils.createKey();
        const signature = await utils.sign(ephemeral.privateKey, await utils.export(ephemeral.publicKey));
        return new MyPeer(identity, ephemeral, new Uint8Array(signature));
    }

    private exported: Uint8Array;
    async export() {
        return this.exported ??= Serializer.serialize([
            new Uint8Array(await utils.export(this.identity.publicKey)),
            new Uint8Array(await utils.export(this.ephemeral.publicKey)),
            this.signature,
        ])
    }
}
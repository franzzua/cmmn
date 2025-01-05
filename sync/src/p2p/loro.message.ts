import {VersionVector} from "loro-crdt";
import {PeerId} from "@libp2p/interface";
import {peerIdFromCID} from "@libp2p/peer-id";
import {CID} from "multiformats";

type LoroUpdateMessage = {
    type: LoroMessageType.Update;
    update: Uint8Array;
}
type LoroRequestMessage = {
    type: LoroMessageType.Request;
    version: VersionVector;
}
type LoroJoinMessage = {
    type: LoroMessageType.Join;
    peerId: PeerId;
    version: VersionVector;
}

export enum LoroMessageType {
    Update,
    Request,
    Join
}

export type LoroMessage =
    | LoroUpdateMessage
    | LoroJoinMessage
    | LoroRequestMessage
    ;
export const LoroMessage = {
    serialize(msg: LoroMessage) {
        const data = msg.type == LoroMessageType.Update
            ? msg.update
            : msg.version.encode();
        const peerId = msg.type == LoroMessageType.Join
            ? msg.peerId.toCID().bytes
            : new Uint8Array();
        return Serializer.from([
            msg.type,
            peerId,
            data
        ]);
    },
    deserialize(data: Uint8Array): LoroMessage {
        const des = new Deserializer(data);
        const type = des.readByte();
        const peerId = des.readUint8Array();
        const bytes = des.readUint8Array();

        switch (type) {
            case LoroMessageType.Update:
                return {
                    type: type,
                    update: bytes
                }
            case LoroMessageType.Request:
                return {
                    type: type,
                    version: VersionVector.decode(bytes)
                }
            case LoroMessageType.Join:
                return {
                    type: type,
                    peerId: peerIdFromCID(CID.decode(peerId)),
                    version: VersionVector.decode(bytes)
                }
        }
    }
}

class Serializer {
    public uint8 = new Uint8Array(this.size);
    private index = 0;

    constructor(private size: number) {
    }

    writeByte(value: number) {
        this.uint8[this.index++] = value;
    }

    writeInt16(value: number) {
        this.writeByte(Math.floor(value / 256));
        this.writeByte(value % 256);
    }

    writeUint8array(uint8: Uint8Array) {
        this.writeInt16(uint8.length)
        this.uint8.set(uint8, this.index)
        this.index += uint8.length;
    }

    write(value: number | Uint8Array) {
        if (typeof value === "number")
            this.writeByte(value);
        else
            this.writeUint8array(value);
    }

    static from(data: Array<number | Uint8Array>) {
        const size = data
            .map(x => typeof x === "number" ? 1 : (x.length + 2))
            .reduce((a, b) => a + b, 0);
        const res = new Serializer(size);
        for (let datum of data) {
            res.write(datum);
        }
        return res.uint8;
    }
}

class Deserializer {
    private index = 0;

    constructor(private uint8: Uint8Array) {
    }

    readByte() {
        return this.uint8[this.index++];
    }

    readInt16() {
        return this.readByte() * 256 + this.readByte();
    }

    readUint8Array() {
        const len = this.readInt16();
        const uint8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            uint8[i] = this.uint8[this.index++];
        }
        return uint8;
    }
}
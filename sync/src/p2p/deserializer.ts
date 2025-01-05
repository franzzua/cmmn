export class Deserializer {
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
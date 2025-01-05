export class Serializer {
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

    writeInt32(value: number) {
        this.writeInt16(Math.floor(value / (256 * 256)));
        this.writeInt16(value % (256 * 256));
    }

    writeUint8array(uint8: Uint8Array) {
        this.writeInt16(uint8.length)
        this.uint8.set(uint8, this.index)
        this.index += uint8.length;
    }

    write(value: SerializerType) {
        if (value instanceof Uint8Array)
            this.writeUint8array(value);
        else switch (value.size) {
            case 8:
                this.writeByte(value.value);
                break;
            case 16:
                this.writeInt16(value.value);
                break;
            case 32:
                this.writeInt32(value.value);
                break;
        }
    }

    static serialize(data: Array<SerializerType>) {
        const size = data
            .map(Serializer.typeSize)
            .reduce((a, b) => a + b, 0);
        const res = new Serializer(size);
        for (let datum of data) {
            res.write(datum);
        }
        return res.uint8;
    }

    static typeSize(data: SerializerType){
        if (data instanceof Uint8Array)
            return data.length + 2;
        return data.size / 8;
    }
}


type SerializerType =
    | Uint8Array
    | { value: number, size: 8 | 16 | 32 }


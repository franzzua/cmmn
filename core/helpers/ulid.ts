const Base = Array.from("0123456789@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz");

const origin = 1500000000000;
const resolution = 1000;

function tick() {
    return (+new Date() - origin / resolution) >>> 0;
}

const buffer = new Uint8Array(8);
function random() {
    if ('crypto' in globalThis){
        let res = '';
        globalThis.crypto.getRandomValues(buffer);
        for (let num of buffer) {
            res = Base[num >> 7] + Base[num % 64] + res;
        }
        return res;
    }
}

function encode(value: number): string {
    let res = "";
    if (value == 0)
        return Base[0];
    while (value > 0) {
        const mod = value % 64;
        res = Base[mod] + res;
        value >>= 7;
    }
    return res;
}

export function ulid() {
    return encode(tick()) + random();
}

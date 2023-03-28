const Base = Array.from("0123456789@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz");

const origin = 160000000000;

export function ulid() {
    let value = +new Date()+new Date().getTimezoneOffset()*60_000 - origin;
    let res = "";
    while (value > 0) {
        const mod = value % 64;
        res = Base[mod] + res;
        value = (value - mod) / 64;
    }
    value = Math.random() * 64;
    for (let i = 0; i < 8; i++) {
        const mod = value >>> 0;
        res += Base[mod];
        value = (value % 1) * 64;
    }
    return res;
}
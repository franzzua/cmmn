import {addExtension, Packr } from 'msgpackr/pack';

const packr = new Packr({
    structuredClone: true,
}) as Packr & {offset: number;};

export function registerSerializer<T, U>(type: number, classFunction: Function, write: (value: T) => U, read: (value: U) => T) {
    // console.log(type, classFunction, globalThis);
    addExtension({
        Class: classFunction,
        write: write,
        read: read,
        type: type
    })
}

export function serialize(data: any): Uint8Array {
    // const time = performance.now();
    // const offset = packr.offset;
    const result = packr.encode(data);
    // const dur = performance.now() - time;
    // if (dur > 10){
    //     console.warn(dur, data);
    // }
    // const length = packr.offset - offset;
    // return {buffer: result.buffer, byteLength: length, byteOffset: offset, length: result.length} as Uint8Array;
    return  result;
}

export function deserialize(bytes: Uint8Array) {
    // const time = performance.now();
    const res = packr.decode(bytes);
    // const dur = performance.now() - time;
    // if (dur > 10){
    //     console.warn(dur, res);
    // }
    return res;
}

// registerSerializer<DateTime, number>(1, DateTime,
//     x => x.toMillis(),
//     millis => utc(millis)
// );
//
// registerSerializer<Duration, number>(2, Duration,
//     x => x.toMillis(),
//     millis => Duration.fromMillis(millis)
// );
//
// registerSerializer<Map<any, any>, ReadonlyArray<[number, number]>>(100,
//     perm => perm instanceof Map,
//     perm => [...perm],
//     array => new Map(array)
// );
//
// registerSerializer<Set<any>, ReadonlyArray<[any]>>(100,
//     perm => perm instanceof Set,
//     perm => [...perm],
//     array => new Set(array)
// );
//
// const refBuffer = {
//     serialize(data, cache = new Map()) {
//         if (cache.has(data))
//             return cache.get(data);
//         if (
//             !(typeof data === "object")
//             || data instanceof Map
//             || data instanceof Set
//         )
//             return data;
//         for (const dataKey in data) {
//             if ()
//         }
//     }
// }

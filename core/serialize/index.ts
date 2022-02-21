import {addExtension, Packr } from 'msgpackr/pack';
import {DateTime, Duration, utc} from "../helpers/utc";

const packr = new Packr({
    structuredClone: true,
});

export function registerSerializer<T, U>(type: number, classFunction: Function, write: (value: T) => U, read: (value: U) => T) {
    addExtension({
        Class: classFunction,
        write: write,
        read: read,
        type: type
    })
}

export function serialize(data: any): Uint8Array {
    return packr.encode(data);
}

export function deserialize(bytes: Uint8Array) {
    return packr.decode(bytes);
}

registerSerializer<DateTime, number>(1, DateTime,
    x => x.epochMilliseconds,
    millis => utc(millis)
);

registerSerializer<Duration, number>(2, Duration,
    x => x.total('milliseconds'),
    millis => new Duration(0,0,0,0,0,0,0,millis)
);
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

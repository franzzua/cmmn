import {Operator} from "./pipe";

export function map<T, U = T>(selector: (x: T) => U): Operator<T, U> {
    return async function* (ai: AsyncIterable<T>): AsyncIterable<U> {
        for await (let t of ai) {
            yield selector(t);
        }
    }
}
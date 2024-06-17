import { filter, map, pipe } from "../src/operators";
import { NaturalNumbers } from "../src/sources/naturalNumbers";
import { share } from "../src/operators/share";

export function timer(interval: number) {
    return filter<number>(x => x % interval == 0)(new NaturalNumbers());
}

export const sharedTimer = () => share<number>()(timer(1));
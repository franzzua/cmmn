import {describe} from "node:test";
import {pipe} from "../helpers";
import {expect} from "@cmmn/tools/test";

describe('pipe', () => {
    const res = pipe(
        (a: number, b: number) => a + b,
        x => x.toFixed(),
        a => +a + 5,
        b => b.toFixed() + 3,
        pipe(
            x => x,
            pipe(
                x => x,
                x => x,
                x => x,
                x => x,
                x => x,
                x => x,
            ),
            x => x,
            x => x,
            pipe(
                x => x,
                x => x,
                x => +x,
                x => x,
                x => x,
                x => x,
            ),
            x => x,
        ),
    )(3, 2);
    expect(res).toEqual(103);
});

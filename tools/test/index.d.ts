export {suite, test, timeout,} from "@testdeck/jest";
import {expect as expectBase, Assertion} from "expect.js";
import * as sinonModule from "sinon";
export const expect: (obj: any) => Assertion = expectBase;

export type AssertionExt = Assertion & {
    toEqual: Assertion["eql"]
}
export const sinon = sinonModule;
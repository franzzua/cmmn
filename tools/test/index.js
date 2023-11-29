import * as test from "node:test";
Object.assign(globalThis, test);
export {suite, test, timeout,} from "@testdeck/jest";
import { expect as expectBase, registerValidator, isEqual} from "earl";
import assert from "node:assert";
// import * as globals from "@jest/globals";
export * as sinon from "sinon";
registerValidator("toBe", isEqual)
registerValidator("toBeInstanceOf", type => value => value instanceof type)
registerValidator("toHaveProperty", (prop, value) => obj => isEqual(obj[prop], value))
export const expect = expectBase;
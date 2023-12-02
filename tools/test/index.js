import * as test from "node:test";
Object.assign(globalThis, test);
export {suite, test, timeout,} from "@testdeck/jest";
import { expect as expectBase, registerValidator, isEqual, formatCompact} from "earl";
// import * as globals from "@jest/globals";
export * as sinon from "sinon";
registerValidator("toHaveProperty", (control, prop, value) => {
    const actualInline = formatCompact(control.actual)
    const actualValue = formatCompact(control.actual[prop])
    control.assert({
        success: control.actual[prop] === value,
        reason: `The value ${actualInline}[${prop}] = ${actualValue} is not equal to ${value}, but is expected to be eqaul`,
        negatedReason: `The value ${actualInline}[${prop}] = ${actualValue} is equal to ${value}, but is expected not to be eqaul`,
    })
})
export const expect = expectBase;
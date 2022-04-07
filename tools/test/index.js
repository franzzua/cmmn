export {suite, test, timeout,} from "@testdeck/jest";
import * as globals from "@jest/globals";
import * as sinon1 from "sinon/pkg/sinon.js";
export const sinon = sinon1.default;
const {expect} = globals;
export {expect};
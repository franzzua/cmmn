import {suite, test, timeout,} from "@testdeck/jest";
import {expect} from "@jest/globals";

import {utc} from "../helpers/utc";

@suite
export class UtcSpec {

    @test
    utc() {
        const time = utc();
        expect(time).not.toBeNull();
    }
}
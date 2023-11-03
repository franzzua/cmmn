import {suite, test, expect} from "@cmmn/tools/test";

import {utc} from "../helpers/utc";

@suite
export class UtcSpec {

    @test
    utc() {
        const time = utc();
        expect(time).not.toBeNull();
    }
}
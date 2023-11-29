import "../helpers/helpers";
import {suite, test, expect} from "@cmmn/tools/test";

import {utc} from "../helpers/utc";

@suite
export class UtcSpec {

    @test
    utc() {
        const time = utc();
        console.log(time.toISOString());
        expect(time).not.toBeNullish();
    }
}
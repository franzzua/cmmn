import {expect, suite, test} from "@cmmn/tools/test";
import { Cell } from "../../cell/cell";

@suite
export class DebugKeySpec{

    @test
    testDebugKey(){
        const cell = new Cell(null);
        // expect(cell.debug).toEqual('DebugKeySpec.testDebugKey');
    }
}
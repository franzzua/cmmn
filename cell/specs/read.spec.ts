import {expect, suite, test} from "@cmmn/tools/test";
import {BaseCell} from '../src/baseCell.js';

@suite
class ReadSpec {
    @test
    readCell() {
        const a = new BaseCell(1);
        expect(a.get()).toEqual(1);
        expect(a['value']).toEqual(1);
    }

    @test
    readCell2() {
        const a = new BaseCell(() => 1);
        expect(a.get()).toEqual(1);
    }

    @test
    readCells() {
        const b = new BaseCell(1);
        const c = new BaseCell(() => b.get() + 1)
        expect(c.get()).toEqual(2);
    }

}
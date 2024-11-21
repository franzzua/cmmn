import {expect, mock, suite, test} from "@cmmn/tools/test";
import {Cell} from '../../cell/cell.js';
import {Graph} from "../../cell/graph";

@suite
export class CompareSpec {

    @test
    async notChangeIfCompare() {
        const cell = new Cell<number>(2, {
            compare: (a, b) => a % 2 === b % 2
        });
        const onChange = mock.fn();
        cell.on('change', onChange);
        cell.set(6)
        await Graph.wait;
        expect(onChange.mock.callCount()).toEqual(0);
        cell.set(3)
        await Graph.wait;
        expect(onChange.mock.callCount()).toEqual(1);
    }


    @test
    async notChangeIfCompareKey() {
        const cell = new Cell<{ value: number }, number>({value: 2}, {
            compare: (a, b) => a % 2 === b % 2,
            compareKey: a => a.value
        });
        const onChange = mock.fn();
        cell.on('change', onChange);
        cell.set({value: 6})
        await Graph.wait;
        expect(onChange.mock.callCount()).toEqual(0);
        cell.set({value: 3})
        await Graph.wait;
        expect(onChange.mock.callCount()).toEqual(1);
    }
}
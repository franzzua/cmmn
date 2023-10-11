import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {Cell} from '../src/cell.js';
import {Actualizator} from "../src/actualizator.js";

@suite
export class CompareSpec {

    @test
    async notChangeIfCompare() {
        const cell = new Cell<number>(2, {
            compare: (a, b) => a % 2 === b % 2
        });
        const onChange = sinon.spy();
        cell.on('change', onChange);
        cell.set(6)
        await Actualizator.wait;
        expect(onChange.callCount).toEqual(0);
        cell.set(3)
        await Actualizator.wait;
        expect(onChange.callCount).toEqual(1);
    }


    @test
    async notChangeIfCompareKey() {
        const cell = new Cell<{ value: number }, number>({value: 2}, {
            compare: (a, b) => a % 2 === b % 2,
            compareKey: a => a.value
        });
        const onChange = sinon.spy();
        cell.on('change', onChange);
        cell.set({value: 6})
        await Actualizator.wait;
        expect(onChange.callCount).toEqual(0);
        cell.set({value: 3})
        await Actualizator.wait;
        expect(onChange.callCount).toEqual(1);
    }
}
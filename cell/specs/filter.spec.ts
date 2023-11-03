import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {Cell} from '../src/cell.js';
import {Actualizator} from "../src/actualizator";

@suite
export class FilterSpec{

    @test
    failReadForbidden(){
        const cell = new Cell(0,{
            filter: x => x > 5
        });
        expect(cell.get.bind(cell)).toThrow();
    }

    @test
    async notChangeIfForbidden() {
        const cell = new Cell(5, {
            filter: x => x > 5
        });
        const onChange = sinon.spy();
        cell.on('change', onChange);
        cell.set(6)
        await Actualizator.wait;
        expect(onChange.callCount).toEqual(1);
        cell.set(3)
        await Actualizator.wait;
        expect(onChange.callCount).toEqual(1);
    }
}
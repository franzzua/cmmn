import { suite, test, sinon, expect } from "@cmmn/tools/test";
import {CellQuery} from "../src/cell.query";
import { Fn } from "@cmmn/core";
import {Cell} from "@cmmn/cell";
import {CellMutation} from "../src/cell.mutation";
@suite
export class CellMutationSpec {

    @test
    async timeout(){
        const mutation = new CellMutation<number, number>(async x => Fn.asyncDelay(100).then(() => x));
        expect(mutation.get().isFetching).toBeFalsy();
        mutation.active();
        mutation.fetch(1);
        await Fn.asyncDelay(10);
        expect(mutation.get().isFetching).toBeTruthy();
        await Fn.asyncDelay(110);
        expect(mutation.get().result).toEqual(1);
        mutation.fetch(2);
        await Fn.asyncDelay(110);
        expect(mutation.get().result).toEqual(2);
    }

    //
    @test
    async race(){
        const mutation = new CellMutation<number, number>(async x => {
            return Fn.asyncDelay(x).then(() => x);
        });
        mutation.active();
        mutation.fetch(200);
        await Fn.asyncDelay(150);
        mutation.fetch(100);
        await Fn.asyncDelay(70);
        const value = mutation.get();
        expect(value.result).not.toEqual(200);
        console.log(value)
        // expect(mutation.get().isFetching).toBeTruthy();
        await Fn.asyncDelay(30);
        expect(mutation.get().result).toEqual(100);
    }

}
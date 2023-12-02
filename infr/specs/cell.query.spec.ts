import { suite, test, sinon, expect } from "@cmmn/tools/test";
import {CellQuery} from "../src/cell.query";
import { Fn } from "@cmmn/core";
import {Cell} from "@cmmn/cell";
@suite
export class CellQuerySpec {

    @test
    async timeout(){
        const request = sinon.spy(() => new Promise(r => setTimeout(r, 100)).then(() => 1));
        const cellQuery = new CellQuery<number>(request);
        expect(request.callCount).toEqual(0);
        expect(cellQuery.get().isFetching).toBeFalsy();
        expect(request.callCount).toEqual(0);
        const onChange = sinon.spy();
        cellQuery.on('change', onChange);
        await Fn.asyncDelay(10);
        expect(request.callCount).toEqual(1);
        expect(onChange.callCount).toEqual(1);
        expect(cellQuery.get().isFetching).toBeTruthy();
        await Fn.asyncDelay(110);
        expect(cellQuery.get().isFetching).toBeFalsy();
        expect(cellQuery.get().result).toEqual(1);
    }

    @test
    async error(){
        const request = () => new Promise(r => setTimeout(r, 100)).then(() => {throw new Error()});
        const cellQuery = new CellQuery<number>(request);
        cellQuery.active();
        await Fn.asyncDelay(110);
        expect(cellQuery.get().isFetching).toBeFalsy();
        expect(cellQuery.get().result).toBeFalsy();
        expect(cellQuery.get().error).toBeA(Error)
    }

    @test
    async dependency(){
        const cell = new Cell(1)
        const cellQuery = new CellQuery<number>(async () => {
            const value = cell.get();
            await Fn.asyncDelay(100);
            return value;
        });
        cellQuery.active();
        await Fn.asyncDelay(110);
        expect(cellQuery.get().result).toEqual(cell.get());
        cell.set(2)
        await Fn.asyncDelay(110);
        expect(cellQuery.get().result).toEqual(cell.get());
    }
}
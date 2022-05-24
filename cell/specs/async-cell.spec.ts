import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {AsyncCell} from "../src/AsyncCell";
import {ResolvablePromise} from "@cmmn/core";

@suite
export class AsyncCellSpec{

    @test
    async simpleAsyncTest(){
        const gen = new MockGenerator();
        gen.Next(0);
        const cell = new AsyncCell(() => gen.getValues());
        const changeTracker = sinon.spy(() => {});
        cell.on('change', changeTracker);
        await new Promise(r => setTimeout(r, 20));
        gen.Next(10);
        // TODO: works slightly slow, why?
        await new Promise(r => setTimeout(r, 20));
        expect(cell.get()).toEqual(10)
    }
}

class MockGenerator{
    private promise = new ResolvablePromise();

    public Next(value){
        this.promise.resolve(value);
    }

    public async *getValues(){
        while (true){
            const res = await this.promise;
            yield res;
            this.promise = new ResolvablePromise<any>();
        }
    }
}
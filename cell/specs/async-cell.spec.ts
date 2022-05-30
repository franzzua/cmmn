import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {AsyncCell} from "../src/AsyncCell";
import {ResolvablePromise} from "@cmmn/core";
import {Cell} from '../src/cell';

@suite
export class AsyncCellSpec{

    @test
    async AsyncGeneratorTest(){
        const gen = new MockGenerator();
        gen.Next(7);
        const cell = new AsyncCell(() => gen.getValues());
        const changeTracker = sinon.spy(() => {});
        cell.on('change', changeTracker);
        await new Promise(r => setTimeout(r, 20));
        expect(cell.get()).toEqual(7);
        gen.Next(10);
        // TODO: works slightly slow, why?
        await new Promise(r => setTimeout(r, 20));
        expect(cell.get()).toEqual(10)
    }

    @test
    async PromiseTest() {
        const asyncCell = new AsyncCell(() => new Promise(resolve => {
            setTimeout(() => resolve('hello'), 5)
        }).then(
            x => x + ' world')
        );
        const cell = new Cell(() => asyncCell.get());
        cell.get();
        await new Promise(r => setTimeout(r, 20));
        expect(cell.get()).toEqual('hello world');
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

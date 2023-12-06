import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {AsyncCell} from "../src/AsyncCell";
import {Fn, ResolvablePromise} from "@cmmn/core";
import {Cell} from '../src/cell.js';
import {BaseCell} from "../src/baseCell";

@suite
export class AsyncCellSpec{

    @test
    async AsyncGeneratorTest(){
        const gen = new MockGenerator<number>();
        gen.Next(7);
        const cell = new AsyncCell<number>(() => gen.getValues());
        cell.active();
        await Fn.asyncDelay(20)
        expect(cell.get()).toEqual(7);
        gen.Next(10);
        // TODO: works slightly slow, why?
        await Fn.asyncDelay(20)
        expect(cell.get()).toEqual(10)
    }

    @test
    async PromiseTest() {
        const asyncCell = new AsyncCell(() => Fn.asyncDelay(30).then(() => 'hello world'));
        asyncCell.active();
        await Fn.asyncDelay(30)
        expect(asyncCell.get()).toEqual('hello world');
    }

    @test
    async generatorWithDeps(){
        const baseCell = new BaseCell(1);
        const cell = new AsyncCell<number>(() => (async function *(val){
            yield 0;
            await Fn.asyncDelay(100);
            yield val;
        })(baseCell.get()));
        console.log('active');
        cell.active();
        await Fn.asyncDelay(10);
        expect(cell.get()).toEqual(0);
        await Fn.asyncDelay(100);
        expect(cell.get()).toEqual(1);
        console.log('set 2');
        baseCell.set(2)
        await Fn.asyncDelay(10);
        expect(cell.get()).toEqual(0);
        await Fn.asyncDelay(100);
        expect(cell.get()).toEqual(2);
    }

    @test
    async race() {
        const delay = new Cell(0);
        const asyncCell = new AsyncCell(async () => {
            const time = delay.get()
            await Fn.asyncDelay(time);
            return time;
        });
        asyncCell.active();
        await Fn.asyncDelay(0)
        expect(asyncCell.get()).toEqual(0);
        delay.set(200);
        await Fn.asyncDelay(150);
        delay.set(100);
        await Fn.asyncDelay(70);
        expect(asyncCell.get()).toEqual(0);
        await Fn.asyncDelay(40);
        expect(asyncCell.get()).toEqual(100);
    }
}

class MockGenerator<T>{
    private promise = new ResolvablePromise<T>();

    public Next(value:T){
        this.promise.resolve(value);
    }

    public async *getValues(){
        while (true){
            const res = await this.promise;
            yield res;
            this.promise = new ResolvablePromise<T>();
        }
    }
}
